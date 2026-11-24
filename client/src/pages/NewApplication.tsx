/**
 * NewApplication.tsx – Form for customers to create a document application.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApplication } from '../api/application.api';
import { getErrorMessage } from '../api/axios';
import { APPLICATION_TYPE_LABELS, ApplicationType, DocumentMeta } from '../types';

const APP_TYPES = Object.entries(APPLICATION_TYPE_LABELS) as [ApplicationType, string][];

export function NewApplicationPage() {
  const navigate = useNavigate();

  const [type, setType] = useState<ApplicationType>('PASSPORT');
  const [title, setTitle] = useState('');
  const [documents, setDocuments] = useState<DocumentMeta[]>([
    { name: '', type: '', notes: '' },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateDoc = (idx: number, field: keyof DocumentMeta, value: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === idx ? { ...doc, [field]: value } : doc))
    );
  };

  const addDoc = () => {
    setDocuments((prev) => [...prev, { name: '', type: '', notes: '' }]);
  };

  const removeDoc = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const cleanDocs = documents.filter((d) => d.name.trim() && d.type.trim());
      const app = await createApplication({ type, title, documents: cleanDocs });
      navigate(`/applications/${app._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <h1 className="page-title" style={{ marginBottom: '1.25rem' }}>
        New Application
      </h1>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label" htmlFor="type">
            Application Type
          </label>
          <select
            id="type"
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as ApplicationType)}
          >
            {APP_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Title / Short Description
          </label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={200}
            placeholder="e.g. Fresh passport application for Aarav"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <label className="form-label" style={{ margin: 0 }}>
              Document Metadata
            </label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addDoc}>
              + Add Document
            </button>
          </div>

          {documents.map((doc, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: '2 1 140px' }}>
                {idx === 0 && (
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    Name
                  </label>
                )}
                <input
                  className="form-input"
                  placeholder="Document name"
                  value={doc.name}
                  onChange={(e) => updateDoc(idx, 'name', e.target.value)}
                />
              </div>
              <div style={{ flex: '2 1 120px' }}>
                {idx === 0 && (
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    Type
                  </label>
                )}
                <input
                  className="form-input"
                  placeholder="e.g. ID Proof"
                  value={doc.type}
                  onChange={(e) => updateDoc(idx, 'type', e.target.value)}
                />
              </div>
              <div style={{ flex: '3 1 150px' }}>
                {idx === 0 && (
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>
                    Notes
                  </label>
                )}
                <input
                  className="form-input"
                  placeholder="Optional notes"
                  value={doc.notes ?? ''}
                  onChange={(e) => updateDoc(idx, 'notes', e.target.value)}
                />
              </div>
              {documents.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => removeDoc(idx)}
                  title="Remove this document"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
