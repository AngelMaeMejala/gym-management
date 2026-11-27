# FitZone backend and integration verification

ITEC 116 final project. Tested on **27 November 2026** in Asia/Manila.

| Total cases | Passed | Failed | Passing percentage |
| ---: | ---: | ---: | ---: |
| 153 | 153 | 0 | 100.0% |

Each row counts as one case. The existing API regression suite ran 45 checks and counts as one grouped case. The final run exercised all **38 REST operations** registered in the [API controller](backend/src/api.ts).

## Completion status

| Requirement | Result | Evidence |
| --- | --- | --- |
| Login, JWT, protected routes, and role-based access control | Passed | Admin and member sign-ins, verified HS256 token, missing and invalid token rejection, expired signed token rejection, and role and ownership checks. |
| bcrypt password hashing and backend input validation | Passed | SQL confirmed bcrypt cost 12 and successful password comparison for a test registration. Invalid values, duplicate emails, invalid images, invalid counts, and duplicate suppliers were rejected. |
| Member management | Passed | Administrators can create, list, read, edit, and deactivate member accounts. Deactivation preserves history and disables sign-in. |
| Schedule management | Passed | Create, list, detail, update, delete, schedule visibility, conflicting slot rejection, and concurrent request checks succeeded. |
| Booking management | Passed | Members can create, list, read, edit, and cancel eligible requests. Pending edits and cancellations enforce ownership. Admin approval and rejection persist and generate member notifications. |
| Equipment and inventory management | Passed | Equipment creation creates its stock row transactionally. Inventory reads and quantity updates work. Equipment deletion removes linked stock. Availability responds to changes in quantity and condition. |
| Supplier management | Passed | Admin-only create, list, detail, update, and delete passed. The admin browser screen successfully saved and displayed a supplier. |
| Database and API integration | Passed | Live XAMPP port 3306, NestJS port 3000, Vite port 5173, application database login, original rows and foreign keys, migrations, CORS, frontend proxy, and restart persistence verified. |

## Environment and preservation

- The live database was copied from the workspace listener on port 3307 to XAMPP MariaDB on port 3306. The existing application SQL password authenticated at the destination. The original table contents and foreign keys matched before switching the API. The original database remains on port 3307 as a point-in-time rollback copy.
- The supplier migration added a table while preserving the six original application tables and their rows. All eight tables matched following a second live API start, including the migrations table. Account credentials and profile-picture storage settings were preserved.
- The complete write suite used a disposable XAMPP schema and isolated uploads. The live Chrome test used one temporary member, then removed it and verified the original accounts still matched. Admin browser tests and the rest of the write suite used the isolated schema.
- Both builds passed. The Postman collection now includes a Supplier Management folder. Its JSON and scripts were validated. The endpoint behavior was exercised by automated HTTP requests. [Postman collection](postman/Gym%20Management.postman_collection.json) ? [API smoke suite](scripts/smoke-api.cjs)

## Test results

