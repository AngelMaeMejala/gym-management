import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, BicepsFlexed, Bike, Box, CalendarDays, Camera, Check, CircleAlert, CircleUserRound, ClipboardList, createLucideIcon, Dumbbell, Eye, EyeOff, Footprints, HeartPulse, LayoutDashboard, LoaderCircle, LockKeyhole, LogIn, LogOut, Mail, Medal, Pencil, Plus, Search, Timer, Trash2, Users, X } from 'lucide-react';
import './style.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/v1' : 'http://localhost:3000/api/v1'),
});
const sessionKey = 'gym-access-token';
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem(sessionKey);
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && sessionStorage.getItem(sessionKey)) {
    sessionStorage.removeItem(sessionKey);
    window.dispatchEvent(new Event('gym-session-expired'));
  }
  return Promise.reject(error);
});

const errorText = error => [error.response?.data?.message || (error.response ? 'The request failed.' : 'Could not connect to the API.')].flat().join(' ');
const label = value => String(value).toLowerCase().replaceAll('_', ' ').replace(/^./, first => first.toUpperCase());
const profileName = user => [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
function memberFirstName(user) {
  const [initial = '', ...rest] = Array.from(profileName(user).split(/\s+/, 1)[0].toLowerCase());
  return initial.toUpperCase() + rest.join('');
}
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Manila' }).format(new Date());
const date = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'Asia/Manila' }).format(new Date(value)) : '—';
const dateTime = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(value)) : '—';
const time = value => value?.slice(0, 5) || '—';
const badge = value => <span className={'badge ' + value.toLowerCase()}>{label(value)}</span>;
const equipmentAvailability = ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'];
function derivedAvailability(condition, quantity) {
  if (condition === 'NEEDS_REPAIR') return 'MAINTENANCE';
  return condition === 'GOOD' && quantity > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
}

const catalog = {
  schedules: {
    title: 'Schedules', item: 'schedule', icon: CalendarDays, id: 'scheduleId',
    fields: [
      ['activityName', 'Activity', 'text', 100], ['scheduleDate', 'Date', 'date'],
      ['startTime', 'Start time', 'time'], ['endTime', 'End time', 'time'],
      ['status', 'Status', ['SCHEDULED', 'COMPLETED', 'CANCELLED']],
    ],
    defaults: () => ({ scheduleDate: today(), startTime: '08:00', endTime: '09:00', status: 'SCHEDULED' }),
    columns: [['Activity', r => r.activityName], ['Date', r => date(r.scheduleDate)], ['Time', r => time(r.startTime) + ' – ' + time(r.endTime)], ['Status', r => badge(r.status)]],
    search: r => [r.activityName, r.scheduleDate, label(r.status)],
  },
  equipment: {
    title: 'Equipment', item: 'equipment', icon: Dumbbell, id: 'equipmentId',
    fields: [
      ['equipmentName', 'Equipment name', 'text', 100], ['category', 'Category', 'text', 50],
      ['equipmentCondition', 'Condition', ['GOOD', 'NEEDS_REPAIR', 'DAMAGED']],
    ],
    defaults: () => ({ equipmentCondition: 'GOOD' }),
    columns: [['Equipment name', r => r.equipmentName], ['Category', r => r.category], ['Quantity', r => r.quantity ?? '—'], ['Condition', r => badge(r.equipmentCondition)], ['Availability', r => badge(r.availabilityStatus)], ['Date added', r => date(r.dateAdded)]],
    search: r => [r.equipmentName, r.category, label(r.availabilityStatus), label(r.equipmentCondition)],
  },
  inventory: {
    title: 'Inventory', item: 'quantity', icon: Box, id: 'inventoryId',
    fields: [['quantity', 'Quantity', 'number']],
    columns: [['Equipment', r => r.equipment.equipmentName], ['Category', r => r.equipment.category], ['Supplier', r => r.equipment.supplier?.supplierName ?? 'Unassigned'], ['Quantity', r => r.quantity], ['Availability', r => badge(r.equipment.availabilityStatus)], ['Last updated', r => dateTime(r.lastUpdated)]],
    search: r => [r.equipment.equipmentName, r.equipment.category, r.equipment.supplier?.supplierName ?? 'Unassigned', r.quantity, label(r.equipment.availabilityStatus)],
  },
  suppliers: {
    title: 'Suppliers', item: 'supplier', icon: Box, id: 'supplierId',
    fields: [['supplierName', 'Supplier name', 'text', 100], ['contactPerson', 'Contact person', 'text', 100],
      ['phone', 'Contact number', 'tel', 30], ['email', 'Email address', 'email', 100], ['address', 'Address', 'text', 255],
      ['status', 'Status', ['ACTIVE', 'INACTIVE']]],
    defaults: () => ({ status: 'ACTIVE' }),
    columns: [['Supplier', r => r.supplierName], ['Contact person', r => r.contactPerson ?? '—'],
      ['Contact number', r => r.phone], ['Email address', r => r.email], ['Address', r => r.address ?? '—'],
      ['Status', r => badge(r.status)]],
    search: r => [r.supplierName, r.contactPerson ?? '', r.email, r.phone, r.address ?? '', label(r.status)],
  },
  users: {
    title: 'Users', item: 'user', icon: Users, id: 'userId',
    fields: [
      ['firstName', 'First name', 'text', 50], ['lastName', 'Last name', 'text', 50],
      ['email', 'Email', 'email', 100], ['password', 'Password', 'password', 72],
      ['role', 'Role', ['MEMBER', 'STAFF', 'ADMIN']], ['accountStatus', 'Account status', ['ACTIVE', 'INACTIVE']],
    ],
    defaults: () => ({ role: 'MEMBER', accountStatus: 'ACTIVE' }),
    columns: [['Name', r => r.firstName + ' ' + r.lastName], ['Email', r => r.email], ['Role', r => label(r.role)], ['Status', r => badge(r.accountStatus)]],
    search: r => [r.firstName + ' ' + r.lastName, r.email, label(r.role), label(r.accountStatus)],
  },
};

