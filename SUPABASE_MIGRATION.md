# Lovable to Supabase AI migration

The application already uses Supabase for authentication, database persistence, realtime updates, and Edge Function routing. The Lovable dependency was limited to the AI provider gateway used by the `chat` and `generate-image` Edge Functions. Those calls now go directly from Supabase Edge Functions to OpenAI, so provider keys remain server-side and the browser-facing behavior is unchanged.

## Preserved contracts

| Function | Browser contract | Status |
|---|---|---|
| `chat` | `POST /functions/v1/chat` with `{ messages }`; streamed OpenAI-compatible SSE deltas | Preserved |
| `generate-image` | `POST /functions/v1/generate-image` with `{ prompt }`; returns `{ imageUrl, text }` | Preserved |
| `voice-to-text` | `supabase.functions.invoke("voice-to-text", { body: { audio } })`; returns `{ text }` | Preserved |
| Auth, conversations, messages, realtime | Existing Supabase client and SQL schema | Unchanged |

## Configure the supplied Supabase project

1. In the local `.env`, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, and `VITE_SUPABASE_PUBLISHABLE_KEY` to the supplied project values. Use `.env.example` as the template.
2. Log in to the Supabase CLI and link this project:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Store provider secrets in Supabase, never in the browser bundle:

   ```sh
   supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY
   # Optional web search support:
   supabase secrets set PERPLEXITY_API_KEY=YOUR_PERPLEXITY_KEY
   # Optional overrides:
   supabase secrets set OPENAI_CHAT_MODEL=gpt-4o-mini
   supabase secrets set OPENAI_IMAGE_MODEL=gpt-image-1
   supabase secrets set OPENAI_IMAGE_QUALITY=auto
   ```

   `OPENAI_API_KEY` is required by chat, image generation, and voice transcription. `PERPLEXITY_API_KEY` is optional; without it, normal chat still works and search-intent messages simply do not receive external search context.

4. Apply the existing database migrations and deploy the Edge Functions:

   ```sh
   supabase db push
   supabase functions deploy chat
   supabase functions deploy generate-image
   supabase functions deploy voice-to-text
   ```

5. Build the frontend with the supplied project's public values and deploy it through the hosting platform of choice:

   ```sh
   npm install
   npm run build
   ```

## Notes

The frontend still calls the same Supabase function URLs and still parses the same SSE shape, including generated images rendered as Markdown. No Lovable API key is required by the migrated functions. Any old `LOVABLE_API_KEY` secret can be removed from the Supabase project after the new functions are deployed and tested.
