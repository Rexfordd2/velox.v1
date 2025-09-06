/**
 * Cross-platform attestation helpers and gating logic for the Global Leaderboard.
 */

export type GlobalBoardGateInput = {
  dualAngles: boolean;
  setupWindowOk: boolean;
  attested: boolean;
  fpsOk: boolean;
};

export type GateResult = {
  ok: boolean;
  reasons: string[];
};

/**
 * Validate a pre-hashed browser fingerprint string (web) and ensure it is recent.
 *
 * Expectations:
 * - `fingerprintHash` must look like a SHA-256 hex string (64 hex chars)
 * - `issuedAtMs` must be within `maxAgeMs` of `nowMs`
 */
export function validateWebFingerprint(
  fingerprintHash: string,
  issuedAtMs: number,
  nowMs: number = Date.now(),
  maxAgeMs: number = 5 * 60 * 1000
): GateResult {
  const reasons: string[] = [];

  const sha256Hex = /^[a-f0-9]{64}$/i;
  if (!fingerprintHash || !sha256Hex.test(fingerprintHash)) {
    reasons.push("fingerprint_invalid_format");
  }

  if (!Number.isFinite(issuedAtMs) || issuedAtMs <= 0) {
    reasons.push("fingerprint_invalid_timestamp");
  } else if (nowMs - issuedAtMs > maxAgeMs) {
    reasons.push("fingerprint_stale");
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * Minimal iOS App Attest token (no secrets). Real tokens include CBOR objects; this is a safe abstraction.
 */
export interface IOSAppAttestToken {
  keyId: string;
  challenge: string;
  attestationObject: string;
  clientDataJSON: string;
  timestampMs: number;
}

/**
 * Minimal Android Play Integrity token (no secrets). In practice this is a JWS string.
 */
export interface AndroidPlayIntegrityToken {
  signedAttestation: string;
  timestampMs: number;
}

/**
 * Mock token verification. In production, verify signatures with Apple/Google and check device + app integrity claims.
 */
export async function verifyToken(token: string): Promise<boolean> {
  // Mock behavior: accept any non-empty token string
  return Promise.resolve(typeof token === "string" && token.trim().length > 0);
}

/**
 * Apply gating rules for inclusion in the Global Leaderboard.
 */
export function gateForGlobalBoard(input: GlobalBoardGateInput): GateResult {
  const reasons: string[] = [];

  if (!input.dualAngles) reasons.push("missing_dual_angles");
  if (!input.setupWindowOk) reasons.push("setup_window_invalid");
  if (!input.attested) reasons.push("device_not_attested");
  if (!input.fpsOk) reasons.push("frame_rate_too_low");

  return { ok: reasons.length === 0, reasons };
}