function useResource(path) {
  const [state, setState] = useState({ loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState(previous => ({ ...previous, loading: true, error: '' }));
    api.get(path, { signal: controller.signal }).then(({ data }) => setState({ data, loading: false })).catch(error => {
      if (!axios.isCancel(error)) setState({ error: errorText(error), loading: false });
    });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, refresh: () => setVersion(value => value + 1) };
}

function Brand() {
  return <div className="brand"><span className="brand-icon"><Dumbbell size={23}/></span><div>Gym Management</div></div>;
}

const Barbell = createLucideIcon('Barbell', [
  ['path', { d: 'M2 12h3m3 0h8m3 0h3', key: 'bar' }],
  ['rect', { x: 5, y: 5, width: 3, height: 14, rx: 1, key: 'left-plate' }],
  ['rect', { x: 16, y: 5, width: 3, height: 14, rx: 1, key: 'right-plate' }],
]);
const Kettlebell = createLucideIcon('Kettlebell', [
  ['path', { d: 'M8 9 6.8 5.8A2 2 0 0 1 8.7 3h6.6a2 2 0 0 1 1.9 2.8L16 9', key: 'handle' }],
  ['path', { d: 'M12 8a7 7 0 0 1 7 7v1a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-1a7 7 0 0 1 7-7Z', key: 'weight' }],
]);
const JumpRope = createLucideIcon('JumpRope', [
  ['path', { d: 'M4.5 17V9a7.5 7.5 0 0 1 15 0v8', key: 'rope' }],
  ['rect', { x: 3, y: 16, width: 3, height: 6, rx: 1, key: 'left-grip' }],
  ['rect', { x: 18, y: 16, width: 3, height: 6, rx: 1, key: 'right-grip' }],
]);
const WaterBottle = createLucideIcon('WaterBottle', [
  ['path', { d: 'M9 6V3h6v3m-6 0-3 4v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9l-3-4ZM6 13h12', key: 'bottle' }],
]);
const GymBag = createLucideIcon('GymBag', [
  ['rect', { x: 2, y: 8, width: 20, height: 12, rx: 4, key: 'bag' }],
  ['path', { d: 'M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M7 8v12M17 8v12', key: 'straps' }],
]);

const fitnessDoodles = [
  [Kettlebell, 47, -21], [JumpRope, 36, 18], [WaterBottle, 42, -19], [Dumbbell, 52, 16],
  [Timer, 32, 13], [Barbell, 55, -23], [GymBag, 43, 12], [Footprints, 36, -14],
  [WaterBottle, 39, 20], [HeartPulse, 35, -12], [BicepsFlexed, 44, 16], [Kettlebell, 49, -18],
  [GymBag, 46, -14], [Dumbbell, 41, 26], [Bike, 50, -10], [JumpRope, 40, 23],
  [Barbell, 54, 18], [Footprints, 32, -22], [Timer, 45, 17], [Medal, 40, -11],
];

function AuthLayout({ children }) {
  return <main className="signin">
    <aside className="signin-side">
      <div className="signin-doodles" aria-hidden="true">
        {fitnessDoodles.map(([Icon, size, angle], index) => (
          <Icon key={index} strokeWidth={1.5} style={{ '--doodle-size': `${size}px`, '--doodle-rotation': `${angle}deg` }}/>
        ))}
      </div>
      <Brand/>
      <h1 className="signin-wordmark">FitZone <span>Gym</span></h1>
    </aside>
    <section className="signin-main" aria-labelledby="signin-title"><div className="signin-card">{children}</div></section>
  </main>;
}

function SignIn({ onLogin, registrationMessage }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', credentials);
      sessionStorage.setItem(sessionKey, data.accessToken);
      const profile = await api.get('/auth/me');
      onLogin(profile.data);
    } catch (error) {
      sessionStorage.removeItem(sessionKey);
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return <AuthLayout>
        <header className="signin-heading">
          <h2 id="signin-title">Sign in</h2>
          <p>Welcome back! Please sign in to continue.</p>
        </header>
        {registrationMessage && <p className="auth-success" role="status">{registrationMessage}</p>}
        <form onSubmit={submit} aria-busy={busy}>
          {error && <div role="alert" className="signin-alert"><CircleAlert size={18} aria-hidden="true"/><span>{error}</span></div>}
          <label htmlFor="signin-email">Email
            <span className="signin-input">
              <Mail size={18} aria-hidden="true"/>
              <input id="signin-email" autoComplete="username" name="email" type="email" required placeholder="you@example.com"/>
            </span>
          </label>
          <div className="signin-control">
            <label htmlFor="signin-password">Password</label>
            <div className="signin-input">
              <LockKeyhole size={18} aria-hidden="true"/>
              <input id="signin-password" autoComplete="current-password" name="password" type={showPassword ? 'text' : 'password'} required placeholder="Enter your password"/>
              <button className="signin-toggle" type="button" aria-controls="signin-password" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
              </button>
            </div>
          </div>
          <button className="signin-submit" type="submit" disabled={busy}>
            {busy ? <><LoaderCircle className="signin-spinner" size={18} aria-hidden="true"/>Signing in&hellip;</> : <>Sign in<LogIn size={18} aria-hidden="true"/></>}
          </button>
        </form>
        <p className="auth-switch">Don&apos;t have an account? <NavLink to="/register">Create Account</NavLink></p>
  </AuthLayout>;
}

function Registration() {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const { fullName, email, password, confirmPassword } = Object.fromEntries(new FormData(form));
    const name = fullName.trim().replace(/\s+/g, ' ');
    const address = email.trim().toLowerCase();
    if (!name || !address || !password || !confirmPassword) return setError('Complete all four fields.');
    if (form.elements.email.validity.typeMismatch) return setError('Enter a valid email address.');
    if ([...password].length < 8) return setError('Password must be at least 8 characters.');
    if (new TextEncoder().encode(password).length > 72) return setError('Password must be at most 72 UTF-8 bytes.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', { fullName: name, email: address, password, confirmPassword });
      navigate('/', { replace: true, state: { registrationMessage: data.message } });
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  return <AuthLayout>
    <header className="signin-heading"><h2 id="signin-title">Create Account</h2></header>
    <form onSubmit={submit} aria-busy={busy} noValidate>
      {error && <div role="alert" className="signin-alert"><CircleAlert size={18} aria-hidden="true"/><span>{error}</span></div>}
      <label>Full Name<input name="fullName" autoComplete="name" maxLength={101} required/></label>
      <label>Email Address<input name="email" type="email" autoComplete="email" maxLength={100} required/></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" aria-describedby="registration-password-help" minLength={8} maxLength={72} required/></label>
      <p id="registration-password-help" className="auth-help">Password must be at least 8 characters.</p>
      <label>Confirm Password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required/></label>
      <button className="signin-submit" disabled={busy}>
        {busy ? <><LoaderCircle className="signin-spinner" size={18} aria-hidden="true"/>Creating account&hellip;</> : 'Create Account'}
      </button>
    </form>
    <p className="auth-switch">Already have an account? <NavLink to="/">Sign In</NavLink></p>
  </AuthLayout>;
}

function ReadState({ resource }) {
  if (resource.error) return <div className="error" role="alert">{resource.error} <button type="button" onClick={resource.refresh}>Retry</button></div>;
  if (resource.loading) return <div className="empty" role="status">Loading…</div>;
  return null;
}

function Table({ columns, rows, id, actions, scrollLabel }) {
  if (!rows.length) return <div className="empty">No records found.</div>;
  return <div className="table-wrap" role={scrollLabel ? 'region' : undefined} aria-label={scrollLabel} tabIndex={scrollLabel ? 0 : undefined}><table><thead><tr>{columns.map(([heading]) => <th key={heading}>{heading}</th>)}{actions && <th>Actions</th>}</tr></thead>
    <tbody>{rows.map(row => <tr key={row[id]}>{columns.map(([heading, render]) => <td key={heading}>{render(row)}</td>)}{actions && <td><div className="row-actions">{actions(row)}</div></td>}</tr>)}</tbody></table></div>;
}

function Dialog({ title, onClose, busy, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close" onClick={onClose} disabled={busy}><X size={19}/></button></header>
    {children}
  </dialog>;
}

function Editor({ config, kind, record, onClose, onSave }) {
  const [values, setValues] = useState(() => record ? Object.fromEntries(config.fields.map(([key]) => [key, record[key] ?? ''])) : config.defaults());
  const suppliers = useResource(kind === 'equipment' ? '/suppliers' : null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...values };
      if (kind === 'inventory') payload.quantity = Number(payload.quantity);
      if (record && payload.password === '') delete payload.password;
      await onSave(payload);
    } catch (error) {
      setError(errorText(error));
      setBusy(false);
    }
  }
  return <Dialog title={(record ? 'Edit ' : 'Add ') + config.item} onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="editor">
      {error && <p className="error" role="alert">{error}</p>}
      {config.fields.map(([key, caption, type, max]) => {
        const props = {
          value: values[key] ?? '',
          onChange: event => setValues({ ...values, [key]: event.target.value }),
          required: !(record && key === 'password'),
        };
        return <label key={key}>{caption}{record && key === 'password' && <small>Leave blank to keep the current password</small>}
          {Array.isArray(type) ? <select {...props}>{type.map(option => <option value={option} key={option}>{label(option)}</option>)}</select> :
            <input {...props} type={type} maxLength={max} autoComplete={type === 'password' ? 'new-password' : undefined}
              minLength={type === 'password' ? 8 : undefined} min={type === 'number' ? 0 : undefined}
              max={type === 'number' ? 2147483647 : undefined} step={type === 'time' ? 1 : undefined}/>}
        </label>;
      })}
      {kind === 'equipment' && <><label>Supplier
        <select value={Object.hasOwn(values, 'supplierId') ? values.supplierId ?? '' : record?.supplierId ?? ''}
          disabled={suppliers.loading || !!suppliers.error}
          onChange={event => setValues({ ...values, supplierId: event.target.value ? Number(event.target.value) : null })}>
          <option value="">{suppliers.loading ? 'Loading suppliers…' : 'Unassigned'}</option>
          {suppliers.data?.map(supplier => <option key={supplier.supplierId} value={supplier.supplierId}>
            {supplier.supplierName}{supplier.status === 'INACTIVE' ? ' (Inactive)' : ''}
          </option>)}
        </select>
      </label>
      {suppliers.error && <ReadState resource={suppliers}/>}
      <label>Availability
        <input readOnly value={label(derivedAvailability(values.equipmentCondition, record?.quantity ?? 0))}/>
        <small>Calculated from condition and inventory quantity.</small>
      </label></>}
      <div className="dialog-actions"><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </Dialog>;
}

