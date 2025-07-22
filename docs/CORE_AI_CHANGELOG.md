## v0.6 - DB & API

### Added
- Supabase integration with auth, storage, and database
- Database schema with tables: profiles, exercises, sessions, reps
- Materialized view for progress tracking
- Row Level Security (RLS) policies
- API routes for sessions and progress
- Exercise seeding script
- Database documentation with ER diagram

### Changed
- Moved from mock data to real persistence
- Updated session store to use real API endpoints
- Enhanced profile page with real session history

### Fixed
- Type safety improvements with Supabase type generation
- Security hardening with RLS policies
- Performance optimization with materialized views

### TODO
- [ ] Add more comprehensive error handling
- [ ] Implement session deletion
- [ ] Add progress visualization
- [ ] Enhance rep analysis with more metrics 