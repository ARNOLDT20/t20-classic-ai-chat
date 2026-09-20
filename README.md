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
supabase link --project-ref arimuqnlsqzunbqovakc
supabase db push
```

Configure the server-side secrets before deploying the functions:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-key
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
curl -i https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/ping -H "apikey: YOUR_PUBLISHABLE_KEY"
```

The response should be successful. Then run `bun run dev`, open the local Vite URL, and test chat, image generation, music generation, and song search separately.

## Deploy

Build with `bun run build` and publish the generated `dist` directory on any static host such as Cloudflare Pages, Netlify, Vercel, or an ordinary web server. Configure the two `VITE_` variables in that host's build environment, then redeploy.
