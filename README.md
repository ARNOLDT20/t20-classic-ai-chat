# T20-CLASSIC AI

T20-CLASSIC AI is a React/Vite chat application backed by Supabase Auth, Postgres, Realtime, and Edge Functions. AI chat, image generation, and voice transcription run through Supabase Edge Functions so provider credentials are kept server-side.

## Local development

```sh
npm install
cp .env.example .env
# Set the supplied Supabase URL, project ref, and publishable key in .env.
npm run dev
```

The production build is created with:

```sh
npm run build
```

## Supabase setup

Link the supplied project, configure the Edge Function secrets, apply the database migrations, and deploy the functions:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY
supabase secrets set PERPLEXITY_API_KEY=YOUR_PERPLEXITY_KEY
supabase db push
supabase functions deploy chat
supabase functions deploy generate-image
supabase functions deploy voice-to-text
```

`OPENAI_API_KEY` is required. `PERPLEXITY_API_KEY` is optional and enables current-information search context. See [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for the full migration and secret configuration details.

## Project structure

- `src/`: React application and Supabase client integration
- `supabase/migrations/`: database schema and security policies
- `supabase/functions/chat/`: streaming chat, vision, search context, and image requests
- `supabase/functions/generate-image/`: direct image generation endpoint
- `supabase/functions/voice-to-text/`: audio transcription endpoint
