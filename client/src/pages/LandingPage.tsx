/**
 * LandingPage.tsx – Interactive, animated landing page explaining DocTrack
 * with visual workflows, live status simulator, and service catalog.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/StatusBadge';
import { ApplicationStatus } from '../types';

export function LandingPage() {
  const { user } = useAuth();
  const { adminOnline } = useSocket();

  // Interactive status simulator state
  const [simulatedStatus, setSimulatedStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [simulatedNote, setSimulatedNote] = useState('Documents are being verified by staff.');

  const sampleStages: { status: ApplicationStatus; label: string; desc: string; note: string }[] = [
    {
      status: 'SUBMITTED',
      label: '1. Submitted',
      desc: 'Customer submits details & document checklist.',
      note: 'Application entered the queue.',
    },
    {
      status: 'UNDER_REVIEW',
      label: '2. Under Review',
      desc: 'Admin team verifies details against government guidelines.',
      note: 'Verifying identity proof and addresses.',
    },
    {
      status: 'DOCS_NEEDED',
      label: '3. Docs Needed',
      desc: 'Discrepancy found? Admin requests specific document re-upload.',
      note: 'Please provide clear address proof with current PIN.',
    },
    {
      status: 'COMPLETED',
      label: '4. Completed',
      desc: 'Verification passed & application forwarded/approved.',
      note: 'Application successfully finalized and dispatched.',
    },
    {
      status: 'REJECTED',
      label: 'Rejected',
      desc: 'Terminal state if application does not meet criteria.',
      note: 'Disqualified due to duplicate records.',
    },
  ];

  return (
    <div className="landing-page">
      {/* ── HERO SECTION ── */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge animate-fade">
              <span className="hero-badge-dot" />
              <span>Instant Live WebSocket Tracking</span>
            </div>

            <h1 className="hero-title animate-fade">
              Track Government Document Applications <span className="text-gradient">Live in Real-Time</span>
            </h1>

            <p className="hero-subtitle animate-fade">
              DocTrack is a modern document consultancy platform. Customers apply for Passports,
              Driving Licences, and Aadhaar Updates, while administrators review and transition
              applications through audited stages—broadcasting instant updates with zero page refreshes.
            </p>

            <div className="hero-actions animate-fade">
              {user ? (
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="btn btn-primary btn-lg"
                >
                  Go to {user.role === 'admin' ? 'Admin Dashboard' : 'My Applications'} →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Apply for Documents →
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Sign In to Portal
                  </Link>
                </>
              )}
            </div>

            <div className="hero-metrics">
              <div className="metric-item">
                <span className="metric-val">&lt; 1s</span>
                <span className="metric-lbl">Socket.IO latency</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-val">100%</span>
                <span className="metric-lbl">Audited StatusHistory</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-item">
                <span className="metric-val">Redis</span>
                <span className="metric-lbl">Sub-100ms caching</span>
              </div>
            </div>
          </div>

          {/* Hero Live Mockup Card */}
          <div className="hero-mockup animate-float">
            <div className="mockup-window card">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="mockup-dot dot-red" />
                  <span className="mockup-dot dot-yellow" />
                  <span className="mockup-dot dot-green" />
                </div>
                <div className="mockup-url">
                  <span className="mockup-lock">🔒</span> doctrack.local/applications/live
                </div>
                <div className="mockup-status">
                  <span className={`presence-dot ${adminOnline ? 'online' : 'online'}`} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Admin Active</span>
                </div>
              </div>

              <div className="mockup-body">
                <div className="mockup-app-header">
                  <div>
                    <span className="mockup-tag">PASSPORT SERVICE</span>
                    <h3 style={{ fontSize: '1.15rem', marginTop: '0.2rem', fontWeight: 700 }}>
                      Fresh Tatkaal Passport Application
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Applicant: Rajesh Kumar (rajesh@example.com)
                    </p>
                  </div>
                  <div>
                    <StatusBadge status="UNDER_REVIEW" />
                  </div>
                </div>

                <div className="mockup-progress">
                  <div className="mockup-progress-bar" style={{ width: '50%' }} />
                </div>

                <div className="mockup-timeline-sample">
                  <div className="timeline-mini-item">
                    <span className="timeline-mini-dot active" />
                    <div>
                      <strong>Under Review</strong>
                      <p>Admin started document verification checklist.</p>
                      <small>Just now • by Officer Sharma</small>
                    </div>
                  </div>
                  <div className="timeline-mini-item">
                    <span className="timeline-mini-dot done" />
                    <div>
                      <strong>Application Submitted</strong>
                      <p>Attached Aadhaar, Pan Card & Voter ID metadata.</p>
                      <small>10 mins ago • by Customer</small>
                    </div>
                  </div>
                </div>

                <div className="mockup-toast-preview animate-pulse">
                  <div className="toast-icon">⚡</div>
                  <div>
                    <strong>Live Notification</strong>
                    <p>Status changed to Under Review without page reload!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE SERVICES SECTION ── */}
      <section className="section-block bg-surface">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">SERVICES CATALOG</span>
            <h2 className="section-title">Government Document Services We Handle</h2>
            <p className="section-desc">
              Customers can register and submit applications for all common public documentation needs.
            </p>
          </div>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🛂</div>
              <h3>Passport Services</h3>
              <p>Fresh passport applications, renewals, Tatkaal priority processing, and address endorsement verification.</p>
              <ul className="service-checklist">
                <li>✓ Proof of Identity & DOB</li>
                <li>✓ Address & Police Verification Support</li>
                <li>✓ Real-time status alerts</li>
              </ul>
            </div>

            <div className="service-card">
              <div className="service-icon">🚗</div>
              <h3>Driving Licence</h3>
              <p>Learner's licence assistance, permanent driving licence processing, and vehicle class endorsements.</p>
              <ul className="service-checklist">
                <li>✓ Medical certificate metadata</li>
                <li>✓ Age & residence proof audit</li>
                <li>✓ RTO process updates</li>
              </ul>
            </div>

            <div className="service-card">
              <div className="service-icon">🆔</div>
              <h3>Aadhaar Update</h3>
              <p>Biometric and demographic corrections including name changes, phone updates, and residential shifts.</p>
              <ul className="service-checklist">
                <li>✓ Supporting government ID review</li>
                <li>✓ Correction verification tracker</li>
                <li>✓ Instant rejection / acceptance notes</li>
              </ul>
            </div>

            <div className="service-card">
              <div className="service-icon">📑</div>
              <h3>Other Certificates</h3>
              <p>Birth certificates, caste certificates, income certificates, and notary documentation support.</p>
              <ul className="service-checklist">
                <li>✓ Custom document checklists</li>
                <li>✓ Flexible document notes</li>
                <li>✓ Transparent multi-stage timeline</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE STATUS SIMULATOR ── */}
      <section className="section-block">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">AUDITED WORKFLOW</span>
            <h2 className="section-title">Interactive Status Transition Simulator</h2>
            <p className="section-desc">
              Every status move is verified by the backend against business rules, logged to MongoDB
              StatusHistory, and emitted via Socket.IO. Click any stage below to simulate:
            </p>
          </div>

          <div className="simulator-box card">
            <div className="stage-selectors">
              {sampleStages.map((stage) => (
                <button
                  key={stage.status}
                  type="button"
                  className={`stage-button ${simulatedStatus === stage.status ? 'active' : ''}`}
                  onClick={() => {
                    setSimulatedStatus(stage.status);
                    setSimulatedNote(stage.note);
                  }}
                >
                  <span className="stage-indicator" />
                  <span>{stage.label}</span>
                </button>
              ))}
            </div>

            <div className="simulator-display">
              <div className="simulator-current">
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Simulated Application State:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <StatusBadge status={simulatedStatus} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {sampleStages.find((s) => s.status === simulatedStatus)?.desc}
                  </span>
                </div>

                <div className="simulator-note-box">
                  <strong>Audited Admin Note:</strong>
                  <p>"{simulatedNote}"</p>
                </div>
              </div>

              <div className="simulator-event-log">
                <span className="event-log-title">⚡ Emitted Socket.IO Event:</span>
                <pre className="event-code">
{`socket.emit('application:statusUpdated', {
  applicationId: "67436af8c01b29d",
  status: "${simulatedStatus}",
  note: "${simulatedNote}",
  updatedAt: "${new Date().toISOString()}"
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE HIGHLIGHTS ── */}
      <section className="section-block bg-surface">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">ENTERPRISE TECH STACK</span>
            <h2 className="section-title">Engineered for Performance & Reliability</h2>
            <p className="section-desc">
              DocTrack implements production patterns across authentication, state persistence, caching, and websockets.
            </p>
          </div>

          <div className="tech-highlights-grid">
            <div className="tech-card">
              <div className="tech-icon">⚡</div>
              <h4>Socket.IO Live Sync</h4>
              <p>Per-user private rooms (`user:&lt;userId&gt;`) guarantee users only receive their own updates, with live admin presence.</p>
            </div>

            <div className="tech-card">
              <div className="tech-icon">🚀</div>
              <h4>Upstash Redis Caching</h4>
              <p>Admin statistics and paginated queries cached with a 60-second TTL, invalidated immediately on any application change.</p>
            </div>

            <div className="tech-card">
              <div className="tech-icon">🛡️</div>
              <h4>Brute-Force Rate Limiting</h4>
              <p>Redis sliding counter blocks repeated failed logins (5 attempts per 15 minutes) with clean HTTP 429 errors.</p>
            </div>

            <div className="tech-card">
              <div className="tech-icon">📜</div>
              <h4>Zod Validation Everywhere</h4>
              <p>All request bodies, query parameters, and IDs undergo strict schema validation with precise field-level errors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO TEST CREDENTIALS CALLOUT ── */}
      <section className="section-block">
        <div className="container">
          <div className="demo-credentials-box card">
            <div className="demo-content">
              <h3>🚀 Ready to Test the Live Application?</h3>
              <p>Use these pre-seeded credentials to test admin review or register your own customer account:</p>

              <div className="credentials-pills">
                <div className="cred-card">
                  <span className="cred-role">ADMIN ROLE</span>
                  <div className="cred-row">
                    <strong>Email:</strong> <code>admin@doctrack.local</code>
                  </div>
                  <div className="cred-row">
                    <strong>Password:</strong> <code>Admin@123</code>
                  </div>
                  <small>Full dashboard: filter apps, update statuses & view live stats</small>
                </div>

                <div className="cred-card">
                  <span className="cred-role">CUSTOMER ROLE</span>
                  <div className="cred-row">
                    <strong>Register:</strong> Instant registration at <code>/register</code>
                  </div>
                  <div className="cred-row">
                    <strong>Capability:</strong> Create applications, view live timeline
                  </div>
                  <small>Receive instant status toasts when admin changes status!</small>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary">
                  Login to Admin / Customer Portal →
                </Link>
                <Link to="/register" className="btn btn-secondary">
                  Create New Customer Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="container footer-content">
          <div>
            <div className="navbar-brand" style={{ marginBottom: '0.5rem' }}>
              <span>📄</span>
              <span>DocTrack</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 360 }}>
              Mini Document Consultancy & Live Status Tracking Platform. Built as a portfolio project
              for the Full Stack Development Internship.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <strong>Quick Links</strong>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/dashboard">Customer Portal</Link>
              <Link to="/admin">Admin Portal</Link>
            </div>
            <div className="footer-col">
              <strong>Tech Stack</strong>
              <span>React 19 & Vite</span>
              <span>Express.js & TypeScript</span>
              <span>MongoDB Atlas</span>
              <span>Upstash Redis</span>
              <span>Socket.IO</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container" style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
            © {new Date().getFullYear()} DocTrack. Developed by Sanjay Sharma for Nish E-Service OPC Private Limited.
          </div>
        </div>
      </footer>
    </div>
  );
}