function Records({ kind, user, onProfileChange }) {
  const config = catalog[kind];
  const resource = useResource('/' + kind);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [details, setDetails] = useState(null);
  const [editor, setEditor] = useState(null);
  const [remove, setRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const admin = user.role === 'ADMIN';
  const staff = user.role === 'STAFF';
  const add = (admin && kind !== 'inventory') || (staff && kind === 'schedules');
  const editable = admin || (staff && ['schedules', 'inventory'].includes(kind));
  const deletable = admin && ['schedules', 'equipment', 'suppliers'].includes(kind);
  const records = resource.data || [];
  const equipmentView = kind === 'equipment';
  const member = user.role === 'MEMBER';
  const memberSchedules = member && kind === 'schedules';
  const title = memberSchedules ? 'Gym Schedules' : member && equipmentView ? 'Equipment Availability' : config.title;
  const categories = equipmentView ? [...new Set(records.map(row => row.category))].sort((a, b) => a.localeCompare(b)) : [];
  const activeCategory = categories.includes(category) ? category : '';
  const query = search.trim().toLowerCase();
  const rows = records.filter(row =>
    (!activeCategory || row.category === activeCategory) &&
    (!availability || row.availabilityStatus === availability) &&
    (!scheduleDate || row.scheduleDate === scheduleDate) &&
    config.search(row).some(value => String(value).toLowerCase().includes(query)),
  );

  async function save(payload) {
    const path = '/' + kind;
    if (editor.record) {
      const { data } = await api[kind === 'inventory' ? 'patch' : 'put'](path + '/' + editor.record[config.id], payload);
      if (kind === 'users' && data.userId === user.userId) onProfileChange(data);
    } else {
      await api.post(path, payload);
    }
    setEditor(null);
    resource.refresh();
  }

  async function confirmDelete() {
    setRemoving(true);
    setError('');
    try {
      await api.delete('/' + kind + '/' + remove[config.id]);
      setRemove(null);
      resource.refresh();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setRemoving(false);
    }
  }

  return <>
    <div className="page-heading"><div><h1>{title}</h1><p>{({ schedules: 'Browse gym activities and their scheduled times.', equipment: 'Check equipment quantity, condition, and availability.', inventory: 'Review stock levels and update quantities.', users: 'Manage account roles and access.', suppliers: 'Manage supplier contact information.' })[kind]}</p></div>
      {add && <button className="primary" onClick={() => setEditor({})}><Plus size={18}/> Add {config.item}</button>}</div>
    <section className="panel"><div className="toolbar"><label className="search"><Search size={18}/><input aria-label={'Search ' + config.title.toLowerCase()} placeholder={'Search ' + config.title.toLowerCase() + '…'} value={search} onChange={event => setSearch(event.target.value)}/></label>
      {equipmentView && <select className="equipment-category" aria-label="Filter by category" value={activeCategory} onChange={event => setCategory(event.target.value)}>
        <option value="">All categories</option>
        {categories.map(option => <option key={option} value={option}>{option}</option>)}
      </select>}
      {member && equipmentView && <select className="member-filter" aria-label="Filter by availability" value={availability} onChange={event => setAvailability(event.target.value)}>
        <option value="">All availability statuses</option>
        {equipmentAvailability.map(option => <option key={option} value={option}>{label(option)}</option>)}
      </select>}
      {memberSchedules && <label className="member-date-filter">Schedule date<input type="date" value={scheduleDate} onChange={event => setScheduleDate(event.target.value)}/></label>}
      <span>{rows.length} {rows.length === 1 ? 'record' : 'records'}</span></div>
      <ReadState resource={resource}/>
      {!resource.loading && !resource.error && <Table columns={config.columns} rows={rows} id={config.id}
        actions={memberSchedules ? row => <button onClick={() => setDetails(row)}>View details</button> : editable ? row => <>
          {kind === 'suppliers' && <button onClick={() => setDetails(row)}>View details</button>}
          {(admin || kind !== 'schedules' || row.createdByUserId === user.userId) && <button className="icon-button" aria-label={'Edit record ' + row[config.id]} onClick={() => setEditor({ record: row })}><Pencil size={17}/></button>}
          {deletable && <button className="icon-button danger-text" aria-label={'Delete record ' + row[config.id]} onClick={() => { setError(''); setRemove(row); }}><Trash2 size={17}/></button>}
        </> : undefined}/>}
    </section>
    {details && kind === 'suppliers' && <Dialog title={details.supplierName} onClose={() => setDetails(null)}>
      <dl className="member-details">
        {config.columns.slice(1).map(([heading, display]) => <div key={heading}><dt>{heading}</dt><dd>{display(details)}</dd></div>)}
      </dl>
    </Dialog>}
    {details && kind === 'schedules' && <Dialog title={details.activityName} onClose={() => setDetails(null)}>
      <dl className="member-details">
        <div><dt>Date</dt><dd>{date(details.scheduleDate)}</dd></div>
        <div><dt>Start time</dt><dd>{time(details.startTime)}</dd></div>
        <div><dt>End time</dt><dd>{time(details.endTime)}</dd></div>
        <div><dt>Status</dt><dd>{badge(details.status)}</dd></div>
      </dl>
    </Dialog>}
    {editor && <Editor config={config} kind={kind} record={editor.record} onClose={() => setEditor(null)} onSave={save}/>}
    {remove && <Dialog title={'Delete ' + config.item + '?'} busy={removing} onClose={() => setRemove(null)}>
      <p>{remove.activityName || remove.equipmentName || remove.supplierName}{kind === 'equipment' && ' and its inventory record'} will be removed.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions"><button disabled={removing} onClick={() => setRemove(null)}>Cancel</button><button className="danger" disabled={removing} onClick={confirmDelete}>{removing ? 'Deleting…' : 'Delete'}</button></div>
    </Dialog>}
  </>;
}

function Dashboard({ user }) {
  const resource = useResource('/dashboard');
  const data = resource.data;
  return <>
    <div className="page-heading"><div><h1>Dashboard</h1><p>Welcome, {user.firstName}. Here’s a look at your gym.</p></div><span className="date-chip"><CalendarDays size={17}/>{date(today())}</span></div>
    <ReadState resource={resource}/>
    {data && <><div className={user.role === 'ADMIN' ? 'stats admin-stats' : 'stats'}>
      {user.role === 'ADMIN' && <NavLink className="stat booking-pending-link" to="/bookings"><span className="stat-icon"><ClipboardList size={21}/></span><div><p>Booking requests</p><strong>{data.pendingBookings}</strong><p>Pending approval</p></div></NavLink>}
      {[[CalendarDays, 'Upcoming schedules', data.scheduled], [Dumbbell, 'Equipment records', data.equipment], [Box, 'Available equipment', data.available], [Bell, 'Unread notifications', data.unread]].map(([Icon, title, value]) => <section className="stat" key={title}><span className="stat-icon"><Icon size={21}/></span><div><p>{title}</p><strong>{value}</strong></div></section>)}
    </div><section className="panel"><div className="section-heading"><div><h2>Upcoming activities</h2><p>The next scheduled sessions at the gym.</p></div><NavLink className="button" to="/schedules">View schedules</NavLink></div>
      <Table columns={catalog.schedules.columns} rows={data.upcoming} id="scheduleId"/>
    </section></>}
  </>;
}

function useNotificationInbox() {
  const resource = useResource('/notifications');
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  async function read(id) {
    if (pending !== null) return;
    setPending(id);
    setError('');
    try {
      await api.patch('/notifications/' + id + '/read');
      resource.refresh();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setPending(null);
    }
  }
  return { resource, pending, error, read };
}

function NotificationFeed({ inbox, member = false, limit }) {
  const { resource, pending, error, read } = inbox;
  const rows = limit ? resource.data?.slice(0, limit) : resource.data;
  return <>
      {error && <p className="error" role="alert">{error}</p>}
      <ReadState resource={resource}/>
      {!resource.loading && resource.data?.length === 0 && <div className="empty">You have no notifications.</div>}
      {rows?.map(row => <article className={member && row.deliveryStatus !== 'READ' ? 'notice member-unread' : 'notice'} key={row.notificationId}>
        <span className="stat-icon"><Bell size={18}/></span><div><strong>{row.message}</strong><p>{dateTime(row.dateSent)} {member && row.deliveryStatus !== 'READ' && <span className="badge member-new">Unread</span>}</p></div>
        {row.deliveryStatus === 'READ' ? badge('READ') : <button disabled={pending !== null} onClick={() => read(row.notificationId)}><Check size={16}/>Mark as read</button>}
      </article>)}
  </>;
}

function Notifications() {
  return <NotificationPage inbox={useNotificationInbox()}/>;
}

function NotificationPage({ inbox, member = false }) {
  return <><div className="page-heading"><div><h1>Notifications</h1><p>Updates about gym activities.</p></div></div>
    <section className="panel"><NotificationFeed inbox={inbox} member={member}/></section>
  </>;
}

function Account({ user }) {
  return <><div className="page-heading"><div><h1>My account</h1><p>Your gym account details.</p></div></div><section className="panel account"><dl>
    <div><dt>Name</dt><dd>{profileName(user)}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div>
    <div><dt>Role</dt><dd>{label(user.role)}</dd></div><div><dt>Status</dt><dd>{badge(user.accountStatus)}</dd></div>
  </dl></section></>;
}

const profilePicturePath = '/auth/me/profile-picture';

function useObjectUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  return url;
}

