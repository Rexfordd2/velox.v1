'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  validateWebFingerprint,
  gateForGlobalBoard,
  type GateResult,
} from '../../../../../packages/verify/src/attestation';

type RepMedia = {
  frontUrl?: string;
  sideUrl?: string;
};

type RepData = {
  id: string;
  media: RepMedia;
  poseConfidence: number[]; // 0..1 values
  sanityReasons: string[];
  meta?: Record<string, unknown>;
};

export default function VerifyRepPage() {
  const params = useParams<{ repId: string }>();
  const searchParams = useSearchParams();

  const [rep, setRep] = useState<RepData | null>(null);
  const [gate, setGate] = useState<GateResult | null>(null);

  // Mock fetch for rep + media
  useEffect(() => {
    const repId = params?.repId ?? 'unknown';
    const mock: RepData = {
      id: String(repId),
      media: {
        frontUrl: '',
        sideUrl: '',
      },
      poseConfidence: Array.from({ length: 60 }, (_, i) => 0.6 + 0.3 * Math.sin(i / 6)),
      sanityReasons: [],
      meta: {},
    };
    setRep(mock);
  }, [params]);

  const attestation = useMemo(() => {
    const fp = searchParams.get('fp') || '';
    const ts = Number(searchParams.get('ts') || 0);
    if (!fp || !ts) return { ok: false, reasons: ['missing_fp_or_ts'] };
    return validateWebFingerprint(fp, ts);
  }, [searchParams]);

  useEffect(() => {
    if (!rep) return;
    const dualAngles = Boolean(rep.media.frontUrl) && Boolean(rep.media.sideUrl);
    const setupWindowOk = true; // mock
    const fpsOk = true; // mock
    const result = gateForGlobalBoard({ dualAngles, setupWindowOk, attested: attestation.ok, fpsOk });
    setGate(result);
  }, [rep, attestation]);

  if (!rep) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <h1>Verify Rep #{rep.id}</h1>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2>Dual-angle Viewer</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, minHeight: 200 }}>
            <strong>Front</strong>
            {rep.media.frontUrl ? (
              <video controls src={rep.media.frontUrl} style={{ width: '100%', marginTop: 8 }} />
            ) : (
              <div style={{ marginTop: 8, color: '#6b7280' }}>No video</div>
            )}
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, minHeight: 200 }}>
            <strong>Side</strong>
            {rep.media.sideUrl ? (
              <video controls src={rep.media.sideUrl} style={{ width: '100%', marginTop: 8 }} />
            ) : (
              <div style={{ marginTop: 8, color: '#6b7280' }}>No video</div>
            )}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2>Pose Confidence Timeline</h2>
        <ConfidenceChart values={rep.poseConfidence} />
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2>Sanity Checks</h2>
        {rep.sanityReasons.length === 0 ? (
          <div style={{ color: '#10b981' }}>No issues detected</div>
        ) : (
          <ul>
            {rep.sanityReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h2>Attestation</h2>
        <div>
          <strong>Status:</strong>{' '}
          {attestation.ok ? (
            <span style={{ color: '#10b981' }}>Valid</span>
          ) : (
            <span style={{ color: '#ef4444' }}>Invalid ({attestation.reasons.join(', ')})</span>
          )}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h2>Global Leaderboard Gate</h2>
        {gate ? (
          <div>
            <div>
              <strong>Result:</strong>{' '}
              {gate.ok ? (
                <span style={{ color: '#10b981' }}>Eligible</span>
              ) : (
                <span style={{ color: '#ef4444' }}>Rejected</span>
              )}
            </div>
            {!gate.ok && gate.reasons.length > 0 && (
              <ul>
                {gate.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <section style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => alert('Approved (mock)')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #10b981',
            background: '#ecfdf5',
          }}
        >
          Approve
        </button>
        <button
          onClick={() => alert('Rejected (mock)')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #ef4444',
            background: '#fef2f2',
          }}
        >
          Reject
        </button>
      </section>
    </div>
  );
}

function ConfidenceChart({ values }: { values: number[] }) {
  const width = 600;
  const height = 120;
  const padding = 12;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * innerW + padding;
    const y = height - (v * innerH + padding);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} style={{ maxWidth: '100%' }}>
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" stroke="#e5e7eb" />
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        points={points.join(' ')}
      />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" />
    </svg>
  );
}


