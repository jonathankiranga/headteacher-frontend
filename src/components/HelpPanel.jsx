import React, { useEffect } from 'react';

/**
 * HelpPanel — slides in from the right with contextual help for any page.
 *
 * Props:
 *   open    {boolean}   — whether the panel is visible
 *   onClose {function}  — called when the user closes the panel
 *   title   {string}    — panel heading
 *   children            — help content (JSX)
 */
export default function HelpPanel({ open, onClose, title = 'Help', children }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          backgroundColor: 'rgba(0,0,0,0.35)',
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 901,
          width: '100%', maxWidth: 380,
          backgroundColor: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.22s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #F0F0F0',
          backgroundColor: '#7B4F9B',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>❓</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close help"
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
              color: '#fff', borderRadius: 8, padding: '4px 10px',
              fontSize: 18, lineHeight: 1, fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}

/* ── Small helpers used inside help content ── */

export function HelpSection({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 8,
      }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span style={{ fontWeight: 700, fontSize: 14, color: '#7B4F9B' }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: '#444', lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

export function HelpTip({ children }) {
  return (
    <div style={{
      backgroundColor: '#F3E7FA', borderLeft: '3px solid #7B4F9B',
      borderRadius: 6, padding: '8px 12px',
      fontSize: 12, color: '#5C3D76', lineHeight: 1.6,
      marginTop: 8,
    }}>
      💡 {children}
    </div>
  );
}

export function HelpStep({ n, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
      <div style={{
        minWidth: 22, height: 22, borderRadius: '50%',
        backgroundColor: '#7B4F9B', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>{n}</div>
      <div style={{ fontSize: 13, color: '#444', lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}