function MemberAvatar({ name, picture, large = false }) {
  const initial = Array.from(name)[0];
  return <div className={large ? 'avatar member-profile-avatar' : 'avatar'} aria-hidden="true">
    {picture ? <img src={picture} alt=""/> : initial || <CircleUserRound size={large ? 34 : 21}/>}
  </div>;
}

function MemberAccount({ user, picture, onPictureSaved }) {
  const picker = useRef(null);
  const [selection, setSelection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const preview = useObjectUrl(selection);
  const name = memberFirstName(user);

  function choose(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setSaved(false);
    setError('');
    setSelection(null);
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
    } else if (file.size > 5 * 1024 * 1024 || file.size === 0) {
      setError('Choose a non-empty image that is 5 MB or smaller.');
    } else {
      setSelection(file);
    }
  }

  async function savePicture() {
    if (!selection || saving) return;
    const form = new FormData();
    form.append('picture', selection);
    setSaving(true);
    setError('');
    try {
      await api.post(profilePicturePath, form);
      onPictureSaved(selection);
      setSelection(null);
      setSaved(true);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setSaving(false);
    }
  }

  return <>
    <header className="member-welcome">
      <h1>Welcome to FitZone Gym, {name}!</h1>
      <p>View and manage your FitZone Gym account information.</p>
    </header>
    <section className="panel member-profile-card" aria-labelledby="member-profile-name">
      <div className="member-profile-cover" aria-hidden="true"/>
      <div className="member-profile-body">
        <div className="member-profile-picture">
          <MemberAvatar name={name} picture={preview || picture} large/>
          <button type="button" className="member-profile-camera" aria-label="Choose profile picture" onClick={() => picker.current.click()} disabled={saving}>
            <Camera size={17} aria-hidden="true"/>
          </button>
          <input ref={picker} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choose} hidden/>
        </div>
        <h2 id="member-profile-name">{profileName(user)}</h2>
        <p className="member-profile-email"><Mail size={17} aria-hidden="true"/><span>{user.email}</span></p>
        <div className="member-profile-badges">{badge(user.role)}{badge(user.accountStatus)}</div>
        {error && <p className="error member-picture-feedback" role="alert">{error}</p>}
        {saved && <p className="member-picture-feedback" role="status">Profile picture saved.</p>}
        {selection && <div className="member-picture-feedback">
          <p>Profile picture preview</p>
          <div className="row-actions">
            <button onClick={() => { setSelection(null); setError(''); }} disabled={saving}>Cancel</button>
            <button className="primary" onClick={savePicture} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>}
      </div>
    </section>
  </>;
}

