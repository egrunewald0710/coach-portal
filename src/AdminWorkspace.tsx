import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Activity, CircleAlert, LogOut, RefreshCw, ShieldCheck, UserRoundCog, Users, X } from 'lucide-react';

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  profile: { full_name: string | null; email: string | null } | null;
  coach: { is_active: boolean } | null;
};

type Assignment = { coach_id: string; athlete_id: string; status: string };
type AdminData = { users: AdminUser[]; assignments: Assignment[] };
type Props = { client: SupabaseClient; adminUserId: string; onSignOut: () => Promise<void> };
type View = 'users' | 'assignments';

export default function AdminWorkspace({ client, adminUserId, onSignOut }: Props) {
  const [data, setData] = useState<AdminData>({ users: [], assignments: [] });
  const [view, setView] = useState<View>('users');
  const [search, setSearch] = useState('');
  const [coachId, setCoachId] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function invoke<T>(action: string, payload: Record<string, unknown> = {}) {
    const { data: response, error: invokeError } = await client.functions.invoke<T>('admin-portal', {
      body: { action, ...payload },
    });
    if (invokeError) throw new Error(invokeError.message);
    return response as T;
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await invoke<AdminData>('list'));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [client]);

  async function setCoach(user: AdminUser) {
    const active = !user.coach?.is_active;
    setBusy(`coach:${user.id}`);
    setError('');
    try {
      await invoke('set-coach', { userId: user.id, active });
      await load();
      setToast(active ? 'Coach access activated' : 'Coach access deactivated');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update coach access.');
    } finally {
      setBusy('');
    }
  }

  async function setAssignment(assignment: Assignment, active: boolean) {
    setBusy(`assignment:${assignment.coach_id}:${assignment.athlete_id}`);
    setError('');
    try {
      await invoke('set-assignment', { coachId: assignment.coach_id, athleteId: assignment.athlete_id, active });
      await load();
      setToast(active ? 'User assigned to coach' : 'Assignment removed');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update the assignment.');
    } finally {
      setBusy('');
    }
  }

  async function addAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coachId || !athleteId) return;
    setBusy('new-assignment');
    setError('');
    try {
      await invoke('set-assignment', { coachId, athleteId, active: true });
      await load();
      setToast('User assigned to coach');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not add the assignment.');
    } finally {
      setBusy('');
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const usersById = new Map(data.users.map((user) => [user.id, user]));
  const activeCoaches = data.users.filter((user) => user.coach?.is_active);
  const filteredUsers = data.users.filter((user) => `${user.profile?.full_name ?? ''} ${user.email ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const activeAssignments = data.assignments.filter((assignment) => assignment.status === 'active');

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a className="sidebar-brand" href="#admin-users" onClick={(event) => { event.preventDefault(); setView('users'); }}>
        <span className="brand-mark"><Activity size={19} /></span><span>LETSMOVE</span><small>ADMIN</small>
      </a>
      <p className="admin-sidebar-label">ADMINISTRATION</p>
      <nav className="admin-nav" aria-label="Admin navigation">
        <button className={`admin-nav-button ${view === 'users' ? 'admin-nav-active' : ''}`} onClick={() => setView('users')}><Users size={17} /><span>All users</span><small>{data.users.length}</small></button>
        <button className={`admin-nav-button ${view === 'assignments' ? 'admin-nav-active' : ''}`} onClick={() => setView('assignments')}><UserRoundCog size={17} /><span>Assignments</span><small>{activeAssignments.length}</small></button>
      </nav>
      <div className="admin-sidebar-bottom">
        <div className="admin-session"><ShieldCheck size={17} /><span><b>Administrator</b><small>{usersById.get(adminUserId)?.email ?? 'Authorized account'}</small></span></div>
        <button className="admin-signout" onClick={() => void onSignOut()}><LogOut size={16} />Sign out</button>
        <div className="sidebar-version">LET’S MOVE <span>•</span> ADMIN CONSOLE</div>
      </div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><div><span>LetsMove</span><i>/</i><b>{view === 'users' ? 'All users' : 'Assignments'}</b></div><button className="button button-secondary button-small" onClick={() => void load()} disabled={loading}><RefreshCw size={14} />Refresh</button></header>
      <div className="admin-content">
        {error && <div className="notice notice-error"><CircleAlert size={17} /><span>{error}</span><button className="notice-dismiss" aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
        {view === 'users' ? <>
          <section className="admin-heading"><div><p className="eyebrow">ACCOUNT DIRECTORY</p><h1>All users</h1><p className="muted">Manage coach access and review every LetsMove account.</p></div><div className="admin-counts"><span><b>{data.users.length}</b> users</span><span><b>{activeCoaches.length}</b> active coaches</span></div></section>
          <section className="admin-panel">
            <div className="admin-panel-heading"><div><p className="eyebrow">SUPABASE AUTH ACCOUNTS</p><h2>People <span>{data.users.length}</span></h2></div><label className="admin-search"><span className="sr-only">Search users</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></label></div>
            {loading ? <div className="admin-loading"><span className="spinner" />Loading users</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Joined</th><th>Last sign-in</th><th>Coach access</th><th></th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id}><td><b>{user.profile?.full_name || 'Name not set'}</b><small>{user.email ?? user.id}</small></td><td>{new Date(user.created_at).toLocaleDateString()}</td><td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td><td><span className={`admin-status ${user.coach?.is_active ? 'admin-status-active' : ''}`}><i />{user.coach?.is_active ? 'Active coach' : user.coach ? 'Inactive coach' : 'User'}</span></td><td><button className={`button button-small ${user.coach?.is_active ? 'button-secondary' : 'button-primary'}`} disabled={busy === `coach:${user.id}`} onClick={() => void setCoach(user)}>{busy === `coach:${user.id}` ? 'Saving…' : user.coach?.is_active ? 'Deactivate' : 'Make coach'}</button></td></tr>)}</tbody></table>{!filteredUsers.length && <p className="admin-empty">No users match this search.</p>}</div>}
          </section>
        </> : <>
          <section className="admin-heading"><div><p className="eyebrow">ROSTER MANAGEMENT</p><h1>Coach assignments</h1><p className="muted">Assign any existing user to an active coach.</p></div><div className="admin-counts"><span><b>{activeCoaches.length}</b> active coaches</span><span><b>{activeAssignments.length}</b> active assignments</span></div></section>
          <section className="admin-panel admin-assignment-form"><div><p className="eyebrow">NEW ASSIGNMENT</p><h2>Choose a coach and user</h2></div><form onSubmit={(event) => void addAssignment(event)}><label>Coach<select value={coachId} onChange={(event) => setCoachId(event.target.value)} required><option value="">Select active coach</option>{activeCoaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.profile?.full_name || coach.email || coach.id}</option>)}</select></label><label>User<select value={athleteId} onChange={(event) => setAthleteId(event.target.value)} required><option value="">Select user</option>{data.users.map((user) => <option key={user.id} value={user.id}>{user.profile?.full_name || user.email || user.id}</option>)}</select></label><button className="button button-primary" type="submit" disabled={!activeCoaches.length || busy === 'new-assignment'}>{busy === 'new-assignment' ? 'Assigning…' : 'Assign user'}</button></form>{!activeCoaches.length && <p className="admin-empty">Activate at least one coach from All users before assigning users.</p>}</section>
          <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">CURRENT ROSTERS</p><h2>Assignments <span>{data.assignments.length}</span></h2></div></div>{loading ? <div className="admin-loading"><span className="spinner" />Loading assignments</div> : data.assignments.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Coach</th><th>Assigned user</th><th>Status</th><th></th></tr></thead><tbody>{data.assignments.map((assignment) => <tr key={`${assignment.coach_id}:${assignment.athlete_id}`}><td>{usersById.get(assignment.coach_id)?.profile?.full_name || usersById.get(assignment.coach_id)?.email || assignment.coach_id}</td><td>{usersById.get(assignment.athlete_id)?.profile?.full_name || usersById.get(assignment.athlete_id)?.email || assignment.athlete_id}</td><td><span className={`admin-status ${assignment.status === 'active' ? 'admin-status-active' : ''}`}><i />{assignment.status}</span></td><td><button className="button button-danger button-small" disabled={busy === `assignment:${assignment.coach_id}:${assignment.athlete_id}`} onClick={() => void setAssignment(assignment, false)}>Remove</button></td></tr>)}</tbody></table></div> : <p className="admin-empty">No assignments yet.</p>}</section>
        </>}
      </div>
    </main>
    {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
  </div>;
}