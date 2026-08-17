import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2, XCircle, Ticket, Ban, FilePlus2 } from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';
import { timeAgo } from '../../utils/format.js';

const TYPE_ICON = {
  request: { icon: FilePlus2, color: 'bg-brand-50 text-brand-600' },
  approval: { icon: CheckCircle2, color: 'bg-sunrise-50 text-sunrise-600' },
  rejection: { icon: XCircle, color: 'bg-red-50 text-red-600' },
  ticketed: { icon: Ticket, color: 'bg-accent-50 text-accent-600' },
  cancellation: { icon: Ban, color: 'bg-slate-100 text-slate-600' },
  system: { icon: Bell, color: 'bg-slate-100 text-slate-600' },
};

export default function NotificationsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api
      .get('/notifications')
      .then((res) => setItems(res.data.results))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const markRead = async (n) => {
    if (n.read) return;
    await api.patch(`/notifications/${n._id}/read`);
    load();
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (!items && !error) return <PageLoader message="Loading notifications..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Inbox</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="Updates about your requests and bookings will appear here." />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => {
            const t = TYPE_ICON[n.type] || TYPE_ICON.system;
            const href = n.entity === 'Booking' && n.entityId ? `/bookings/${n.entityId}` : n.entity === 'TravelRequest' && n.entityId ? '/requests' : '/notifications';
            return (
              <Link key={n._id} to={href} onClick={() => markRead(n)}>
                <Card className={`p-4 transition hover:shadow-card ${n.read ? 'opacity-70' : 'border-l-4 border-l-brand-500'}`}>
                  <div className="flex items-start gap-3.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.color}`}>
                      <t.icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