function Workspace({ user, signOut, onProfileChange }) {
  const pages = [
    ['', 'Dashboard', LayoutDashboard], ['schedules', 'Schedules', CalendarDays], ['equipment', 'Equipment', Dumbbell],
    ...(user.role !== 'MEMBER' ? [['inventory', 'Inventory', ClipboardList]] : []),
    ...(user.role === 'ADMIN' ? [['suppliers', 'Suppliers', Box], ['bookings', 'Booking Requests', ClipboardList], ['users', 'Users', Users]] : []),
    ['notifications', 'Notifications', Bell], ['account', 'My account', CircleUserRound],
  ];
  return <div className="workspace"><aside className="sidebar"><Brand/>
    <nav aria-label="Main navigation">{pages.map(([path, title, Icon]) => <NavLink key={path} to={'/' + path} end><Icon size={19}/>{title}</NavLink>)}</nav>
    <div className="sidebar-footer"><button onClick={signOut}><LogOut size={19}/>Sign out</button></div>
  </aside><div className="work-area"><header className="topbar"><span>Gym workspace</span><NavLink to="/account" className="identity"><span className="avatar">{user.firstName[0]}{user.lastName[0]}</span><span><strong>{user.firstName} {user.lastName}</strong><small>{label(user.role)}</small></span></NavLink></header>
    <main className="content"><Routes>
      <Route index element={<Dashboard user={user}/>}/>
      {user.role === 'ADMIN' && <Route path="bookings" element={<BookingPage user={user}/>}/>}
      {pages.filter(([path]) => catalog[path]).map(([path]) => <Route key={path} path={path} element={<Records key={path} kind={path} user={user} onProfileChange={onProfileChange}/>}/>)}
      <Route path="notifications" element={<Notifications/>}/><Route path="account" element={<Account user={user}/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></main></div></div>;
}

const memberHome = '/member/profile';
const memberPages = [
  ['profile', 'Account Details', CircleUserRound],
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['bookings', 'My Bookings', ClipboardList],
  ['schedules', 'Gym Schedules', CalendarDays],
  ['equipment', 'Equipment Availability', Dumbbell],
];

const bookingActivities = ['General Workout', 'Cardio Training', 'Strength Training', 'Weightlifting', 'Functional Training', 'Fitness Training'];
const memberBookingColumns = [
  ['Activity', row => row.activity], ['Booking date', row => date(row.bookingDate)],
  ['Start time', row => time(row.startTime)], ['End time', row => time(row.endTime)],
  ['Status', row => badge(row.status)],
];
const adminBookingColumns = [
  ['Booking ID', row => '#' + row.bookingId],
  ['Member name', row => row.member.firstName + ' ' + row.member.lastName],
  ['Email', row => row.member.email],
  ...memberBookingColumns.map(column => column[0] === 'Booking date' ? ['Requested date', column[1]] : column),
  ['Date submitted', row => dateTime(row.createdAt)],
];

function BookingPage({ user, home = false }) {
  const bookings = useResource('/bookings');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const admin = user.role === 'ADMIN';
  const mode = dialog?.mode;
  const record = dialog?.record;
  const memberName = admin && record ? record.member.firstName + ' ' + record.member.lastName : user.firstName + ' ' + user.lastName;

  function open(mode, record) {
    setError('');
    setDialog({ mode, record });
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const input = Object.fromEntries(new FormData(event.currentTarget));
    setError('');
    if (mode === 'book' && input.endTime <= input.startTime) {
      setError('End time must be after start time.');
      return;
    }
    setBusy(true);
    setSuccess('');
    try {
      if (mode === 'book') {
        await api.post('/bookings', input);
        setSuccess('Your booking request has been submitted successfully and is waiting for admin approval.');
      } else if (mode === 'cancel') {
        await api.patch('/bookings/' + record.bookingId + '/cancel');
        setSuccess('Booking cancelled.');
      } else {
        const status = mode === 'approve' ? 'APPROVED' : 'REJECTED';
        await api.patch('/bookings/' + record.bookingId + '/decision', { status, ...input });
        setSuccess(status === 'APPROVED' ? 'Booking request approved.' : 'Booking request rejected.');
      }
      setDialog(null);
      bookings.refresh();
    } catch (error) {
      setError(errorText(error));
      bookings.refresh();
    } finally {
      setBusy(false);
    }
  }

  const title = { book: 'Book a Gym Schedule', details: 'Booking details', approve: 'Approve booking', reject: 'Reject booking', cancel: 'Cancel booking' }[mode];
  return <>
    {success && <p className="booking-success" role="status"><Check size={18} aria-hidden="true"/>{success}</p>}
    {home ? <MemberDashboard bookings={bookings} openDetails={row => open('details', row)}/> :
      <>
        <div className="page-heading">
          <div><h1>{admin ? 'Booking Requests' : 'My Bookings'}</h1><p>{admin ? 'Review and decide member requests for gym time.' : 'Track your requests and review past decisions.'}</p></div>
          <div className="row-actions">
            <button onClick={bookings.refresh} disabled={bookings.loading}>Refresh</button>
            {!admin && <button className="primary" onClick={() => open('book')}><Plus size={18}/>Book a Gym Schedule</button>}
          </div>
        </div>
        <section className="panel">
          <ReadState resource={bookings}/>
          {!bookings.loading && !bookings.error && <Table id="bookingId" rows={bookings.data || []}
            columns={admin ? adminBookingColumns : memberBookingColumns}
            actions={row => <>
              <button onClick={() => open('details', row)}>View details</button>
              {admin && row.status === 'PENDING' && <>
                <button className="primary" onClick={() => open('approve', row)}>Approve</button>
                <button className="danger-text" onClick={() => open('reject', row)}>Reject</button>
              </>}
            </>}
          />}
        </section>
      </>}
    {dialog && <Dialog key={mode} title={title} onClose={() => setDialog(null)} busy={busy}>
      {mode === 'details' ? <>
        <dl className="member-details booking-details">
          <div><dt>Booking ID</dt><dd>#{record.bookingId}</dd></div>
          <div><dt>Member</dt><dd>{memberName}</dd></div>
          <div><dt>Activity</dt><dd>{record.activity}</dd></div>
          <div><dt>Date</dt><dd>{date(record.bookingDate)}</dd></div>
          <div><dt>Start time</dt><dd>{time(record.startTime)}</dd></div>
          <div><dt>End time</dt><dd>{time(record.endTime)}</dd></div>
          <div><dt>Status</dt><dd>{badge(record.status)}</dd></div>
          <div><dt>Submitted</dt><dd>{dateTime(record.createdAt)}</dd></div>
          {record.notes && <div className="booking-wide"><dt>Notes</dt><dd>{record.notes}</dd></div>}
          {record.rejectionReason && <div className="booking-wide"><dt>Rejection reason</dt><dd>{record.rejectionReason}</dd></div>}
        </dl>
        <div className="dialog-actions">
          {!admin && ['PENDING', 'APPROVED'].includes(record.status) && <button className="danger-text" onClick={() => open('cancel', record)}>Cancel booking</button>}
          <button onClick={() => setDialog(null)}>Close</button>
        </div>
      </> : <form className="editor booking-editor" onSubmit={submit}>
        {error && <p className="error" role="alert">{error}</p>}
        {mode === 'book' ? <>
          <label>Member name<input value={memberName} readOnly/></label>
          <label>Gym activity<select name="activity" defaultValue="" required>
            <option value="" disabled>Select an activity</option>
            {bookingActivities.map(activity => <option key={activity}>{activity}</option>)}
          </select></label>
          <label>Preferred date<input type="date" name="bookingDate" min={today()} required/></label>
          <div className="booking-time-grid">
            <label>Start time<input type="time" name="startTime" required/></label>
            <label>End time<input type="time" name="endTime" required/></label>
          </div>
          <label>Notes (optional)<textarea name="notes" maxLength={500} rows={3}/></label>
          <p className="booking-time-note">Times are in Asia/Manila.</p>
        </> : <>
          <p>{record.activity} · {date(record.bookingDate)} · {time(record.startTime)} – {time(record.endTime)}</p>
          {mode === 'reject' && <label>Rejection reason (optional)<textarea name="reason" maxLength={500} rows={3}/></label>}
        </>}
        <div className="dialog-actions">
          <button type="button" onClick={() => setDialog(null)} disabled={busy}>Back</button>
          <button className={mode === 'reject' || mode === 'cancel' ? 'danger' : 'primary'} disabled={busy}>
            {busy ? 'Saving…' : { book: 'Submit Booking Request', approve: 'Approve booking', reject: 'Reject booking', cancel: 'Cancel booking' }[mode]}
          </button>
        </div>
      </form>}
    </Dialog>}
  </>;
}

function MemberDashboard({ bookings, openDetails }) {
  const rows = bookings.data;
  return <>
    <ReadState resource={bookings}/>
    {rows && <div className="stats member-stats">
      {[
        [ClipboardList, 'My Total Bookings', rows.length],
        [Timer, 'Pending Bookings', rows.filter(row => row.status === 'PENDING').length],
        [Check, 'Approved Bookings', rows.filter(row => row.status === 'APPROVED').length],
        [X, 'Rejected Bookings', rows.filter(row => row.status === 'REJECTED').length],
      ].map(([Icon, title, value]) => <NavLink className="stat member-stat" to="/member/bookings" key={title}>
        <span className="stat-icon"><Icon size={21} aria-hidden="true"/></span><div><p>{title}</p><strong>{value}</strong></div>
      </NavLink>)}
    </div>}
    <section className="panel member-bookings-panel" aria-labelledby="member-bookings-title">
      <div className="section-heading"><h2 id="member-bookings-title">My Gym Bookings</h2><NavLink className="button" to="/member/bookings">View all bookings</NavLink></div>
      {rows && <Table columns={memberBookingColumns} rows={rows.slice(0, 5)} id="bookingId" scrollLabel="My Gym Bookings table"
        actions={row => <button onClick={() => openDetails(row)}>View details</button>}/>}
    </section>
  </>;
}

function MemberHeader({ name, picture, inbox }) {
  const [open, setOpen] = useState(false);
  const actions = useRef(null);
  const bell = useRef(null);
  const unread = inbox.resource.data?.filter(row => row.deliveryStatus !== 'READ').length ?? 0;

  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!actions.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        bell.current?.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  function toggle() {
    if (!open) inbox.resource.refresh();
    setOpen(!open);
  }

  return <header className="topbar">
    <span>Member portal</span>
    <div className="member-header-actions" ref={actions}>
      <button type="button" className="member-bell" ref={bell} onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open} aria-controls={open ? 'member-notification-dropdown' : undefined}>
        <Bell size={21} aria-hidden="true"/>
        {unread > 0 && <span className="member-bell-count" aria-hidden="true">{unread}</span>}
      </button>
      {open && <section id="member-notification-dropdown" className="member-notification-dropdown panel" aria-labelledby="member-notification-title">
        <div className="section-heading"><h2 id="member-notification-title">Notifications</h2></div>
        <div className="member-notification-feed"><NotificationFeed inbox={inbox} member limit={5}/></div>
        <div className="member-notification-footer"><NavLink to="/member/notifications" onClick={() => setOpen(false)}>View all notifications</NavLink></div>
      </section>}
      <NavLink to={memberHome} className="identity" onClick={() => setOpen(false)}>
        <MemberAvatar name={name} picture={picture}/>
        <span><strong>{name}</strong><small>Member</small></span>
      </NavLink>
    </div>
  </header>;
}

