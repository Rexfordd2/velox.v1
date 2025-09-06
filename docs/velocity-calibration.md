# Velocity Calibration — User Guide & QA

## Overview
- **When and why to calibrate**: Calibrate whenever you set up a new camera/device, change camera placement, switch lenses, or notice unrealistic velocities. Calibration ensures accurate pixel→meter scaling so computed speeds match real-world distances.
- **Reference vs Plane (homography) methods**:
  - **Reference (known-length)**: Quick and robust when you have an object of known length in view (e.g., credit card, tape measure). Sets a global pixel scale.
  - **Plane (4-point homography)**: Defines the workout floor plane for more geometry-aware scaling when perspective distortion is significant. Useful for wide fields of view or oblique camera angles.
- **Where to access**: App → Settings → Sensors → Calibration.

## Prerequisites
- Good, even lighting to avoid extreme highlights/shadows.
- Camera roughly chest height and stable; avoid shaking during calibration.
- Avoid extreme wide‑angle distortion if possible; step back if using ultra‑wide lenses.

## Method A — Known-length Reference
1) Place a known object in view (e.g., credit card = 0.0856 m, a 0.5 m stick, or a tape measure).
2) Open Calibration → Measure tab.
3) Draw a line across the known object’s edges, fully spanning its length.
4) Choose the real length from the dropdown or input a custom length in meters.
5) Save Calibration.

Screenshots:
- ![Measure Tab – Draw Line](./images/calibration/measure_draw_line.png)
- ![Length Picker](./images/calibration/length_picker.png)
- ![Save Success](./images/calibration/save_success.png)

## Method B — Plane (4-point)
1) In the Plane tab, tap four corners on the floor to define the workout plane.
2) Ensure a convex quadrilateral; avoid nearly collinear or overlapping points.
3) The system computes a homography and optionally estimates camera tilt.
4) Save Calibration.

Screenshots:
- ![Plane Tab – 4 Taps](./images/calibration/plane_4_taps.png)
- ![Homography Preview Grid](./images/calibration/homography_preview.png)
- ![Tilt Estimation](./images/calibration/tilt_estimate.png)

## Verifying Calibration
- Open Developer screen: VelocityDevScreen (or deep link `velox://dev/velocity`).
- Walk a straight line of ~1 m in view; instantaneous v should be reasonable (≈ 0.7–1.6 m/s for normal walk).
- Check overlays/metrics: pixel→meter scale, outliers, and confidence.

Screenshot:
- ![Velocity Dev – Live Overlay](./images/calibration/velocity_dev_overlay.png)

## UX Notes & Edge Cases
- Warn if drawn line length < 50 px (too short for accuracy).
- If homography determinant ≈ 0 or points are nearly collinear, prompt user to re‑tap.
- Display calibration age; if > 14 days, flag “Recalibration Recommended”.
- For wide‑angle lenses, suggest standing further back (≥ 2 m) to reduce distortion.
- Store both local (AsyncStorage) and cloud (Supabase) copies; last‑writer‑wins using `updatedAt`.

## Acceptance Criteria (QA)
- Measuring a 0.5 m object and saving yields `pixelsPerMeter` within ±5% repeatability across attempts.
- Plane method produces a valid homography H (non‑singular), and the projected grid visually aligns with the floor.
- `setPixelScale(...)` is called on app start when a saved calibration exists.
- Velocity demo shows consistent speeds within expected human ranges for the activity.

## Screenshot Capture Checklist (for contributors)
- Place final PNGs in `docs/images/calibration/` (use filenames listed above).
- Use a device with a 1080p+ display; avoid motion blur in captures.
- Crop any sensitive information; keep aspect 16:9 or 9:16.
### Velocity Calibration

This flow lets users calibrate pixel-to-meter scale for velocity tracking.

- Methods:
  - Reference length: draw a line over a known object and select a preset (e.g., credit card 0.0856 m, 0.3 m, 0.5 m, 1.0 m).
  - Plane homography: tap 4 points on the floor plane to compute a homography. Optionally record camera tilt.

- Persistence:
  - If authenticated, calibration is mirrored to `user_calibration` in Supabase.
  - Always saved locally in AsyncStorage as a fallback.

- Integration:
  - `packages/ai-analysis/src/utils/velocity.ts` exposes `setPixelScale(scale, homography?, tiltDeg?)`.
  - `apps/mobile/src/hooks/usePoseDetector.ts` loads calibration on mount and configures the scale.

Screenshots/TODOs
- DONE: Add UI screenshots for Measure and Plane tabs.
- TODO: Validate homography selection UX and add tilt estimation helper.


### Developer Validation Screen

- A hidden screen `VelocityDev` is available to validate pixel→meter scale and velocity.
- Deep link: `velox://dev/velocity`

What it shows:
- Live pose overlay (keypoints)
- Pixel→meter scale (ppm) from calibration
- Instantaneous velocity (max keypoint) in m/s
- Smoothed velocity (buffered median avg) in m/s
- Best confidence across keypoints
- Outlier count (large deltas across frames)

How to open:
- From device/simulator, run: `npx uri-scheme open velox://dev/velocity --ios` or `--android`.
- Or in code navigate to `navigation.navigate('VelocityDev')`.

Manual QA steps
1. Fresh install, no calibration
   - Open `velox://dev/velocity`
   - Pixels/meter should be 0.00 or unset; velocities should remain ~0; Confidence varies with detection.
   - Tap "Go to Calibration" to navigate to `Calibration` screen.
2. Reference calibration
   - Complete reference-length calibration; verify ppm > 0.
   - Return to `VelocityDev` via deep link; confirm Pixels/meter > 0 and instantaneous velocity responds to movement.
3. Plane calibration (if implemented)
   - Complete plane homography; verify velocity updates and remains stable across camera tilt.
4. Sanity checks
   - Cover camera briefly; Confidence drops; velocities pause or reduce.
   - Sudden motion spikes increment Outliers; normal movement keeps Outliers low.
   - Button navigates to `Calibration` successfully.
5. Linking
   - iOS and Android both resolve `velox://dev/velocity` to `VelocityDev` route.


