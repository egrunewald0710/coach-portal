import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import AdminWorkspace from './AdminWorkspace';
import MessagesPage from './MessagesPage';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Dumbbell,
  Footprints,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Menu,
  Plus,
  Search,
  Trash2,
  Users,
  Waves,
  X,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'not-configured',
);

type Athlete = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  goal_race: string | null;
  goal_date: string | null;
  ftp_watts: number | null;
  threshold_pace_run: string | null;
  css_pace_swim: string | null;
};

type Workout = {
  id: string;
  user_id: string;
  sport: 'swim' | 'bike' | 'run' | 'gym' | 'brick' | 'rest';
  title: string;
  scheduled_date: string | null;
  planned_duration_seconds: number | null;
  planned_distance_meters: number | null;
  notes: string | null;
  status: 'planned' | 'completed' | 'skipped';
};

type Page = 'overview' | 'athletes' | 'calendar' | 'messages';
type WorkoutValues = {
  user_id: string;
  sport: Workout['sport'];
  title: string;
  scheduled_date: string;
  duration_minutes: number;
  distance_km: number | null;
  notes: string;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <SetupScreen />;
  if (authLoading) return <LoadingScreen label="Opening your workspace" />;
  if (!session) return <SignInScreen />;

  return <CoachWorkspace session={session} />;
}

function SetupScreen() {
  return (
    <main className="setup-screen">
      <div className="setup-mark"><Activity size={21} /></div>
      <p className="eyebrow">LET’S MOVE / COACH DESK</p>
      <h1>Connect your workspace.</h1>
      <p className="muted">Add your Supabase project URL and anon public key to <code>coach-portal/.env</code> to continue.</p>
      <div className="setup-code">VITE_SUPABASE_URL=https://…supabase.co<br />VITE_SUPABASE_ANON_KEY=your-anon-key</div>
      <p className="setup-note">Use the anon public key only. Coach access is enforced by your Supabase policies.</p>
    </main>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return <main className="loading-screen"><span className="spinner" /><span>{label}</span></main>;
}

function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  async function handleReset() {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) setError(resetError.message);
    else setMessage('Password reset email sent.');
    setBusy(false);
  }

  return (
    <main className="auth-layout">
      <section className="auth-art">
        <div className="auth-brand"><span className="brand-mark"><Activity size={20} /></span> LETSMOVE <span className="brand-divider">/</span> COACH DESK</div>
        <div className="auth-art-copy">
          <p className="eyebrow">THE WORK BEHIND THE FINISH</p>
          <h1>Make every<br />training day<br /><em>count.</em></h1>
          <p>One clear view of your athletes, their plans, and the next session that moves them forward.</p>
        </div>
        <div className="auth-art-footer"><span>SWIM</span><i /><span>BIKE</span><i /><span>RUN</span><span className="auth-art-year">LET’S MOVE · 2026</span></div>
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="brand-mark"><Activity size={18} /></span> LETSMOVE</div>
          <p className="eyebrow">COACH SIGN IN</p>
          <h2>Welcome back.</h2>
          <p className="auth-subtitle">Sign in with the account linked to your coach profile.</p>
          <form className="auth-form" onSubmit={handleSignIn}>
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></label>
            {error && <p className="form-error"><CircleAlert size={15} />{error}</p>}
            {message && <p className="form-success"><Check size={15} />{message}</p>}
            <button className="button button-primary sign-in-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowUpRight size={17} /></button>
          </form>
          <button className="text-button reset-button" onClick={handleReset} disabled={busy}>Forgot your password?</button>
          <p className="auth-footnote">Coach profiles are provisioned by the LetsMove team.</p>
        </div>
      </section>
    </main>
  );
}

