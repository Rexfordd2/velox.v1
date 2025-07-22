# MVP Roadmap

## Kanban Board

| Back-log | In-Progress | Done |
|----------|-------------|------|
| **Velocity Tracking** | | |
| Camera calibration for accurate velocity measurements<br>- [ ] Implement calibration UI<br>- [ ] Add distance reference markers<br>- [ ] Calculate pixel-to-distance ratio<br>*File: `ai/services/pose_detector.py`* | | |
| Validation system for velocity measurements<br>- [ ] Add confidence scoring<br>- [ ] Implement outlier detection<br>- [ ] Add error bounds<br>*File: `packages/ai-analysis/src/utils/velocity.ts`* | | |
| **Form Analysis** | | |
| Progressive form tracking<br>- [ ] Add user progress history<br>- [ ] Implement trend analysis<br>- [ ] Create improvement metrics<br>*File: TBD* | | |
| Custom exercise definitions<br>- [ ] Add exercise builder UI<br>- [ ] Create form criteria editor<br>- [ ] Implement validation system<br>*File: TBD* | | |
| | Improve accuracy at odd angles<br>- [x] Add multi-angle pose detection<br>- [ ] Implement pose normalization<br>- [x] Add confidence thresholds<br>*File: `ai/services/pose_detector.py`* | |
| **Music Sync** | | |
| Improve rep detection accuracy<br>- [ ] Enhance peak detection<br>- [ ] Add phase recognition<br>- [ ] Implement confidence scoring<br>*File: `packages/music-sync/src/bpmSync.ts`* | | |
| Variable tempo support<br>- [ ] Add tempo range detection<br>- [ ] Implement dynamic BPM tracking<br>- [ ] Add tempo transition handling<br>*File: `packages/music-sync/src/bpmSync.ts`* | | |
| Offline metronome functionality<br>- [ ] Add standalone metronome<br>- [ ] Implement haptic feedback<br>- [ ] Add visual indicators<br>*File: `src/hooks/useBpmSync.ts`* | | |
| Beat prediction upgrade<br>- [ ] Implement predictive algorithm<br>- [ ] Add look-ahead buffering<br>- [ ] Improve sync accuracy<br>*File: `packages/music-sync/src/bpmSync.ts`* | | |
| Rhythm scoring enhancements<br>- [ ] Add detailed scoring metrics<br>- [ ] Implement phase penalties<br>- [ ] Add combo system<br>*File: `packages/music-sync/src/bpmSync.ts`* | | |
| | | Expand exercise library<br>- [x] Add 5 new compound exercises<br>- [x] Create form criteria for each<br>- [x] Add validation tests<br>*File: `ai/services/exercises/*`* |
| | | Performance optimizations<br>- [x] Implement frame skipping<br>- [x] Add brightness detection<br>- [x] Optimize memory management<br>*File: `apps/mobile/src/hooks/usePoseDetector.ts`* |
| | | Enhance feedback system<br>- [x] Add real-time feedback<br>- [x] Implement progressive cues<br>- [x] Add severity levels<br>*File: `apps/mobile/src/utils/poseAnalyzer.ts`* |

## Recent Updates

1. **Core Analysis Improvements**
   - Implemented severity-based feedback system with centralized store
   - Added pose tracking status monitoring (OK, LOW_FPS, LOST_TRACKING, ERROR)
   - Enhanced frame processing with brightness detection and auto-enhancement
   - Optimized memory usage with intelligent tensor cleanup

2. **Form Analysis Enhancements**
   - Added context-aware feedback generation
   - Implemented progressive feedback based on movement phase
   - Enhanced stability tracking and error detection
   - Added detailed joint angle analysis

3. **Performance Optimizations**
   - Implemented target FPS-based frame skipping
   - Added frame brightness detection and enhancement
   - Improved memory management with automatic tensor cleanup
   - Added comprehensive pose tracking status monitoring

4. **Next Steps**
   - Begin camera calibration implementation for velocity tracking
   - Complete pose normalization for odd angles
   - Start work on rep detection accuracy improvements
   - Implement offline metronome functionality 