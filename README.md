# Problematic Pookies

The scrapbook keeps its existing HTML/CSS design and uses Vite to build and deploy it. Supabase Auth protects the private editor; Supabase Postgres stores memories, captions and media metadata; Supabase Storage holds public-view photos, videos and audio.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com/).
2. In **SQL Editor**, run [`supabase/migrations/202611260001_scrapbook.sql`](./supabase/migrations/202611260001_scrapbook.sql). This creates the tables, public read/admin-only write RLS policies, public-read `pookies-media` bucket and the original 16 timeline memories.
3. In **Authentication → Providers → Email**, enable email/password sign-in. Turn off public sign-ups after creating the administrator account.
4. In **Authentication → Users**, create the one admin user with an email and a strong password. Viewing the scrapbook does not require an account.
5. In **SQL Editor**, grant that user the editor claim. Replace the email with the exact admin email:

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"pookies_admin": true}'::jsonb
   where email = 'YOUR_ADMIN_EMAIL';
   ```

   Confirm the statement updated one row. Sign out and back in after changing the claim so the new claim is present in the session token.

## 2. Configure local development

Copy `.env.example` to `.env.local` and fill in these two values from **Supabase → Project Settings → API**:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use the project's **Project URL** and its **publishable key** (or legacy **anon/public key**). These are browser-visible public credentials; database and Storage RLS policies are what protect writes. **Never add the `service_role` secret key to this repository, `.env.local`, Vercel client variables, or browser code.**

Install and run:

```sh
npm install
npm run dev
```

Open the local Vite URL, select **Admin sign in**, and use the admin user's Supabase email/password. Visitors can open the same URL without signing in.

## 3. Upload and manage media

- Open a timeline date, then use **Add photos** or **Add video** while signed in as the admin. Photo selection accepts multiple files. Use **Replace photo/video** or **Remove** on an item to manage existing media.
- Edit the memory date, short date, title and caption in its scrapbook page. Use **Add a memory** to create another page, or **Delete this memory** to remove it and its media.
- Upload the edited anniversary video in the soundtrack section, the handwritten-letter image in the letter section, and playlist tracks using the title and description fields.
- Uploads go directly from the browser to the Supabase Storage bucket with visible transfer progress. After a successful upload, the corresponding storage path and public URL are saved in the database. Reloading or opening the deployed URL on another device fetches the same saved data.
- The bucket is intentionally **public-read** so the shared scrapbook can display permanent media without a visitor login. Anyone with a media URL can view/download it; only the authenticated admin claim can create, replace or delete objects and database records. Do not upload material that should remain private.

## 4. Deploy to Vercel

1. Import this project into Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project → Settings → Environment Variables** for Production and Preview. Use the same Supabase project for both, or set the appropriate project values per environment.
3. Deploy. `vercel.json` configures `npm install`, `npm run build`, and the `dist` output directory.
4. Share the deployed Vercel URL. No viewer login is needed.

Do not set or expose `SUPABASE_SERVICE_ROLE_KEY` or `service_role` as a Vercel `VITE_*` variable. The browser uses only the public key and the authenticated admin's session.

## 5. Verify the complete flow

With Supabase configured and an admin account provisioned:

1. Sign in, open a date, upload a photo, and wait for **saved to the shared scrapbook**.
2. In Supabase, confirm an object exists under **Storage → pookies-media → memories/** and a matching row exists in `public.memory_media`.
3. Refresh the browser. Confirm the photo, caption and timeline entry load from Supabase.
4. Open the public deployment in a signed-out/private browser or another device. Confirm the public photo/video URLs load without a login.
5. While signed out, verify there are no edit, upload or delete controls. Direct write attempts should be denied by RLS and Storage policies.

The remote upload/refresh/other-device steps cannot be completed until you create a Supabase project and provide its Project URL and publishable/anon key in local/Vercel environment settings. The site does not contain invented credentials or a frontend admin password.
