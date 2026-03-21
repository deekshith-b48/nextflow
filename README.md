# NextFlow — AI Workflow Builder

A pixel-perfect Krea.ai workflow builder clone for LLM workflows, built with Next.js 14, React Flow, Clerk, Trigger.dev, and Google Gemini.

## Tech Stack

| Category | Tool |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Auth | Clerk |
| Database | PostgreSQL (Neon) + Prisma |
| Canvas | React Flow |
| State | Zustand + Zundo (undo/redo) |
| Execution | Trigger.dev (all node execution) |
| File Upload | Transloadit |
| LLM | Google Gemini API |
| Media Processing | Transloadit (FFmpeg) |
| Validation | Zod |
| Styling | Tailwind CSS |
| Deploy | Vercel |

---

## 🚀 Setup Guide

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd nextflow
npm install
```

### 2. Create accounts and get API keys

#### Clerk (Authentication)
1. Go to [clerk.com](https://clerk.com) → Create new application
2. Choose "Email" and "Google" sign-in options
3. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the dashboard

#### Google AI Studio (Gemini API)
1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key as `GOOGLE_AI_API_KEY`

#### Neon (PostgreSQL)
1. Go to [neon.tech](https://neon.tech) → Create project
2. Copy the connection string as `DATABASE_URL`
   - Format: `postgresql://user:pass@host/dbname?sslmode=require`

#### Trigger.dev
1. Go to [trigger.dev](https://trigger.dev) → Create project
2. Note your **Project ID** (update `trigger.config.ts`)
3. Copy `TRIGGER_API_KEY` from Settings → API Keys
4. Copy `NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY` (the public key)

#### Transloadit (File uploads + media processing)
1. Go to [transloadit.com](https://transloadit.com) → Sign up
2. Copy `NEXT_PUBLIC_TRANSLOADIT_KEY` and `TRANSLOADIT_SECRET` from Settings
3. Create two Templates:
   - **Image template**: robot `/transloadit/store` with S3/CDN storage
   - **Video template**: robot `/transloadit/store` with S3/CDN storage
4. Copy template IDs as `NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID_IMAGE` and `NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID_VIDEO`

> **Note**: For development/demo, you can skip Transloadit setup. File uploads will use browser object URLs as fallback — uploads won't persist but previews will work.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`.

### 4. Set up database

```bash
npx prisma db push      # Create tables in Neon
npx prisma generate     # Generate Prisma client
```

### 5. Configure Trigger.dev

Update `trigger.config.ts` with your project ID:

```ts
project: "proj_your_actual_project_id",
```

Deploy Trigger.dev tasks:
```bash
npx trigger.dev@latest deploy
```

Or run in dev mode alongside Next.js:
```bash
# Terminal 1
npx trigger.dev@latest dev

# Terminal 2  
npm run dev
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Sign-in / sign-up pages
│   ├── api/
│   │   ├── workflows/       # CRUD + sample seeder
│   │   ├── execute/         # Workflow/node execution
│   │   └── history/         # Run history
│   ├── workflow/[id]/       # Main editor page
│   └── page.tsx             # Redirect to latest workflow
├── components/
│   ├── nodes/               # 6 node components
│   │   ├── BaseNode.tsx
│   │   ├── TextNode.tsx
│   │   ├── UploadImageNode.tsx
│   │   ├── UploadVideoNode.tsx
│   │   ├── LLMNode.tsx
│   │   ├── CropImageNode.tsx
│   │   └── ExtractFrameNode.tsx
│   ├── canvas/
│   │   ├── FlowCanvas.tsx   # React Flow canvas
│   │   └── WorkflowEditor.tsx
│   ├── sidebar/
│   │   ├── LeftSidebar.tsx  # Node palette
│   │   └── RightSidebar.tsx # History panel
│   └── layout/
│       └── TopBar.tsx       # Navbar with save/run
├── lib/
│   ├── dag.ts               # Topological sort, cycle detection
│   ├── prisma.ts            # DB client
│   ├── sample-workflow.ts   # Pre-built sample workflow
│   └── utils.ts
├── store/
│   └── workflow-store.ts    # Zustand + zundo (undo/redo)
├── trigger/
│   └── tasks.ts             # Trigger.dev tasks (LLM, crop, extract)
├── types/
│   └── index.ts             # All TypeScript types
└── middleware.ts            # Clerk auth protection
prisma/
└── schema.prisma            # DB schema
trigger.config.ts            # Trigger.dev config
```

---

## 🎯 Node Types

| Node | Description | Inputs | Output |
|---|---|---|---|
| **Text** | Static text value | — | `text` |
| **Upload Image** | Upload via Transloadit | file | `image_url` |
| **Upload Video** | Upload via Transloadit | file | `video_url` |
| **Run LLM** | Google Gemini | `system_prompt`, `user_message`, `images` | `text` |
| **Crop Image** | FFmpeg via Transloadit | `image_url`, `x%`, `y%`, `w%`, `h%` | `image_url` |
| **Extract Frame** | FFmpeg via Transloadit | `video_url`, `timestamp` | `image_url` |

---

## 🔗 Type-Safe Connections

The connection system enforces data type compatibility:
- ✅ Image → `images` handle (LLM node)
- ✅ Image → `image_url` handle (Crop node)
- ✅ Video → `video_url` handle (Extract Frame node)
- ✅ Text → `system_prompt` / `user_message` (LLM node)
- ❌ Image → text handles (blocked)
- ❌ Video → image handles (blocked)
- ❌ Text → image handles (blocked)

---

## 🌐 Deploying to Vercel

1. Push your repo to GitHub (make it private)
2. Import in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

Add Vercel URL to Clerk's allowed origins in the Clerk dashboard.

---

## 📦 Pre-built Sample Workflow

Load the **Product Marketing Kit Generator** via the API:

```bash
curl -X POST http://localhost:3000/api/workflows/sample \
  -H "Authorization: Bearer <clerk-token>"
```

Or navigate to it from the app — the home page creates it automatically on first login.

The sample demonstrates:
- All 6 node types
- Parallel branch execution (Branch A + Branch B simultaneously)
- Multi-image input to final LLM (convergence point)
- Input chaining across the full graph

---

## 🛠️ Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push schema to DB
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio
npx trigger.dev@latest dev   # Run Trigger.dev in dev mode
npx trigger.dev@latest deploy # Deploy tasks to cloud
```
