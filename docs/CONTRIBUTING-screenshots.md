# Contributing Screenshots

This guide explains how to capture high-quality screenshots for the Velocity Calibration docs.

## What to Capture
- Calibration screens for both methods (Measure and Plane) and the Velocity Dev overlay.
- Use the exact filenames referenced in the guide so links resolve.

## File Naming & Location
- Place images in `docs/images/calibration/`.
- Use these exact filenames:
  - `measure_draw_line.png`
  - `length_picker.png`
  - `save_success.png`
  - `plane_4_taps.png`
  - `homography_preview.png`
  - `tilt_estimate.png`
  - `velocity_dev_overlay.png`

## Capture on Expo (iOS)
- Use a physical device for truest rendering if possible.
- iOS screenshot: Press Side Button + Volume Up simultaneously.
- If using the iOS Simulator:
  - Menu: File → New Screenshot (or ⌘S on recent Xcode versions).
  - Ensure the simulator is set to a modern device (e.g., iPhone 14/15) and 100% scale.

## Capture on Expo (Android)
- Physical device: Press Power + Volume Down simultaneously.
- Android Emulator:
  - Use the emulator’s camera icon to take a screenshot.
  - Verify the screenshot is full-resolution (1080p+ recommended).

## Recommended Tools
- Annotation (optional): CleanShot X, Shottr, or built-in Photos markup.
- Compression: `pngquant`, `ImageOptim` (macOS), or `Squoosh` web app.
- Cropping: Any native editor; keep aspect 16:9 or 9:16.

## Quality Tips
- Avoid motion blur; pause animations if needed.
- Hide sensitive info; crop status bars if distracting.
- Ensure consistent theme (light/dark) across all captures.
- Keep on-screen text legible (avoid heavy downscaling).

## Export & Compress
- Prefer PNG for UI sharpness.
- Use `pngquant --quality=70-90 --speed=1` for compact yet crisp images.
- Target ≤ 500 KB per image when possible.

## Submission Checklist
- Files are in `docs/images/calibration/` with exact names above.
- Images render correctly in `docs/velocity-calibration.md`.
- No personally identifiable data is visible.