function CoachWorkspace({ session }: { session: Session }) {
  const [page, setPage] = useState<Page>('overview');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [isCoachActive, setIsCoachActive] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogWorkout, setDialogWorkout] = useState<Workout | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  async function loadWorkspace() {
    setLoading(true);
    setError('');
    const { data: adminCheck } = await supabase.functions.invoke<{ isAdmin: boolean }>('admin-portal', { body: { action: 'check' } });
    if (adminCheck?.isAdmin) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }
    const { data: coach, error: coachError } = await supabase
      .from('coaches').select('is_active').eq('user_id', session.user.id).maybeSingle();
    if (coachError) {
      setError(coachError.message);
      setLoading(false);
      return;
    }
    if (!coach?.is_active) {
      setIsCoachActive(false);
      setAthletes([]);
      setWorkouts([]);
      setLoading(false);
      return;
    }
    setIsCoachActive(true);

    const { data: assignments, error: assignmentError } = await supabase
      .from('coach_athletes').select('athlete_id')
      .eq('coach_id', session.user.id).eq('status', 'active');
    if (assignmentError) {
      setError(assignmentError.message);
      setLoading(false);
      return;
    }

    const athleteIds = (assignments ?? []).map((assignment) => assignment.athlete_id);
    if (!athleteIds.length) {
      setAthletes([]);
      setWorkouts([]);
      setSelectedAthlete(null);
      setLoading(false);
      return;
    }

    const [{ data: athleteRows, error: athleteError }, { data: workoutRows, error: workoutError }] = await Promise.all([
      supabase.from('profiles').select('id,full_name,email,avatar_url,goal_race,goal_date,ftp_watts,threshold_pace_run,css_pace_swim').in('id', athleteIds),
      supabase.from('workouts').select('id,user_id,sport,title,scheduled_date,planned_duration_seconds,planned_distance_meters,notes,status').in('user_id', athleteIds).order('scheduled_date', { ascending: true }),
    ]);
    if (athleteError || workoutError) {
      setError(athleteError?.message ?? workoutError?.message ?? 'Could not load workspace data.');
      setLoading(false);
      return;
    }

    const nextAthletes = (athleteRows ?? []) as Athlete[];
    setAthletes(nextAthletes);
    setWorkouts((workoutRows ?? []) as Workout[]);
    setSelectedAthlete((current) => current && nextAthletes.some((athlete) => athlete.id === current) ? current : nextAthletes[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => { void loadWorkspace(); }, [session.user.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function saveWorkout(values: WorkoutValues, workout: Workout | null) {
    const payload = {
      user_id: values.user_id,
      sport: values.sport,
      title: values.title.trim(),
      scheduled_date: values.scheduled_date,
      planned_duration_seconds: values.duration_minutes ? values.duration_minutes * 60 : null,
      planned_distance_meters: values.distance_km ? Math.round(values.distance_km * 1000) : null,
      notes: values.notes.trim() || null,
    };
    const result = workout
      ? await supabase.from('workouts').update(payload).eq('id', workout.id)
      : await supabase.from('workouts').insert({ ...payload, status: 'planned' });
    if (result.error) throw result.error;
    await loadWorkspace();
    setDialogWorkout(undefined);
    setToast(workout ? 'Workout updated' : 'Workout added to the plan');
  }

  async function deleteWorkout(workout: Workout): Promise<boolean> {
    if (!window.confirm(`Remove “${workout.title}” from this athlete’s plan?`)) return false;
    const { error: deleteError } = await supabase.from('workouts').delete().eq('id', workout.id);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    await loadWorkspace();
    setDialogWorkout(undefined);
    setToast('Planned workout removed');
    return true;
  }

  const activeAthlete = athletes.find((athlete) => athlete.id === selectedAthlete) ?? null;
  const filteredAthletes = athletes.filter((athlete) => `${athlete.full_name ?? ''} ${athlete.email ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const pageTitle = page === 'overview' ? 'Training overview' : page === 'athletes' ? 'Your athletes' : page === 'calendar' ? 'Training calendar' : 'Messages';

  if (loading) return <LoadingScreen label="Syncing your training workspace" />;
  if (isAdmin) return <AdminWorkspace client={supabase} adminUserId={session.user.id} onSignOut={signOut} />;
  if (isCoachActive === false) {
    return <AccessScreen onSignOut={signOut} />;
  }

  return (
    <div className="workspace-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <a className="sidebar-brand" href="#overview" onClick={(event) => { event.preventDefault(); setPage('overview'); setMobileMenuOpen(false); }}>
          <span className="brand-mark"><Activity size={19} /></span><span>LETSMOVE</span><small>COACH DESK</small>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavItem icon={<LayoutDashboard size={17} />} label="Overview" active={page === 'overview'} onClick={() => { setPage('overview'); setMobileMenuOpen(false); }} />
          <NavItem icon={<Users size={17} />} label="Athletes" count={athletes.length} active={page === 'athletes'} onClick={() => { setPage('athletes'); setMobileMenuOpen(false); }} />
          <NavItem icon={<CalendarDays size={17} />} label="Training calendar" active={page === 'calendar'} onClick={() => { setPage('calendar'); setMobileMenuOpen(false); }} />
          <NavItem icon={<MessageSquare size={17} />} label="Messages" active={page === 'messages'} onClick={() => { setPage('messages'); setMobileMenuOpen(false); }} />
        </nav>
        <div className="sidebar-bottom">
          <div className="coach-mini"><span className="avatar avatar-coach">{initials(session.user.email ?? 'C')}</span><span className="coach-mini-copy"><b>{session.user.email?.split('@')[0] ?? 'Coach'}</b><small>Coach account</small></span><ChevronDown size={15} /></div>
          <button className="sign-out-button" onClick={signOut}><LogOut size={16} />Sign out</button>
          <div className="sidebar-version">LET’S MOVE <span>•</span> COACH WORKSPACE</div>
        </div>
      </aside>

      {mobileMenuOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><b>{pageTitle}</b></div>
          <div className="topbar-actions">
            <div className="today-label"><span className="live-dot" />{formatLongDate(new Date())}</div>
            <button className="button button-primary top-add-button" onClick={() => setDialogWorkout(null)}><Plus size={16} />Plan a workout</button>
            <button className="avatar avatar-top" aria-label="Sign out" onClick={signOut}>{initials(session.user.email ?? 'C')}</button>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="notice notice-error"><CircleAlert size={17} /><span>{error.includes('profiles') ? 'Could not read athlete profiles. Apply the coach portal profile-access migration, then refresh.' : error}</span><button className="notice-dismiss" aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></div>}
          {page === 'overview' && <OverviewPage athletes={athletes} workouts={workouts} onNavigate={setPage} onSelectAthlete={(id) => { setSelectedAthlete(id); setPage('athletes'); }} onEditWorkout={(workout) => setDialogWorkout(workout)} />}
          {page === 'athletes' && <AthletesPage athletes={filteredAthletes} allCount={athletes.length} workouts={workouts} activeAthlete={activeAthlete} search={search} onSearch={setSearch} onSelect={setSelectedAthlete} onNewWorkout={() => setDialogWorkout(null)} onEditWorkout={(workout) => setDialogWorkout(workout)} />}
          {page === 'calendar' && <CalendarPage workouts={workouts} athletes={athletes} onNewWorkout={() => setDialogWorkout(null)} onEditWorkout={(workout) => setDialogWorkout(workout)} />}
          {page === 'messages' && <MessagesPage client={supabase} coachId={session.user.id} athletes={athletes} />}
        </div>
      </main>

      {dialogWorkout !== undefined && <WorkoutDialog athletes={athletes} workout={dialogWorkout} defaultAthleteId={selectedAthlete} onClose={() => setDialogWorkout(undefined)} onSave={saveWorkout} onDelete={deleteWorkout} />}
      {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{count !== undefined && <small>{count}</small>}</button>;
}

function AccessScreen({ onSignOut }: { onSignOut: () => void }) {
  return <main className="access-screen"><div className="access-card"><div className="access-symbol"><Users size={22} /></div><p className="eyebrow">COACH ACCOUNT</p><h1>Access is not active yet.</h1><p className="muted">This account does not have an active LetsMove coach profile. Ask the LetsMove team to activate your coach access.</p><button className="button button-primary" onClick={onSignOut}><LogOut size={16} />Sign out</button></div></main>;
}

function OverviewPage({ athletes, workouts, onNavigate, onSelectAthlete, onEditWorkout }: {
  athletes: Athlete[];
  workouts: Workout[];
  onNavigate: (page: Page) => void;
  onSelectAthlete: (id: string) => void;
  onEditWorkout: (workout: Workout) => void;
}) {
  const today = localDate(new Date());
  const planned = workouts.filter((workout) => workout.status === 'planned');
  const todayWorkouts = planned.filter((workout) => workout.scheduled_date === today);
  const upcoming = planned.filter((workout) => workout.scheduled_date && workout.scheduled_date >= today).slice(0, 6);
  const completed = workouts.filter((workout) => workout.status === 'completed').length;
  const totalMinutes = planned.reduce((total, workout) => total + (workout.planned_duration_seconds ?? 0), 0) / 60;
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekCount = planned.filter((workout) => workout.scheduled_date && workout.scheduled_date >= today && workout.scheduled_date <= localDate(weekEnd)).length;

  return <>
    <section className="page-heading">
      <div><p className="eyebrow">YOUR ATHLETES, IN MOTION</p><h1>Good coaching starts <em>here.</em></h1><p className="muted">A clear view of the training you’re building together.</p></div>
      <div className="heading-date"><CalendarDays size={16} /><span>{formatLongDate(new Date())}</span></div>
    </section>

    <section className="metrics-grid" aria-label="Training summary">
      <MetricCard label="Athletes" value={String(athletes.length).padStart(2, '0')} note="Active assignments" icon={<Users size={18} />} tone="lime" trend={<ArrowUpRight size={14} />} />
      <MetricCard label="Planned this week" value={String(weekCount).padStart(2, '0')} note="Across your roster" icon={<CalendarDays size={18} />} tone="coral" trend={<span className="metric-neutral">7 days</span>} />
      <MetricCard label="Completed sessions" value={String(completed).padStart(2, '0')} note="Athlete-reported" icon={<Check size={18} />} tone="mint" trend={<ArrowUpRight size={14} />} />
      <MetricCard label="Planned volume" value={formatHours(totalMinutes)} note="All scheduled sessions" icon={<Clock3 size={18} />} tone="lavender" trend={<span className="metric-neutral">Total</span>} />
    </section>

    <section className="overview-grid">
      <div className="panel schedule-panel">
        <div className="panel-heading"><div><p className="eyebrow">NEXT ON THE PLAN</p><h2>Upcoming sessions</h2></div><button className="text-button arrow-link" onClick={() => onNavigate('calendar')}>Full calendar <ArrowUpRight size={15} /></button></div>
        {upcoming.length ? <div className="session-list">{upcoming.map((workout) => <SessionRow key={workout.id} workout={workout} athlete={athletes.find((item) => item.id === workout.user_id)} onClick={() => onEditWorkout(workout)} />)}</div> : <EmptyState icon={<CalendarDays size={20} />} title="Nothing on the calendar yet" detail={athletes.length ? 'Plan a session to get your athletes moving.' : 'Your roster will appear here once athletes are assigned.'} />}
        {todayWorkouts.length > 0 && <div className="today-callout"><span className="live-dot" />{todayWorkouts.length} session{todayWorkouts.length === 1 ? '' : 's'} scheduled for today</div>}
      </div>
      <div className="panel roster-panel">
        <div className="panel-heading"><div><p className="eyebrow">THE PEOPLE YOU COACH</p><h2>Athlete roster</h2></div><button className="icon-link" aria-label="View all athletes" onClick={() => onNavigate('athletes')}><ArrowUpRight size={17} /></button></div>
        {athletes.length ? <div className="roster-list">{athletes.slice(0, 5).map((athlete, index) => {
          const next = planned.find((workout) => workout.user_id === athlete.id && workout.scheduled_date && workout.scheduled_date >= today);
          return <button className="roster-row" key={athlete.id} onClick={() => onSelectAthlete(athlete.id)}><span className={`avatar avatar-${index % 5}`}>{initials(athlete.full_name ?? athlete.email ?? 'A')}</span><span className="roster-copy"><b>{athlete.full_name || athlete.email || 'Athlete'}</b><small>{athlete.goal_race || athlete.email || 'Training plan'}</small></span><span className="roster-next">{next ? <><small>NEXT SESSION</small><b>{formatShortDate(next.scheduled_date)} <SportIcon sport={next.sport} size={13} /></b></> : <small className="no-next">No upcoming session</small>}</span></button>;
        })}</div> : <EmptyState icon={<Users size={20} />} title="Your roster is ready" detail="Athletes appear here when an assignment is active." />}
        {athletes.length > 5 && <button className="text-button roster-more" onClick={() => onNavigate('athletes')}>View all {athletes.length} athletes <ArrowUpRight size={14} /></button>}
      </div>
    </section>
    <section className="coach-note"><span className="note-icon"><Activity size={18} /></span><div><b>Small, steady progress adds up.</b><span>Keep each athlete’s next session visible and achievable.</span></div><span className="note-decoration">LM / 01</span></section>
  </>;
}

function MetricCard({ label, value, note, icon, tone, trend }: { label: string; value: string; note: string; icon: React.ReactNode; tone: string; trend: React.ReactNode }) {
  return <article className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value-row"><strong>{value}</strong><span className="metric-trend">{trend}</span></div><div className="metric-bottom"><span>{note}</span><div className="metric-bars"><i /><i /><i /><i /><i /><i /><i /></div></div></article>;
}

function AthletesPage({ athletes, allCount, workouts, activeAthlete, search, onSearch, onSelect, onNewWorkout, onEditWorkout }: {
  athletes: Athlete[];
  allCount: number;
  workouts: Workout[];
  activeAthlete: Athlete | null;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onNewWorkout: () => void;
  onEditWorkout: (workout: Workout) => void;
}) {
  const athleteWorkouts = activeAthlete ? workouts.filter((workout) => workout.user_id === activeAthlete.id).sort(compareWorkoutDates) : [];
  return <>
    <section className="page-heading compact-heading"><div><p className="eyebrow">COACHING ROSTER</p><h1>Your athletes<span className="heading-count">{allCount}</span></h1><p className="muted">Choose an athlete to see their goals and training plan.</p></div><button className="button button-primary" onClick={onNewWorkout}><Plus size={16} />Plan a workout</button></section>
    <section className="athlete-layout">
      <div className="panel athlete-list-panel">
        <div className="list-panel-heading"><div><p className="eyebrow">ACTIVE ASSIGNMENTS</p><h2>Roster <span>{allCount}</span></h2></div><div className="search-box"><Search size={15} /><input aria-label="Search athletes" placeholder="Find an athlete" value={search} onChange={(event) => onSearch(event.target.value)} /></div></div>
        {athletes.length ? <div className="athlete-list">{athletes.map((athlete, index) => {
          const next = workouts.filter((workout) => workout.user_id === athlete.id && workout.status === 'planned' && workout.scheduled_date && workout.scheduled_date >= localDate(new Date())).sort(compareWorkoutDates)[0];
          return <button className={`athlete-list-row ${activeAthlete?.id === athlete.id ? 'athlete-row-active' : ''}`} key={athlete.id} onClick={() => onSelect(athlete.id)}><span className={`avatar avatar-${index % 5}`}>{initials(athlete.full_name ?? athlete.email ?? 'A')}</span><span className="athlete-list-copy"><b>{athlete.full_name || 'Athlete'}</b><small>{athlete.goal_race || athlete.email || 'No goal race set'}</small></span><span className="athlete-list-date">{next ? <><small>NEXT</small><b>{formatShortDate(next.scheduled_date)}</b></> : <small>NO SESSION</small>}</span></button>;
        })}</div> : <EmptyState icon={<Search size={20} />} title={search ? 'No matching athletes' : 'No active assignments'} detail={search ? 'Try a different name or email.' : 'Active athlete assignments will show up here.'} />}
      </div>

      <div className="panel athlete-detail-panel">
        {activeAthlete ? <>
          <div className="athlete-profile-head"><span className="avatar avatar-large avatar-2">{initials(activeAthlete.full_name ?? activeAthlete.email ?? 'A')}</span><div className="athlete-profile-name"><p className="eyebrow">ATHLETE PROFILE</p><h2>{activeAthlete.full_name || 'Athlete'}</h2><span>{activeAthlete.email}</span></div><span className="active-badge"><i /> ACTIVE</span></div>
          <div className="goal-strip"><span className="goal-flag"><Activity size={17} /></span><div><small>GOAL RACE</small><b>{activeAthlete.goal_race || 'No goal race set'}</b></div><div className="goal-date"><small>RACE DAY</small><b>{activeAthlete.goal_date ? formatShortDate(activeAthlete.goal_date) : 'Not set'}</b></div></div>
          <div className="zones-grid"><Zone label="Bike FTP" value={activeAthlete.ftp_watts ? `${activeAthlete.ftp_watts} W` : '—'} /><Zone label="Run threshold" value={activeAthlete.threshold_pace_run || '—'} /><Zone label="Swim CSS" value={activeAthlete.css_pace_swim || '—'} /></div>
          <div className="detail-workouts-heading"><div><p className="eyebrow">TRAINING PLAN</p><h3>Sessions <span>{athleteWorkouts.length}</span></h3></div><button className="button button-secondary button-small" onClick={onNewWorkout}><Plus size={15} />Add session</button></div>
          {athleteWorkouts.length ? <div className="detail-workout-list">{athleteWorkouts.slice(0, 7).map((workout) => <SessionRow key={workout.id} workout={workout} athlete={activeAthlete} onClick={() => onEditWorkout(workout)} compact />)}</div> : <EmptyState icon={<CalendarDays size={18} />} title="No sessions planned" detail="Add the first session to this athlete’s plan." />}
        </> : <EmptyState icon={<Users size={20} />} title="Select an athlete" detail="Choose an athlete from your roster to open their profile." />}
      </div>
    </section>
  </>;
}

function Zone({ label, value }: { label: string; value: string }) {
  return <div className="zone-item"><small>{label}</small><b>{value}</b></div>;
}

function CalendarPage({ workouts, athletes, onNewWorkout, onEditWorkout }: { workouts: Workout[]; athletes: Athlete[]; onNewWorkout: () => void; onEditWorkout: (workout: Workout) => void }) {
  const [filter, setFilter] = useState('all');
  const filtered = workouts.filter((workout) => filter === 'all' || workout.sport === filter).sort(compareWorkoutDates);
  const groups = filtered.reduce<Record<string, Workout[]>>((result, workout) => {
    const date = workout.scheduled_date || 'unscheduled';
    (result[date] ??= []).push(workout);
    return result;
  }, {});
  return <>
    <section className="page-heading compact-heading"><div><p className="eyebrow">EVERY SESSION, ONE VIEW</p><h1>Training calendar</h1><p className="muted">Planned work across your active athlete roster.</p></div><button className="button button-primary" onClick={onNewWorkout}><Plus size={16} />Plan a workout</button></section>
    <section className="panel calendar-panel">
      <div className="calendar-toolbar"><div className="calendar-summary"><span className="calendar-summary-icon"><CalendarDays size={18} /></span><span><b>{filtered.length} sessions</b><small>Showing plans for {athletes.length} athletes</small></span></div><label className="select-wrap"><span>SPORT</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All sports</option><option value="swim">Swim</option><option value="bike">Bike</option><option value="run">Run</option><option value="gym">Gym</option><option value="brick">Brick</option></select><ChevronDown size={14} /></label></div>
      {Object.keys(groups).length ? <div className="calendar-groups">{Object.entries(groups).map(([date, dayWorkouts]) => <section className="calendar-day" key={date}><div className="calendar-day-label"><span className="day-number">{date === 'unscheduled' ? '—' : new Date(`${date}T12:00:00`).getDate()}</span><span><b>{date === 'unscheduled' ? 'Unscheduled' : formatDayHeading(date)}</b><small>{dayWorkouts.length} session{dayWorkouts.length === 1 ? '' : 's'}</small></span></div><div className="calendar-day-workouts">{dayWorkouts.map((workout) => <SessionRow key={workout.id} workout={workout} athlete={athletes.find((athlete) => athlete.id === workout.user_id)} onClick={() => onEditWorkout(workout)} />)}</div></section>)}</div> : <EmptyState icon={<CalendarDays size={20} />} title="No sessions to show" detail="Plan a workout for one of your active athletes." />}
    </section>
  </>;
}

function SessionRow({ workout, athlete, onClick, compact = false }: { workout: Workout; athlete?: Athlete | null; onClick: () => void; compact?: boolean }) {
  return <button className={`session-row ${compact ? 'session-row-compact' : ''}`} onClick={onClick}>
    <span className={`sport-icon sport-${workout.sport}`}><SportIcon sport={workout.sport} size={17} /></span>
    <span className="session-main"><b>{workout.title}</b><small>{athlete?.full_name || athlete?.email || 'Athlete'}<span className="session-separator">·</span>{workout.status === 'completed' ? 'Completed' : workout.status === 'skipped' ? 'Skipped' : workout.scheduled_date ? formatLongDate(new Date(`${workout.scheduled_date}T12:00:00`)) : 'Date not set'}</small></span>
    <span className="session-meta">{workout.planned_duration_seconds ? formatDuration(workout.planned_duration_seconds) : '—'}{workout.planned_distance_meters ? <small>{formatDistance(workout.planned_distance_meters)}</small> : null}</span>
    {!compact && <ArrowUpRight className="session-arrow" size={15} />}
  </button>;
}

function WorkoutDialog({ athletes, workout, defaultAthleteId, onClose, onSave, onDelete }: {
  athletes: Athlete[];
  workout: Workout | null;
  defaultAthleteId: string | null;
  onClose: () => void;
  onSave: (values: WorkoutValues, workout: Workout | null) => Promise<void>;
  onDelete: (workout: Workout) => Promise<boolean>;
}) {
  const canEdit = !workout || workout.status === 'planned';
  const [athleteId, setAthleteId] = useState(workout?.user_id ?? defaultAthleteId ?? athletes[0]?.id ?? '');
  const [sport, setSport] = useState<Workout['sport']>(workout?.sport ?? 'run');
  const [title, setTitle] = useState(workout?.title ?? '');
  const [date, setDate] = useState(workout?.scheduled_date ?? localDate(new Date()));
  const [duration, setDuration] = useState(workout?.planned_duration_seconds ? String(Math.round(workout.planned_duration_seconds / 60)) : '');
  const [distance, setDistance] = useState(workout?.planned_distance_meters ? String(workout.planned_distance_meters / 1000) : '');
  const [notes, setNotes] = useState(workout?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setDialogError('');
    try {
      await onSave({ user_id: athleteId, sport, title, scheduled_date: date, duration_minutes: Number(duration) || 0, distance_km: Number(distance) || null, notes }, workout);
    } catch (saveError) {
      setDialogError(saveError instanceof Error ? saveError.message : 'Could not save this workout.');
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="workout-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <div className="dialog-header"><div><p className="eyebrow">{workout ? canEdit ? 'EDIT PLANNED SESSION' : 'ATHLETE-REPORTED SESSION' : 'ADD TO THE TRAINING PLAN'}</p><h2 id="dialog-title">{workout ? canEdit ? 'Edit workout' : 'Workout details' : 'Plan a workout'}</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button></div>
    {athletes.length ? <form className="workout-form" onSubmit={submit}>
      <label>Athlete<select value={athleteId} onChange={(event) => setAthleteId(event.target.value)} required disabled={!canEdit}>{athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.full_name || athlete.email || 'Athlete'}</option>)}</select></label>
      <label>Sport<select value={sport} onChange={(event) => setSport(event.target.value as Workout['sport'])} disabled={!canEdit}><option value="swim">Swim</option><option value="bike">Bike</option><option value="run">Run</option><option value="gym">Strength</option><option value="brick">Brick</option><option value="rest">Rest</option></select></label>
      <label className="field-full">Session title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Aerobic tempo intervals" required maxLength={120} disabled={!canEdit} /></label>
      <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required disabled={!canEdit} /></label>
      <label>Duration <span className="label-unit">MIN</span><input type="number" min="0" max="1440" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="60" disabled={!canEdit} /></label>
      <label>Distance <span className="label-unit">KM</span><input type="number" min="0" max="1000" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="Optional" disabled={!canEdit} /></label>
      <label className="field-full">Coach notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Focus, effort, or anything to keep in mind…" rows={3} maxLength={2000} disabled={!canEdit} /></label>
      {dialogError && <p className="form-error field-full"><CircleAlert size={15} />{dialogError}</p>}
      {workout && workout.status !== 'planned' && <p className="dialog-readonly field-full"><CircleAlert size={15} />Completed sessions are athlete-owned and can’t be edited here.</p>}
      <div className="dialog-actions field-full">{workout && canEdit && <button type="button" className="button button-danger" onClick={() => void onDelete(workout)}><Trash2 size={15} />Remove</button>}<button type="button" className="button button-secondary" onClick={onClose}>Close</button>{canEdit && <button type="submit" className="button button-primary" disabled={saving || !athleteId}>{saving ? 'Saving…' : workout ? 'Save changes' : 'Add to plan'}<ArrowUpRight size={16} /></button>}</div>
    </form> : <EmptyState icon={<Users size={19} />} title="No athletes assigned yet" detail="A workout can be planned once an active athlete is assigned to your account." />}
  </section></div>;
}

function SportIcon({ sport, size = 17 }: { sport: Workout['sport']; size?: number }) {
  if (sport === 'swim') return <Waves size={size} />;
  if (sport === 'bike') return <Bike size={size} />;
  if (sport === 'gym') return <Dumbbell size={size} />;
  if (sport === 'rest') return <ArrowDownRight size={size} />;
  return <Footprints size={size} />;
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><b>{title}</b><p>{detail}</p></div>;
}

function initials(name: string) {
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A';
}

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function formatShortDate(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function formatDayHeading(date: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ''}` : `${minutes}m`;
}

function formatHours(minutes: number) {
  if (!minutes) return '0h';
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ''}` : `${remainder}m`;
}

function formatDistance(meters: number) {
  return `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
}

function compareWorkoutDates(first: Workout, second: Workout) {
  return (first.scheduled_date ?? '9999-99-99').localeCompare(second.scheduled_date ?? '9999-99-99');
}

export default App;