| ID | Module | Scenario | Expected | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| FT-001 | Live XAMPP integration | Confirm destination schema and application account are unused | Available | Available | Pass |
| FT-002 | Live XAMPP integration | Existing application password authenticates to XAMPP | TCP 3306 | TCP 3306 | Pass |
| FT-003 | Live XAMPP integration | Compare original and imported table contents | Identical rows in every original table | Identical rows in every original table | Pass |
| FT-004 | Live XAMPP integration | Compare imported foreign key relationships | Identical foreign keys | Identical foreign keys | Pass |
| FT-005 | Live XAMPP integration | Start live NestJS on port 3000 with XAMPP database | HTTP 401 on protected request | HTTP 401 on protected request | Pass |
| FT-006 | Live XAMPP integration | Apply supplier migration to the imported schema | One migration, empty supplier table | One migration, empty supplier table | Pass |
| FT-007 | Live XAMPP integration | Migration preserves original application rows | All six application tables unchanged | All six application tables unchanged | Pass |
| FT-008 | Live XAMPP integration | Restart live NestJS on port 3000 | HTTP 401 on protected request | HTTP 401 on protected request | Pass |
| FT-009 | Live XAMPP integration | Verify every migrated table after live restart | All eight tables unchanged | All eight tables unchanged | Pass |
| FT-010 | Live XAMPP integration | React returns HTML on port 5173 | HTTP 200 | HTTP 200 | Pass |
| FT-011 | Live XAMPP integration | Vite API proxy uses restarted backend | HTTP 401 | HTTP 401 | Pass |
| FT-012 | Live XAMPP integration | Live API permits the configured frontend origin | Allowed origin | Allowed origin | Pass |
| FT-013 | Integration | XAMPP MariaDB responds on TCP 3306 | Assertion succeeds | SQL query confirmed port 3306 | Pass |
| FT-014 | Integration | Restricted database account authenticates | Assertion succeeds | Connected to isolated schema | Pass |
| FT-015 | Integration | NestJS starts and runs migrations on XAMPP | Assertion succeeds | Protected endpoint responded on isolated API port 3100 | Pass |
| FT-016 | Integration | Browser preflight | 204 | 204 | Pass |
| FT-017 | Integration | Configured CORS origin and auth header | Assertion succeeds | Verified | Pass |
| FT-018 | Integration | Unconfigured origin receives no CORS authorization | Assertion succeeds | Verified | Pass |
| FT-019 | Authentication and security | Missing token | 401 | 401 | Pass |
| FT-020 | Authentication and security | Invalid token | 401 | 401 | Pass |
| FT-021 | Authentication and security | Invalid credentials | 401 | 401 | Pass |
| FT-022 | Authentication and security | Administrator login | 200 | 200 | Pass |
| FT-023 | Authentication and security | Valid HS256 token has a two-hour lifetime | Assertion succeeds | Verified | Pass |
| FT-024 | Authentication and security | Expired but correctly signed token | 401 | 401 | Pass |
| FT-025 | Authentication and security | Read administrator account details | 200 | 200 | Pass |
| FT-026 | Authentication and security | Account response contains role and omits password | Assertion succeeds | Verified | Pass |
| FT-027 | Authentication and security | Reject invalid email and extra input | 400 | 400 | Pass |
| FT-028 | Authentication and security | Reject mismatched passwords | 400 | 400 | Pass |
| FT-029 | Authentication and security | Register member | 201 | 201 | Pass |
| FT-030 | Authentication and security | Reject case-insensitive duplicate email | 409 | 409 | Pass |
| FT-031 | Authentication and security | Member login | 200 | 200 | Pass |
| FT-032 | Authentication and security | Stored registration password is bcrypt cost 12 | Assertion succeeds | Verified | Pass |
| FT-033 | Authentication and security | Read member account details through Vite proxy | 200 | 200 | Pass |
| FT-034 | Authentication and security | Member role and account details | Assertion succeeds | Verified | Pass |
| FT-035 | Authentication and security | Member denied user management | 403 | 403 | Pass |
| FT-036 | Authentication and security | Member denied inventory management | 403 | 403 | Pass |
| FT-037 | Authentication and security | Admin denied member booking creation | 403 | 403 | Pass |
| FT-038 | Dashboards and member management | Admin dashboard API | 200 | 200 | Pass |
| FT-039 | Dashboards and member management | Member dashboard API | 200 | 200 | Pass |
| FT-040 | Dashboards and member management | Admin creates member | 201 | 201 | Pass |
| FT-041 | Dashboards and member management | Admin lists members | 200 | 200 | Pass |
| FT-042 | Dashboards and member management | Created member is listed | Assertion succeeds | Verified | Pass |
| FT-043 | Dashboards and member management | Admin edits member | 200 | 200 | Pass |
| FT-044 | Dashboards and member management | Member update returned edited details | Assertion succeeds | Verified | Pass |
| FT-045 | Schedules and bookings | Create schedule | 201 | 201 | Pass |
| FT-046 | Schedules and bookings | Reject schedule overlap | 409 | 409 | Pass |
| FT-047 | Schedules and bookings | Update schedule | 200 | 200 | Pass |
| FT-048 | Schedules and bookings | Member lists schedules | 200 | 200 | Pass |
| FT-049 | Schedules and bookings | Updated schedule returned by read endpoint | Assertion succeeds | Verified | Pass |
| FT-050 | Schedules and bookings | Delete schedule | 204 | 204 | Pass |
| FT-051 | Schedules and bookings | Submit member booking 12:00 | 201 | 201 | Pass |
| FT-052 | Schedules and bookings | New booking starts pending | Assertion succeeds | Verified | Pass |
| FT-053 | Schedules and bookings | Reject overlapping member booking | 409 | 409 | Pass |
| FT-054 | Schedules and bookings | Submit member booking 13:00 | 201 | 201 | Pass |
| FT-055 | Schedules and bookings | Submit member booking 14:00 | 201 | 201 | Pass |
| FT-056 | Schedules and bookings | Member cannot approve booking | 403 | 403 | Pass |
| FT-057 | Schedules and bookings | Admin approves booking | 200 | 200 | Pass |
| FT-058 | Schedules and bookings | Reject second decision | 409 | 409 | Pass |
| FT-059 | Schedules and bookings | Admin rejects booking | 200 | 200 | Pass |
| FT-060 | Schedules and bookings | Member cancels own booking | 200 | 200 | Pass |
| FT-061 | Schedules and bookings | Booking decisions and cancellation return correct states | Assertion succeeds | Verified | Pass |
| FT-062 | Schedules and bookings | Admin lists bookings | 200 | 200 | Pass |
| FT-063 | Schedules and bookings | Member lists own bookings | 200 | 200 | Pass |
| FT-064 | Schedules and bookings | Booking lists contain all three persisted state changes | Assertion succeeds | Verified | Pass |
| FT-065 | Notifications | Read admin notifications | 200 | 200 | Pass |
| FT-066 | Notifications | Read member notifications | 200 | 200 | Pass |
| FT-067 | Notifications | Member received both booking decisions | Assertion succeeds | Verified | Pass |
| FT-068 | Notifications | Admin receives schedule notifications | Assertion succeeds | Verified | Pass |
| FT-069 | Notifications | Cross-account notification updates are rejected | 404 | 404 | Pass |
| FT-070 | Notifications | Member marks notification read | 200 | 200 | Pass |
| FT-071 | Notifications | Notification status persisted as READ | Assertion succeeds | Verified | Pass |
| FT-072 | Equipment and inventory | Member denied equipment creation | 403 | 403 | Pass |
| FT-073 | Equipment and inventory | Reject invalid equipment condition | 400 | 400 | Pass |
| FT-074 | Equipment and inventory | Create equipment and linked inventory | 201 | 201 | Pass |
| FT-075 | Equipment and inventory | List inventory | 200 | 200 | Pass |
| FT-076 | Equipment and inventory | New equipment starts unavailable with zero stock | Assertion succeeds | Verified | Pass |
| FT-077 | Equipment and inventory | Reject negative stock | 400 | 400 | Pass |
| FT-078 | Equipment and inventory | Update inventory quantity | 200 | 200 | Pass |
| FT-079 | Equipment and inventory | Member views equipment availability | 200 | 200 | Pass |
| FT-080 | Equipment and inventory | Positive stock makes good equipment available | Assertion succeeds | Verified | Pass |
| FT-081 | Equipment and inventory | Edit equipment condition | 200 | 200 | Pass |
| FT-082 | Equipment and inventory | Repair condition overrides stock availability | Assertion succeeds | Verified | Pass |
| FT-083 | Profile pictures | New member has no profile picture | 404 | 404 | Pass |
| FT-084 | Profile pictures | Admin denied member-only upload | 403 | 403 | Pass |
| FT-085 | Profile pictures | Reject invalid image content | 400 | 400 | Pass |
| FT-086 | Profile pictures | Upload PNG | 204 | 204 | Pass |
| FT-087 | Profile pictures | Download profile picture | 200 | 200 | Pass |
| FT-088 | Profile pictures | Profile picture bytes and MIME type match | Assertion succeeds | Verified | Pass |
| FT-089 | Extended CRUD | Read member by ID | 200 | 200 | Pass |
| FT-090 | Extended CRUD | Member denied user detail endpoint | 403 | 403 | Pass |
| FT-091 | Extended CRUD | Member deletion cannot deactivate administrator | 404 | 404 | Pass |
| FT-092 | Extended CRUD | Deactivate member through DELETE | 204 | 204 | Pass |
| FT-093 | Extended CRUD | Read retained member record | 200 | 200 | Pass |
| FT-094 | Extended CRUD | Member deletion preserves history and disables account | Assertion succeeds | Verified | Pass |
| FT-095 | Extended CRUD | Deactivated member cannot sign in | 401 | 401 | Pass |
| FT-096 | Extended CRUD | Create schedule for detail tests | 201 | 201 | Pass |
| FT-097 | Extended CRUD | Member reads visible schedule by ID | 200 | 200 | Pass |
| FT-098 | Extended CRUD | Cancel schedule for detail authorization | 200 | 200 | Pass |
| FT-099 | Extended CRUD | Member cannot read cancelled schedule by ID | 404 | 404 | Pass |
| FT-100 | Extended CRUD | Admin can read cancelled schedule | 200 | 200 | Pass |
| FT-101 | Extended CRUD | Delete detail test schedule | 204 | 204 | Pass |
| FT-102 | Extended CRUD | Submit member booking 17:00 | 201 | 201 | Pass |
| FT-103 | Extended CRUD | Admin reads booking by ID | 200 | 200 | Pass |
| FT-104 | Extended CRUD | Member edits own pending booking | 200 | 200 | Pass |
| FT-105 | Extended CRUD | Booking change persisted with same ID | Assertion succeeds | Verified | Pass |
| FT-106 | Extended CRUD | Approved booking cannot be edited | 409 | 409 | Pass |
| FT-107 | Extended CRUD | Register second member for ownership checks | 201 | 201 | Pass |
| FT-108 | Extended CRUD | Second member signs in | 200 | 200 | Pass |
| FT-109 | Extended CRUD | Other member cannot read booking | 404 | 404 | Pass |
| FT-110 | Extended CRUD | Other member cannot edit booking | 404 | 404 | Pass |
| FT-111 | Extended CRUD | Other member cannot delete booking | 404 | 404 | Pass |
| FT-112 | Extended CRUD | Member cancels booking through DELETE | 204 | 204 | Pass |
| FT-113 | Extended CRUD | Read retained booking history | 200 | 200 | Pass |
| FT-114 | Extended CRUD | Booking deletion records cancelled status | Assertion succeeds | Verified | Pass |
| FT-115 | Extended CRUD | Read equipment by ID | 200 | 200 | Pass |
| FT-116 | Extended CRUD | Read inventory by ID | 200 | 200 | Pass |
| FT-117 | Extended CRUD | Member denied inventory detail endpoint | 403 | 403 | Pass |
| FT-118 | Supplier management | Anonymous supplier access denied | 401 | 401 | Pass |
| FT-119 | Supplier management | Member supplier access denied | 403 | 403 | Pass |
| FT-120 | Supplier management | Reject invalid supplier phone | 400 | 400 | Pass |
| FT-121 | Supplier management | Create supplier | 201 | 201 | Pass |
| FT-122 | Supplier management | Reject duplicate supplier name | 409 | 409 | Pass |
| FT-123 | Supplier management | List suppliers | 200 | 200 | Pass |
| FT-124 | Supplier management | Supplier appears in list | Assertion succeeds | Verified | Pass |
| FT-125 | Supplier management | Get supplier details | 200 | 200 | Pass |
| FT-126 | Supplier management | Update supplier contact information | 200 | 200 | Pass |
| FT-127 | Restart persistence | Read profile picture after API restart | 200 | 200 | Pass |
| FT-128 | Restart persistence | Read bookings after API restart | 200 | 200 | Pass |
| FT-129 | Restart persistence | Read stock after API restart | 200 | 200 | Pass |
| FT-130 | Restart persistence | Read notifications after API restart | 200 | 200 | Pass |
| FT-131 | Restart persistence | SQL member edit, booking states, stock, notification and image survived restart | Assertion succeeds | Verified | Pass |
| FT-132 | Equipment and inventory | Delete equipment | 204 | 204 | Pass |
| FT-133 | Equipment and inventory | Check stock after equipment deletion | 200 | 200 | Pass |
| FT-134 | Equipment and inventory | Equipment deletion cascades to linked inventory | Assertion succeeds | Verified | Pass |
| FT-135 | Supplier management | Read supplier after restart | 200 | 200 | Pass |
| FT-136 | Supplier management | Supplier contact edit persisted | Assertion succeeds | Verified | Pass |
| FT-137 | Supplier management | Delete supplier | 204 | 204 | Pass |
| FT-138 | Supplier management | Deleted supplier no longer exists | 404 | 404 | Pass |
| FT-139 | Browser | Admin sign-in and dashboard in Chrome | Assertion succeeds | Dashboard rendered after authenticated API calls | Pass |
| FT-140 | Browser | Admin creates supplier through browser | Assertion succeeds | Supplier displayed after API write | Pass |
| FT-141 | Browser | Admin logout | Assertion succeeds | Returned to sign-in and session storage cleared | Pass |
| FT-142 | Browser | Member registration in Chrome | Assertion succeeds | Confirmation displayed | Pass |
| FT-143 | Browser | Member login and account details | Assertion succeeds | Verified | Pass |
| FT-144 | Browser | Member dashboard in Chrome | Assertion succeeds | Booking summary rendered | Pass |
| FT-145 | Browser | Member logout | Assertion succeeds | Returned to sign-in and session storage cleared | Pass |
| FT-146 | Regression | Existing API regression suite | Assertion succeeds | Passed 45 API checks. | Pass |
| FT-147 | Live browser | Live browser registration writes to XAMPP | One member row on port 3306 | One member row on port 3306 | Pass |
| FT-148 | Live browser | Authenticated profile through the live Vite proxy | 200 MEMBER | 200 MEMBER | Pass |
| FT-149 | Live browser | Live member logout | Session cleared | Session cleared | Pass |
| FT-150 | Live browser | Remove the temporary member and compare original accounts | Original accounts match | Original accounts match | Pass |
| FT-151 | Build | Build NestJS and the React production bundle | Exit 0 | Exit 0 | Pass |
| FT-152 | Postman | Parse collection JSON and compile six added supplier tests | Valid JSON and scripts | Valid JSON and scripts | Pass |
| FT-153 | Cleanup | Remove isolated schema, database account, and upload directory | No isolated resources remain | No isolated resources remain | Pass |

## Remaining issues and scope

- The final run had 0 failed cases. The academic requirements supplied in this conversation were covered by the cases above.
- Member removal deactivates the account, and booking removal records a cancellation. Inventory records are created and deleted with their equipment. These operations preserve account and booking history and maintain referential integrity.
- Logout clears the browser session. The API continues to accept an otherwise valid issued JWT until expiration while the account is active. Server-side logout revocation was outside the supplied JWT requirements.
