/**
 * AdminDashboard.tsx – Admin view with stats cards, filterable application table,
 * inline status update, and real-time event handling.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAdminApplications,
  fetchAdminStats,
  updateApplicationStatus,
} from '../api/application.api';
import { getErrorMessage } from '../api/axios';
import { StatusBadge } from '../components/StatusBadge';
import { StatsCard } from '../components/StatsCard';
import { useSocket } from '../context/SocketContext';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TYPE_LABELS,
  ApplicationStatus,
  ApplicationType,
  PaginatedApplications,
  PopulatedUser,
  StatusStats,
  VALID_TRANSITIONS,
} from '../types';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCS_NEEDED',
  'COMPLETED',
  'REJECTED',
];

const TYPE_OPTIONS: ApplicationType[] = [
  'PASSPORT',
  'DRIVING_LICENCE',
  'AADHAAR_UPDATE',
  'OTHER',
];

export function AdminDashboard() {
  const [stats, setStats] = useState<StatusStats | null>(null);
  const [data, setData] = useState<PaginatedApplications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ApplicationType | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Inline status update state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState('');

  const { socket, addToast } = useSocket();

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchAdminStats();
      setStats(s);
    } catch {
      /* stats are non-critical */
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminApplications({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setData(result);
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search, page]);

  useEffect(() => {
    loadStats();
    loadApplications();
  }, [loadStats, loadApplications]);

  // Listen for new applications so the admin list stays fresh
  useEffect(() => {
    if (!socket) return;

    const handler = () => {
      loadStats();
      loadApplications();
    };

    socket.on('application:created', handler);
    return () => {
      socket.off('application:created', handler);
    };
  }, [socket, loadStats, loadApplications]);

  const handleStatusChange = async (
    appId: string,
    newStatus: ApplicationStatus,
    note: string
  ) => {
    setUpdatingId(appId);
    setUpdateError('');
    try {
      await updateApplicationStatus(appId, newStatus, note);
      addToast({
        title: 'Status updated',
        body: `Application moved to ${APPLICATION_STATUS_LABELS[newStatus]}`,
        tone: 'success',
      });
      await Promise.all([loadStats(), loadApplications()]);
    } catch (err) {
      setUpdateError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginBottom: '1rem' }}>
        Admin Dashboard
      </h1>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <StatsCard label="Total" value={stats.total} accent="#0f172a" />
          <StatsCard label="Submitted" value={stats.SUBMITTED} accent="#0369a1" />
          <StatsCard label="Under Review" value={stats.UNDER_REVIEW} accent="#b45309" />
          <StatsCard label="Docs Needed" value={stats.DOCS_NEEDED} accent="#c2410c" />
          <StatsCard label="Completed" value={stats.COMPLETED} accent="#15803d" />
          <StatsCard label="Rejected" value={stats.REJECTED} accent="#b91c1c" />
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="form-input"
          placeholder="Search by title or customer name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ApplicationStatus | '');
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {APPLICATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as ApplicationType | '');
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {APPLICATION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {updateError && <div className="alert-error">{updateError}</div>}

      {/* Application table */}
      {loading && !data ? (
        <p>Loading applications...</p>
      ) : data && data.applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          No applications found matching your filters.
        </div>
      ) : data ? (
        <>
          <div className="table-wrapper card">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map((app) => {
                  const owner =
                    typeof app.userId === 'object' && app.userId !== null
                      ? (app.userId as PopulatedUser)
                      : null;
                  const transitions = VALID_TRANSITIONS[app.status];

                  return (
                    <tr key={app._id}>
                      <td>
                        <Link to={`/applications/${app._id}`} style={{ fontWeight: 600 }}>
                          {app.title}
                        </Link>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {owner ? owner.name : '—'}
                      </td>
                      <td>{APPLICATION_TYPE_LABELS[app.type]}</td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {transitions.length > 0 ? (
                          <StatusUpdateControl
                            appId={app._id}
                            transitions={transitions}
                            updating={updatingId === app._id}
                            onUpdate={handleStatusChange}
                          />
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            Final
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

/**
 * Inline status update dropdown + optional note input, displayed inside each table row.
 */
function StatusUpdateControl({
  appId,
  transitions,
  updating,
  onUpdate,
}: {
  appId: string;
  transitions: ApplicationStatus[];
  updating: boolean;
  onUpdate: (appId: string, status: ApplicationStatus, note: string) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(transitions[0]);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(appId, selectedStatus, note);
    setNote('');
    setShowNote(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <select
        className="form-select"
        style={{ width: 'auto', minWidth: 130, fontSize: '0.82rem', padding: '0.3rem 0.5rem' }}
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
        disabled={updating}
      >
        {transitions.map((s) => (
          <option key={s} value={s}>
            {APPLICATION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setShowNote((prev) => !prev)}
        title="Add a note"
        disabled={updating}
      >
        📝
      </button>

      <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
        {updating ? '...' : 'Update'}
      </button>

      {showNote && (
        <input
          type="text"
          className="form-input"
          style={{ flex: '1 1 100%', marginTop: '0.3rem', fontSize: '0.82rem' }}
          placeholder="Optional note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
      )}
    </form>
  );
}
