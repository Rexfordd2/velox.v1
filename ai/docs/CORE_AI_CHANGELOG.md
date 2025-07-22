# Core AI Changelog

## [1.1.0] - 2024-03-19

### Added
- New exercise analyzers:
  - Bench Press
  - Push-up
  - Pull-up
  - Overhead Press
  - Row
  - Lunge
- Shared pose utilities:
  - Angle calculations
  - Joint position extraction
  - Angle smoothing
  - Rep boundary detection
  - Stability calculation
- Form thresholds configuration
- Accuracy documentation
- Kalman filtering for pose smoothing

### Changed
- Refactored pose detection to use shared utilities
- Moved hard-coded thresholds to config file
- Improved angle calculation accuracy
- Enhanced rep counting algorithm
- Updated form scoring system

### Fixed
- Jitter in angle calculations
- False positive rep detection
- Stability calculation normalization
- Joint visibility validation

## [1.0.0] - 2024-03-18

### Added
- Initial pose detection implementation
- Basic exercise analyzers:
  - Squat
  - Deadlift
- Simple form scoring
- Basic rep counting
- Initial stability calculation

### Known Issues
- Angle calculation jitter
- Hard-coded thresholds
- Limited exercise support
- Basic rep detection
- No pose smoothing 