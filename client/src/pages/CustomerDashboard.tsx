/**
 * CustomerDashboard.tsx – Lists the logged-in customer's applications with
 * live status updates via Socket.IO.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyApplications } from '../api/application.api';
import { StatusBadge } from '../components/StatusBadge';
import { useSocket } from '../context/SocketContext';
import {
  Application,
  APPLICATION_TYPE_LABELS,
  PaginatedApplications,
  StatusUpdatedEvent,
} from '../types';

export function CustomerDashboard() {
  const [data, setData] = useState<PaginatedApplications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const { socket } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchMyApplications(page);
      setData(result);
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // Live status update – patch the application in-place without refetching
  useEffect(() => {
    if (!socket) return;

    const handler = (event: StatusUpdatedEvent) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          applications: prev.applications.map((app: Application) =>
            app._id === event.applicationId
              ? { ...app, status: event.status, updatedAt: event.updatedAt }
              : app
          ),
        };
      });
    };

    socket.on('application:statusUpdated', handler);
    return () => {
      socket.off('application:statusUpdated', handler);
    };
  }, [socket]);

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">My Applications</h1>
        <Link to="/applications/new" className="btn btn-primary">
          + New Application
        </Link>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading && !data ? (
        <p>Loading...</p>
      ) : data && data.applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ marginBottom: '1rem', color: '#64748b' }}>
            You haven't submitted any applications yet.
          </p>
          <Link to="/applications/new" className="btn btn-primary">
            Submit your first application
          </Link>
        </div>
      ) : data ? (
        <>
          <div className="table-wrapper card">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map((app) => (
                  <tr key={app._id}>
                    <td style={{ fontWeight: 600 }}>{app.title}</td>
                    <td>{APPLICATION_TYPE_LABELS[app.type]}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/applications/${app._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </button>
              <span>
                Page {data.page} of {data.totalPages} ({data.total} total)
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
