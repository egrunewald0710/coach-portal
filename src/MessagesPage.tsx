import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowUpRight, MessageSquare, Send, Users } from 'lucide-react';

type AthleteContact = { id: string; full_name: string | null; email: string | null };
type CoachMessage = {
  id: string;
  coach_id: string;
  athlete_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export default function MessagesPage({ client, coachId, athletes }: {
  client: SupabaseClient;
  coachId: string;
  athletes: AthleteContact[];
}) {
  const [selectedAthleteId, setSelectedAthleteId] = useState(athletes[0]?.id ?? '');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!athletes.some((athlete) => athlete.id === selectedAthleteId)) {
      setSelectedAthleteId(athletes[0]?.id ?? '');
    }
  }, [athletes, selectedAthleteId]);

  async function loadMessages() {
    if (!selectedAthleteId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: loadError } = await client
      .from('coach_messages')
      .select('id,coach_id,athlete_id,sender_id,body,created_at,read_at')
      .eq('coach_id', coachId)
      .eq('athlete_id', selectedAthleteId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    const orderedMessages = (data ?? []).reverse() as CoachMessage[];
    setMessages(orderedMessages);
    setLoading(false);

    const unreadIds = orderedMessages
      .filter((message) => message.sender_id === selectedAthleteId && !message.read_at)
      .map((message) => message.id);
    if (unreadIds.length) {
      await client.from('coach_messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
    }
  }

  useEffect(() => {
    void loadMessages();
    if (!selectedAthleteId) return;

    const channel = client
      .channel(`coach-messages-${coachId}-${selectedAthleteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coach_messages',
        filter: `coach_id=eq.${coachId}`,
      }, () => { void loadMessages(); })
      .subscribe();

    return () => { void client.removeChannel(channel); };
  }, [client, coachId, selectedAthleteId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedAthleteId || sending) return;
    setSending(true);
    setError('');
    const { error: sendError } = await client.from('coach_messages').insert({
      coach_id: coachId,
      athlete_id: selectedAthleteId,
      sender_id: coachId,
      body,
    });
    if (sendError) {
      setError(sendError.message);
    } else {
      setDraft('');
      await loadMessages();
    }
    setSending(false);
  }

  const selectedAthlete = athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null;

  return <>
    <section className="page-heading compact-heading messages-heading">
      <div><p className="eyebrow">DIRECT CONVERSATIONS</p><h1>Messages</h1><p className="muted">Private conversations with your assigned athletes.</p></div>
    </section>
    {error && <div className="notice notice-error messages-error"><MessageSquare size={17} /><span>{error}</span></div>}
    <section className="messages-layout" aria-label="Athlete messages">
      <aside className="messages-contacts panel">
        <div className="messages-section-heading"><div><p className="eyebrow">ACTIVE ROSTER</p><h2>Conversations <span>{athletes.length}</span></h2></div></div>
        {athletes.length ? <div className="messages-contact-list">{athletes.map((athlete, index) => <button key={athlete.id} className={`messages-contact ${selectedAthleteId === athlete.id ? 'messages-contact-active' : ''}`} onClick={() => setSelectedAthleteId(athlete.id)}>
          <span className={`avatar avatar-${index % 5}`}>{initials(athlete.full_name ?? athlete.email ?? 'A')}</span>
          <span className="messages-contact-copy"><b>{athlete.full_name || 'Athlete'}</b><small>{athlete.email ?? 'Assigned athlete'}</small></span>
          {selectedAthleteId === athlete.id && <ArrowUpRight size={15} />}
        </button>)}</div> : <div className="messages-empty"><Users size={21} /><b>No assigned athletes</b><span>Assign an athlete to start a conversation.</span></div>}
      </aside>

      <div className="messages-thread panel">
        {selectedAthlete ? <>
          <header className="messages-thread-header"><span className="avatar avatar-2">{initials(selectedAthlete.full_name ?? selectedAthlete.email ?? 'A')}</span><span><b>{selectedAthlete.full_name || 'Athlete'}</b><small>{selectedAthlete.email}</small></span><span className="messages-thread-status"><i /> ASSIGNED</span></header>
          <div className="messages-history" aria-live="polite">
            {loading ? <div className="messages-empty">Loading conversation…</div> : messages.length ? messages.map((message) => {
              const sentByCoach = message.sender_id === coachId;
              return <article key={message.id} className={`message-bubble ${sentByCoach ? 'message-outgoing' : 'message-incoming'}`}>
                <p>{message.body}</p>
                <time dateTime={message.created_at}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(message.created_at))}</time>
              </article>;
            }) : <div className="messages-empty"><span className="messages-empty-icon"><MessageSquare size={20} /></span><b>Start the conversation</b><span>Send a note to {selectedAthlete.full_name || 'your athlete'}.</span></div>}
          </div>
          <form className="messages-composer" onSubmit={(event) => void sendMessage(event)}>
            <label className="sr-only" htmlFor="message-draft">Write a message</label>
            <textarea id="message-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" rows={2} maxLength={4000} disabled={sending} />
            <div><small>{draft.length}/4000</small><button className="button button-primary" type="submit" disabled={!draft.trim() || sending}><Send size={15} />{sending ? 'Sending…' : 'Send'}</button></div>
          </form>
        </> : <div className="messages-empty messages-no-selection"><span className="messages-empty-icon"><MessageSquare size={20} /></span><b>Select an athlete</b><span>Choose someone from your active roster to view messages.</span></div>}
      </div>
    </section>
  </>;
}

function initials(name: string) {
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A';
}