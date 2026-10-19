# Cloud Deployment Guide (Vercel + Render + Supabase)

## 1. Prerequisites

- Free account on [Supabase](https://supabase.com)
- Free account on [Render](https://render.com)
- Free account on [Vercel](https://vercel.com)
- Free account on [PostHog](https://posthog.com)

---

## 2. Step 1: Database & Supabase Auth Setup

1. Create a new project in the Supabase Dashboard: `careergps-prod`.
2. Navigate to **Project Settings** $\rightarrow$ **API**:
   - Note `Project URL` (e.g. `https://yourproject.supabase.co`)
   - Note `anon public` key
3. Navigate to **Project Settings** $\rightarrow$ **API** $\rightarrow$ **JWT Settings**:
   - Copy the `JWT Secret`.
4. In Supabase **Authentication** $\rightarrow$ **URL Configuration**:
   - Add your production Vercel URL to **Site URL** and **Redirect URLs** (e.g. `https://careergps.vercel.app/dashboard`).

---

## 3. Step 2: Backend API Deployment (Render)

1. Connect your GitHub repository to [Render](https://dashboard.render.com/).
2. Select **New** $\rightarrow$ **Blueprint** and point to `render.yaml`, or create a **Web Service**:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r apps/api/requirements.txt && pip install pyjwt cryptography posthog`
   - **Start Command**: `cd apps/api && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
3. Configure Environment Variables in Render:
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` (from Supabase Database connection string or Render Postgres)
   - `SUPABASE_JWT_SECRET`: `[Your Supabase JWT Secret]`
   - `ADMIN_API_KEY`: `[Your Secure Secret Admin Key]`
   - `BACKEND_CORS_ORIGINS`: `https://careergps.vercel.app,http://localhost:3000`
4. Once deployed, verify your public API:
   - `https://your-api-name.onrender.com/health` returns `{"status":"healthy"}`.

---

## 4. Step 3: Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-api-name.onrender.com/api`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://yourproject.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `[Your Supabase Anon Key]`
   - `NEXT_PUBLIC_POSTHOG_KEY`: `[Your PostHog API Key]`
   - `NEXT_PUBLIC_POSTHOG_HOST`: `https://app.posthog.com`
4. Trigger Deploy. Vercel will run `npm run build` and provision edge CDN endpoints.

---

## 5. Step 4: Verification Checklist

- [ ] Visit `https://careergps.vercel.app`
- [ ] Sign up with an email address on `/signup`
- [ ] Generate an adaptive career roadmap on `/`
- [ ] Click **Save to My Roadmaps** and verify persistence in `/dashboard`
- [ ] Check off a learning task on `/my-roadmaps/[id]` and verify progress persists across page reloads
- [ ] Log out and verify route protection on `/dashboard` and `/profile`
