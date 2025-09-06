param(
  [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
  [string]$ServiceRole = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$AdminEmail = $(If ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } Else { 'admin@example.com' }),
  [string]$AdminPassword = $(If ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } Else { 'Admin123!' })
)

if (-not $SupabaseUrl -or -not $ServiceRole) {
  Write-Host "Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)" -ForegroundColor Red
  exit 1
}

Write-Host "Seeding database..."
$env:RUN_DB_SEED = 'true'
$env:NODE_ENV = 'test'
$env:ALLOW_PROD_SEED = 'true'
$env:ADMIN_EMAIL = $AdminEmail
$env:ADMIN_PASSWORD = $AdminPassword
pnpm -w seed

Write-Host "Running Playwright E2E..."
pnpm -w spec:install
pnpm -w spec:e2e