function MemberWorkspace({ user, signOut }) {
  const inbox = useNotificationInbox();
  const [avatar, setAvatar] = useState(null);
  const picture = useObjectUrl(avatar);
  const pictureSaved = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    api.get(profilePicturePath, { responseType: 'blob', signal: controller.signal }).then(({ data }) => {
      if (!pictureSaved.current) setAvatar(data);
    }).catch(error => {
      if (!axios.isCancel(error) && error.response?.status !== 404 && !pictureSaved.current) setAvatar(null);
    });
    return () => controller.abort();
  }, []);
  return <div className="workspace member-workspace">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><Dumbbell size={23} aria-hidden="true"/></span><div>FitZone Gym</div></div>
      <nav aria-label="Member navigation">{memberPages.map(([path, title, Icon]) => (
        <NavLink key={path} to={'/member/' + path} end><Icon size={19} aria-hidden="true"/>{title}</NavLink>
      ))}</nav>
      <div className="sidebar-footer"><button onClick={signOut}><LogOut size={19} aria-hidden="true"/>Logout</button></div>
    </aside>
    <div className="work-area">
      <MemberHeader name={memberFirstName(user)} picture={picture} inbox={inbox}/>
      <main className="content"><Routes>
        <Route index element={<Navigate to={memberHome} replace/>}/>
        <Route path="dashboard" element={<BookingPage user={user} home/>}/>
        <Route path="bookings" element={<BookingPage user={user}/>}/>
        <Route path="schedules" element={<Records key="schedules" kind="schedules" user={user}/>}/>
        <Route path="equipment" element={<Records key="equipment" kind="equipment" user={user}/>}/>
        <Route path="notifications" element={<NotificationPage inbox={inbox} member/>}/>
        <Route path="profile" element={<MemberAccount user={user} picture={picture} onPictureSaved={file => {
          pictureSaved.current = true;
          setAvatar(file);
        }}/>}/>
        <Route path="*" element={<Navigate to={memberHome} replace/>}/>
      </Routes></main>
    </div>
  </div>;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem(sessionKey)));
  const [error, setError] = useState('');
  function signOut() {
    sessionStorage.removeItem(sessionKey);
    setUser(null);
    setError('');
  }
  function loadProfile(signal) {
    return api.get('/auth/me', { signal }).then(({ data }) => { setUser(data); setError(''); }).catch(error => {
      if (!axios.isCancel(error) && error.response?.status !== 401) setError(errorText(error));
    }).finally(() => { if (!signal?.aborted) setLoading(false); });
  }
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener('gym-session-expired', signOut);
    if (sessionStorage.getItem(sessionKey)) void loadProfile(controller.signal);
    return () => { controller.abort(); window.removeEventListener('gym-session-expired', signOut); };
  }, []);
  if (loading) return <main className="empty" role="status">Loading workspace…</main>;
  if (error) return <main className="empty"><p role="alert">{error}</p><button onClick={() => { setLoading(true); void loadProfile(); }}>Retry</button> <button onClick={signOut}>Sign out</button></main>;
  if (!user) return <Routes>
    <Route path="/register" element={<Registration/>}/>
    <Route path="*" element={<SignIn registrationMessage={location.state?.registrationMessage} onLogin={profile => {
      setUser(profile);
      navigate(profile.role === 'MEMBER' ? memberHome : '/', { replace: true });
    }}/>}/>
  </Routes>;
  if (user.role === 'MEMBER') return <Routes>
    <Route path="/member/*" element={<MemberWorkspace user={user} signOut={signOut}/>}/>
    <Route path="*" element={<Navigate to={memberHome} replace/>}/>
  </Routes>;
  return <Workspace user={user} signOut={signOut} onProfileChange={setUser}/>;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
