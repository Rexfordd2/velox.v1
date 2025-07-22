# Deployment Guide

## One-Click Deployment

1. Install the Fly.io CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to Fly.io:
   ```bash
   flyctl auth login
   ```

3. Launch the app:
   ```bash
   flyctl launch
   ```

4. Set required secrets:
   ```bash
   flyctl secrets set SUPABASE_URL="your-supabase-url"
   flyctl secrets set SUPABASE_ANON_KEY="your-supabase-anon-key"
   flyctl secrets set SUPABASE_SERVICE_KEY="your-supabase-service-key"
   ```

## Manual Deployment

1. Build the Docker image:
   ```bash
   docker build -t velox .
   ```

2. Deploy to Fly.io:
   ```bash
   flyctl deploy
   ```

## Rollback

To rollback to a previous version:

1. List available images:
   ```bash
   flyctl image list
   ```

2. Deploy specific image:
   ```bash
   flyctl deploy --image <image-id>
   ```

## Local Development

1. Start the development environment:
   ```bash
   docker-compose up
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Supabase: http://localhost:54321

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Supabase service role key

## Monitoring

1. View logs:
   ```bash
   flyctl logs
   ```

2. Monitor metrics:
   ```bash
   flyctl status
   ```

## Troubleshooting

1. Check application status:
   ```bash
   flyctl status
   ```

2. View detailed logs:
   ```bash
   flyctl logs --instance <instance-id>
   ```

3. SSH into instance:
   ```bash
   flyctl ssh console
   ``` 