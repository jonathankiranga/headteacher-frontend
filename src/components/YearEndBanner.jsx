import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getYearEndStatus } from '../utils/api.js';

/**
 * Shown on the headteacher HomePage when:
 *   - The school's final term has ended (end_date < today)
 *   - Year-end close has NOT yet been run for that year
 *   - There are still Active students
 *
 * The banner persists across page loads until the headteacher either:
 *   - Taps "Run Year-End Close" (navigates to /promotion)
 *   - Dismisses it for this session (stored in sessionStorage)
 */
export default function YearEndBanner({ schoolId }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('yearEndBannerDismissed') === 'true'
  );

  useEffect(() => {
    if (!schoolId || dismissed) return;
    getYearEndStatus(schoolId)
      .then(setStatus)
      .catch(() => {}); // non-blocking
  }, [schoolId, dismissed]);

  function dismiss() {
    sessionStorage.setItem('yearEndBannerDismissed', 'true');
    setDismissed(true);
  }

  if (dismissed || !status?.needs_close) return null;

  const endDate = status.last_term_ended
    ? new Date(status.last_term_ended).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const daysSince = status.last_term_ended
    ? Math.floor((Date.now() - new Date(status.last_term_ended)) / 86400000)
    : 0;

  return (
    <div style={{
      margin: '12px 12px 0',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      border: '1.5px solid #F9A825',
    }}>
      {/* Amber top stripe */}
      <div style={{ height: 4, backgroundColor: '#F9A825' }} />

      <div style={{ backgroundColor: '#FFFDE7', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>🎓</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 3 }}>
              Year-End Close Needed — {status.year}
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 10 }}>
              {endDate
                ? `Term 3 ended ${daysSince} day${daysSince === 1 ? '' : 's'} ago (${endDate}).`
                : `Academic year ${status.year} has ended.`}
              {' '}Students are still in their old classes. Run Year-End Close to move everyone up automatically.
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/promotion')}
                style={{
                  backgroundColor: '#F9A825', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 16px', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer',
                }}>
                Run Year-End Close →
              </button>
              <button
                onClick={dismiss}
                style={{
                  backgroundColor: 'transparent', color: '#888', border: '1px solid #DDD',
                  borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                }}>
                Remind me later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
