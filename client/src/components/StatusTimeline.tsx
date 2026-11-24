/**
 * StatusTimeline.tsx – Renders the chronological StatusHistory audit trail.
 */

import { APPLICATION_STATUS_LABELS, PopulatedUser, StatusHistoryEntry } from '../types';
import { StatusBadge } from './StatusBadge';

export function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p style={{ color: '#64748b' }}>No status history recorded yet.</p>;
  }

  return (
    <ul className="timeline">
      {history.map((entry) => {
        const actor =
          typeof entry.changedBy === 'object' && entry.changedBy !== null
            ? (entry.changedBy as PopulatedUser)
            : null;

        return (
          <li key={entry._id} className="timeline-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <StatusBadge status={entry.toStatus} />
              {entry.fromStatus && (
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  from {APPLICATION_STATUS_LABELS[entry.fromStatus]}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
              {new Date(entry.createdAt).toLocaleString()}
              {actor ? ` • by ${actor.name} (${actor.role ?? 'user'})` : ''}
            </div>
            {entry.note && (
              <p style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: '#1e293b' }}>
                {entry.note}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
