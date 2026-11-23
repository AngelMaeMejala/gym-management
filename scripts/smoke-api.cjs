const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config();

const base = process.env.TEST_API_URL || 'http://localhost:' + (process.env.PORT || 3000) + '/api/v1';
let checks = 0;

async function call(method, path, expected, token, body) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(token && { Authorization: 'Bearer ' + token }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  });
  const payload = response.status === 204 ? undefined : await response.json();
  assert.ok([expected].flat().includes(response.status), method + ' ' + path + ' returned ' + response.status + ', expected ' + expected);
  if (payload) assert.doesNotMatch(JSON.stringify(payload), /"password"\s*:/);
  checks++;
  return { status: response.status, payload };
}

async function verify() {
  const run = randomUUID();
  const password = randomUUID();
  await call('GET', '/auth/me', 401);
  await call('GET', '/auth/me', 401, 'invalid.token.value');
  const login = async (email, password) => (await call('POST', '/auth/login', 200, null, { email, password })).payload.accessToken;
  const admin = await login(process.env.BOOTSTRAP_ADMIN_EMAIL, process.env.BOOTSTRAP_ADMIN_PASSWORD);
  const users = [];
  let equipment;
  const schedules = [];
  try {
    for (const role of ['STAFF', 'MEMBER']) {
      const fields = { firstName: 'API test', lastName: role, email: run + '.' + role.toLowerCase() + '@gym.local', role, accountStatus: 'ACTIVE' };
      const { payload } = await call('POST', '/users', 201, admin, { ...fields, password });
      users.push({ id: payload.userId, fields });
      await call('POST', '/users', 409, admin, { ...fields, password });
    }
    const [staffUser, memberUser] = users;
    const staff = await login(staffUser.fields.email, password);
    const member = await login(memberUser.fields.email, password);
    assert.equal((await call('GET', '/auth/me', 200, member)).payload.userId, memberUser.id);
    await call('GET', '/users', 403, member);
    await call('GET', '/inventory', 403, member);
    const date = new Date(Date.UTC(2090, 0, 1 + parseInt(run.slice(0, 6), 16) % 2800)).toISOString().slice(0, 10);
    const input = { activityName: 'Concurrency test ' + run, scheduleDate: date, startTime: '09:00', endTime: '10:00', status: 'SCHEDULED' };
    await call('POST', '/schedules', 400, admin, { ...input, scheduleDate: '2090-02-30' });
    await call('POST', '/schedules', 400, admin, { ...input, endTime: '08:00' });
    await call('POST', '/schedules', 403, member, input);
    const race = await Promise.all([
      call('POST', '/schedules', [201, 409], admin, input),
      call('POST', '/schedules', [201, 409], staff, input),
    ]);
    schedules.push(...race.filter(result => result.status === 201).map(result => result.payload.scheduleId));
    assert.deepEqual(race.map(result => result.status).sort(), [201, 409]);
    const own = (await call('POST', '/schedules', 201, staff, { ...input, startTime: '10:00', endTime: '11:00' })).payload;
    schedules.push(own.scheduleId);
    const adminSlot = (await call('POST', '/schedules', 201, admin, { ...input, startTime: '11:00', endTime: '12:00' })).payload;
    schedules.push(adminSlot.scheduleId);
    await call('PUT', '/schedules/' + adminSlot.scheduleId, 403, staff, { ...input, startTime: '11:00', endTime: '12:00' });
    await call('PUT', '/schedules/' + own.scheduleId, 200, staff, { ...input, startTime: '10:00', endTime: '11:00', status: 'CANCELLED' });
    const visible = (await call('GET', '/schedules', 200, member)).payload;
    assert.ok(visible.some(row => row.scheduleId === schedules[0]));
    assert.ok(!visible.some(row => row.scheduleId === own.scheduleId));
    await call('DELETE', '/schedules/' + own.scheduleId, 403, staff);
    const notices = (await call('GET', '/notifications', 200, member)).payload;
    const notice = notices.find(row => row.scheduleId === own.scheduleId && row.notificationType === 'SCHEDULE_CANCELLED');
    assert.ok(notice);
    await call('PATCH', '/notifications/' + notice.notificationId + '/read', 404, staff);
    assert.equal((await call('PATCH', '/notifications/' + notice.notificationId + '/read', 200, member)).payload.deliveryStatus, 'READ');
    const kit = { equipmentName: 'Test dumbbells', category: 'Strength', equipmentCondition: 'GOOD', availabilityStatus: 'AVAILABLE' };
    await call('POST', '/equipment', 403, staff, kit);
    equipment = (await call('POST', '/equipment', 201, admin, kit)).payload.equipmentId;
    await call('PUT', '/equipment/' + equipment, 200, admin, { ...kit, availabilityStatus: 'MAINTENANCE' });
    assert.ok((await call('GET', '/equipment', 200, member)).payload.some(row => row.equipmentId === equipment));
    const stock = (await call('GET', '/inventory', 200, staff)).payload.find(row => row.equipmentId === equipment);
    assert.equal(stock.quantity, 0);
    await call('PATCH', '/inventory/' + stock.inventoryId, 400, staff, { quantity: -1 });
    await call('PATCH', '/inventory/' + stock.inventoryId, 403, member, { quantity: 10 });
    const updated = (await call('PATCH', '/inventory/' + stock.inventoryId, 200, staff, { quantity: 10 })).payload;
    assert.equal(updated.quantity, 10);
    assert.equal(updated.updatedByUserId, staffUser.id);
    await call('GET', '/dashboard', 200, admin);
    await call('PUT', '/users/' + memberUser.id, 200, admin, { ...memberUser.fields, accountStatus: 'INACTIVE' });
    await call('GET', '/auth/me', 401, member);
    await call('POST', '/auth/login', 401, null, { email: memberUser.fields.email, password });
  } finally {
    if (equipment) {
      await call('DELETE', '/equipment/' + equipment, 204, admin);
      assert.ok(!(await call('GET', '/inventory', 200, admin)).payload.some(row => row.equipmentId === equipment));
    }
    for (const id of schedules) await call('DELETE', '/schedules/' + id, 204, admin);
    for (const { id, fields } of users) await call('PUT', '/users/' + id, 200, admin, { ...fields, accountStatus: 'INACTIVE' });
  }
  console.log('Passed ' + checks + ' API checks.');
}

verify().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
