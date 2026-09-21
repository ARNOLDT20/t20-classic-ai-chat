# T20-CLASSIC AI

Multilingual AI chat with image generation, music generation, code help, and Supabase-backed edge functions.

## Run locally

Requirements: Node.js 20+ and Bun.

```bash
bun install
copy .env.example .env
bun run dev
```

Open the URL printed by Vite, normally `http://localhost:8080`.

The local `.env` file must define:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
# NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are also supported.
```

These are browser-facing Supabase settings. Never put a Supabase service-role key in this app.

## Validate and build

```bash
bun run lint
bun run build
bun run preview
```

## Supabase

The frontend calls the edge functions in `supabase/functions`. Install the Supabase CLI, log in, and connect this folder to your project:

```bash
supabase login
supabase link --project-ref mqudqfsvnvlcptsgdceo
supabase db push
```

Configure the server-side secrets before deploying the functions:

```bash
supabase secrets set GROQ_API_KEY=your-groq-free-key
supabase secrets set GROQ_MODEL=openai/gpt-oss-20b
supabase secrets set ELEVENLABS_API_KEY=your-elevenlabs-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set SMM_ASSISTANT_API_KEY=your-smm-api-key
```

The service-role and API keys are only used by Supabase Edge Functions. Do not add them to `.env` or expose them in the browser.

Deploy all functions after setting the secrets:

```bash
supabase functions deploy chat
supabase functions deploy generate-image
supabase functions deploy generate-music
supabase functions deploy song-search
supabase functions deploy ping
supabase functions deploy smm-assistant
supabase functions deploy whatsapp-chat
```

Test the backend before opening the frontend:

```bash
curl -i https://mqudqfsvnvlcptsgdceo.supabase.co/functions/v1/ping -H "apikey: YOUR_PUBLISHABLE_KEY"
```

The response should be successful. Then run `bun run dev`, open the local Vite URL, and test chat, image generation, music generation, and song search separately.

## Deploy

### Render one-click deployment

This repository includes `render.yaml`. In Render, choose **New > Blueprint**, connect this repository, and deploy. Render will build and host the frontend as a static site. Enter these Blueprint environment variables when prompted:

```text
VITE_SUPABASE_URL=https://mqudqfsvnvlcptsgdceo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

The frontend remains connected to Supabase for authentication, database access, and Edge Functions. Render does not run Supabase Edge Functions itself.

### Deploy all backend functions

Install the Supabase CLI and authenticate once:

```bash
npx supabase login
```

Then run this from the repository root:

```bash
npm run deploy:functions
```

The script links the project, applies migrations, and deploys `chat`, `generate-image`, `generate-music`, `song-search`, `ping`, `smm-assistant`, and `whatsapp-chat`. Set the server-side secrets before running it:

```bash
npx supabase secrets set GROQ_API_KEY=your-groq-free-key
npx supabase secrets set GROQ_MODEL=openai/gpt-oss-20b
npx supabase secrets set ELEVENLABS_API_KEY=your-elevenlabs-key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npx supabase secrets set SMM_ASSISTANT_API_KEY=your-smm-api-key
```

For a one-click backend deployment from GitHub, add `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` as repository Actions secrets, then open **Actions > Deploy Supabase backend > Run workflow**. The workflow in `.github/workflows/deploy-supabase.yml` applies migrations and deploys every function. Configure the runtime secrets in Supabase once; the workflow never stores them in the repository.

For manual static hosting, build with `npm run build` and publish `dist`. Configure the same two `VITE_` variables on the host.
