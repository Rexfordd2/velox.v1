# Environment Setup

To run the Velox frontend application, you need to set up your environment variables.

## Required Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Backend URL (optional - defaults to http://localhost:8000)
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000

# For seeding script (admin access)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Getting Your Supabase Credentials

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Running the AI Backend

The AI backend provides pose analysis for recorded exercises. To use this feature:

1. Navigate to the `ai` directory
2. Follow the setup instructions in `ai/README.md`
3. The backend will run on `http://localhost:8000` by default

If you're running the AI backend on a different URL or port, update `NEXT_PUBLIC_AI_BACKEND_URL` accordingly.

## Running the Seed Script

After setting up your environment variables, you can seed the database with sample exercises:

```bash
cd frontend
npm run seed:exercises
```

This will add 8 sample exercises to your database. 