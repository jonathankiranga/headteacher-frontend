import React, { useEffect, useRef, useState } from 'react';
import { getHeadTeacherTerms, acceptHeadTeacherTerms } from '../utils/api.js';

/**
 * TermsAcceptance — mandatory Headteacher Terms & Conditions gate.
 * Shown after OTP login: the headteacher cannot proceed until they accept
 * the current version. On acceptance the backend emails them a copy (with CC)
 * and this component reports success via onAccepted().
 */
export default function TermsAcceptance({ schoolId, version: expectVersion, onAccepted, onBack }) {
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!schoolId || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    getHeadTeacherTerms(schoolId)
      .then(d => {
        setTerms(d);
        setError('');
      })
      .catch(e => {
        console.error('[TermsAcceptance] Failed to load terms:', e);
        setError(e.response?.data?.error || 'Failed to load Terms & Conditions. Check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }, [schoolId]);

  async function handleAccept() {
    if (!checked || !schoolId) return;
    setAccepting(true);
    setError('');
    try {
      const result = await acceptHeadTeacherTerms(schoolId);
      setDone(result);
    } catch (e) {
      console.error('[TermsAcceptance] Accept failed:', e);
      setError(e.response?.data?.error || 'Failed to record your acceptance. Please try again.');
    }
    setAccepting(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '12px 20px', borderRadius: 10 }}>Loading Terms &amp; Conditions…</p>
      </div>
    );
  }

  if (error && !terms) {
    return (
      <div className="bg-white rounded-card p-6 shadow-xl mx-auto" style={{ maxWidth: 560 }}>
        <p className="text-sm" style={{ color: '#C62828' }}>{error}</p>
        <div className="flex gap-2 mt-4">
          {onBack && <button onClick={onBack} className="btn-ghost text-sm">← Back to login</button>}
          <button onClick={() => { fetchedRef.current = false; setLoading(true); window.location.reload(); }} className="btn-primary text-sm">Retry</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-card p-6 shadow-xl mx-auto" style={{ maxWidth: 560 }}>
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3" style={{ backgroundColor: '#E8F5E9' }}>
            <span style={{ fontSize: 26, color: '#2E7D32' }}>✓</span>
          </div>
          <h2 className="text-lg font-bold" style={{ color: '#333' }}>Acceptance Recorded</h2>
        </div>
        <p className="text-sm mb-3" style={{ color: '#444', lineHeight: 1.6 }}>
          Thank you. You have accepted the Headteacher Terms &amp; Conditions
          {terms && terms.effective_date ? ` (version ${terms.version}, effective ${terms.effective_date})` : ''}.
        </p>
        <div className="p-3 rounded-lg mb-4 text-sm" style={{ backgroundColor: '#FFF8E1', color: '#8A6D00' }}>
          📧 A copy has been emailed to <strong>{done.emailed_to || 'your registered email'}</strong>
          {done.cc && done.cc.length > 0 ? ` (CC: ${done.cc.join(', ')})` : ''}. Please keep it for your records.
        </div>
        <p className="text-xs mb-4" style={{ color: '#777' }}>
          Exiting this agreement requires at least 90 days' written notice. You can export all school data at any time.
        </p>
        <button onClick={onAccepted} className="btn-primary w-full">Continue to my dashboard</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-xl overflow-hidden" style={{ maxWidth: 560, margin: 'auto' }}>
      <div style={{ backgroundColor: '#7B4F9B', padding: '16px 20px' }}>
        <h2 className="text-base font-bold text-white">Headteacher Terms &amp; Conditions</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
          v{terms?.version || ''} · Effective {terms?.effective_date || ''} · action required
        </p>
      </div>

      <div style={{ maxHeight: '45vh', overflowY: 'auto', padding: '16px 20px' }}>
        {Array.isArray(terms?.sections) && terms.sections.map(s => (
          <div key={s.id} className="mb-4">
            <h3 className="text-sm font-bold mb-1" style={{ color: '#7B4F9B' }}>{s.heading}</h3>
            <div className="text-xs whitespace-pre-line" style={{ color: '#444', lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #F0F0F0', padding: '16px 20px' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="mt-1"
            style={{ width: 18, height: 18 }}
          />
          <span className="text-xs" style={{ color: '#555', lineHeight: 1.6 }}>
            I am the School Head / Headteacher. I have read and understood these Terms and Conditions and I accept them
            on my own behalf and on behalf of my school. A copy will be sent to my registered email.
          </span>
        </label>

        {error && (
          <div className="text-xs mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>{error}</div>
        )}

        <div className="flex gap-2 mt-4">
          {onBack && <button onClick={onBack} className="btn-ghost text-sm">← Back</button>}
          <button
            onClick={handleAccept}
            disabled={!checked || accepting}
            className="btn-primary flex-1 text-sm"
          >
            {accepting ? 'Recording acceptance & sending email…' : `I Accept — Continue`}
          </button>
        </div>
      </div>
    </div>
  );
}