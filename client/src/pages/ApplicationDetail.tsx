/**
 * ApplicationDetail.tsx – Shows a single application's info, documents,
 * and the full status history timeline with live Socket.IO updates.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchApplicationDetail } from '../api/application.api';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { useSocket } from '../context/SocketContext';
import {
  Application,
  APPLICATION_TYPE_LABELS,
  PopulatedUser,
  StatusHistoryEntry,
  StatusUpdatedEvent,
} from '../types';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchApplicationDetail(id);
      setApplication(result.application);
      setHistory(result.history);
    } catch {
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live update – refresh full detail when this application's status changes
  useEffect(() => {
    if (!socket || !id) return;

    const handler = (event: StatusUpdatedEvent) => {
      if (event.applicationId === id) {
        load();
      }
    };

    socket.on('application:statusUpdated', handler);
    return () => {
      socket.off('application:statusUpdated', handler);
    };
  }, [socket, id, load]);

  if (loading && !application) {
    return (
      <div className="container">
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container">
        <div className="alert-error">{error || 'Application not found.'}</div>
        <Link to="/dashboard" className="btn btn-secondary">
          ← Back
        </Link>
      </div>
    );
  }

  const owner =
    typeof application.userId === 'object' && application.userId !== null
      ? (application.userId as PopulatedUser)
      : null;

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <Link
        to="/dashboard"
        style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem', display: 'inline-block' }}
      >
        ← Back to dashboard
      </Link>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h1 className="page-title">{application.title}</h1>
          <StatusBadge status={application.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Type:</span>{' '}
            <strong>{APPLICATION_TYPE_LABELS[application.type]}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Submitted:</span>{' '}
            <strong>{new Date(application.createdAt).toLocaleDateString()}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Last updated:</span>{' '}
            <strong>{new Date(application.updatedAt).toLocaleString()}</strong>
          </div>
          {owner && (
            <div>
              <span style={{ color: '#64748b' }}>Applicant:</span>{' '}
              <strong>{owner.name}</strong> ({owner.email})
            </div>
          )}
        </div>
      </div>

      {/* Documents section */}
      {application.documents.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Documents</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {application.documents.map((doc, idx) => (
                  <tr key={idx}>
                    <td>{doc.name}</td>
                    <td>{doc.type}</td>
                    <td style={{ color: '#64748b' }}>{doc.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status History Timeline */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Status History</h2>
        <StatusTimeline history={history} />
      </div>
    </div>
  );
}
