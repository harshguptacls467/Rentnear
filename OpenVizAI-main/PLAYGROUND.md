# Playground Setup Guide

The OpenVizAI playground is a full-stack demo application included in the repository. It lets you generate charts and dashboards from sample datasets using natural language prompts.

---

## Prerequisites

- **Node.js** >= 20.12.0
- **npm** >= 9.0.0 (or **pnpm** — the repo includes a pnpm workspace config)
- **PostgreSQL** — a running PostgreSQL instance (local or hosted)
- **LLM API key** — either of these works for chart intelligence:
  - **Gemini API key** (free)
  - **OpenAI API key**

---

## 1. Clone the Repository

```bash
git clone https://github.com/OpenVizAI/OpenVizAI
cd OpenVizAI
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Get an LLM API Key (Gemini or OpenAI)

Choose one provider:

### Option A: Gemini (free)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key — you'll need it in the next step

### Option B: OpenAI

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key — you'll need it in the next step

This is completely free and takes under a minute.

---

## 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

If `.env.example` doesn't exist, create `.env` manually with these values:

```env
# LLM Provider — set at least one key
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/openvizai

# JWT secret — any random string (used for demo session management)
JWT_SECRET=any-random-secret-string-here

# Server
PORT=3000
HOST=localhost
NODE_ENV=development
```

Replace `username`, `password`, and the database name with your PostgreSQL credentials.

The server will use OpenAI when `OPENAI_API_KEY` is set, otherwise it falls back to Gemini.

---

## 5. Set Up the Database

Make sure your PostgreSQL server is running, then push the schema:

```bash
npx prisma db push
```

This creates the required tables (`user`, `user_session`, `chat_history`) automatically. No manual SQL needed.

---

## 6. Start the Application

```bash
npm run dev
```

This starts both the backend server and the frontend dev server concurrently.

- **Backend:** `http://localhost:3000`
- **Frontend:** `http://localhost:5173` (Vite default)

---

## 7. Login

Open the frontend URL in your browser. You'll see a login screen.

**Enter any email address** (e.g., `demo@test.com`). The playground uses a simplified auth flow — it creates a user record automatically if one doesn't exist. This is used to associate your chart generation history with your session.

No password is required. No real email verification happens. This is purely for session tracking in the demo.

---

## 8. Generate Charts

Once logged in:

1. The playground includes **pre-loaded example datasets** (workforce operations, sales data, etc.) — select one or paste your own JSON data.
2. Write a prompt describing the visualization you want, or use the default prompt.
3. Click **Generate**.

OpenVizAI will:

- Sample your dataset
- Call the LLM to determine the best chart configuration
- Render an interactive ApexChart

Try different prompts on the same dataset to see how the chart type changes based on intent.

---

## Troubleshooting

| Issue                             | Solution                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` connection refused | Ensure PostgreSQL is running and the connection string is correct                                                       |
| LLM API key errors                | Verify `OPENAI_API_KEY` (OpenAI dashboard) or `GEMINI_API_KEY` ([Google AI Studio](https://aistudio.google.com/apikey)) |
| Port conflicts                    | Change `PORT` in `.env` or the Vite port in `apps/web/vite.config.ts`                                                   |
| Prisma schema drift               | Run `npx prisma db push` again to sync                                                                                  |
| Login not working                 | Any email format works — no verification required                                                                       |
