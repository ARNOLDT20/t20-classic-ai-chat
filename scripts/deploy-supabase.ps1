$ErrorActionPreference = "Stop"

$projectRef = if ($env:SUPABASE_PROJECT_REF) { $env:SUPABASE_PROJECT_REF } else { "xijuhyfftapgtseumgmr" }

Write-Host "Linking Supabase project $projectRef..."
npx supabase link --project-ref $projectRef

Write-Host "Applying database migrations..."
npx supabase db push

$functions = @(
  "chat",
  "generate-image",
  "generate-music",
  "song-search",
  "ping",
  "smm-assistant",
  "whatsapp-chat"
)

foreach ($function in $functions) {
  Write-Host "Deploying $function..."
  npx supabase functions deploy $function --project-ref $projectRef
}

Write-Host "All Supabase functions and migrations are deployed."