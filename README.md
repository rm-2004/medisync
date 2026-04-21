# MediSync

**AI-Assisted Medication & Symptom Tracker**

A full-stack health management web app for patients — especially elderly users — to track medications, log symptoms, set reminders, share with caretakers, generate AI health reports, and chat with a context-aware AI health consultant powered by **Groq (LLaMA 3.3 70B)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router DOM v6 |
| Charts | Recharts |
| Backend | Node.js + Express 4 |
| Database | MongoDB + Mongoose |
| AI | Groq SDK — `llama-3.3-70b-versatile` |
| Frontend Deploy | Vercel |
| Backend Deploy | Render / Railway |

---

## Features

- **Dashboard** — stats overview, today's dose schedule, 7-day adherence chart, AI insights
- **Medications** — add/edit/delete medications, mark doses as taken, colour tagging
- **Symptoms** — log symptoms with severity (1–10), tags, notes; full history view
- **Reminders** — time-based reminders per medication, enable/disable toggle
- **Caretakers** — add family/doctors, shareable patient link for read-only access
- **Reports** — date-range health reports with AI-written plain-English summary, print/PDF
- **AI Consultant** — conversational health chat that reads your actual medications and recent symptoms from the database before responding

---

## Project Structure

```
medisync/
├── backend/
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Medication.js
│   │   ├── MedicationLog.js
│   │   ├── SymptomLog.js
│   │   ├── Reminder.js
│   │   └── Caretaker.js
│   ├── routes/
│   │   ├── consult.js        ← AI chat (Groq, context-aware)
│   │   ├── reports.js        ← Report generation + AI summary
│   │   ├── dashboard.js
│   │   ├── medications.js
│   │   ├── symptoms.js
│   │   ├── reminders.js
│   │   ├── caretakers.js
│   │   └── users.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/Layout.jsx
│   │   ├── context/api.js
│   │   ├── pages/
│   │   │   ├── Consult.jsx   ← AI chat UI
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Medications.jsx
│   │   │   ├── Reminders.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Symptoms.jsx
│   │   │   └── Caretakers.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
└── .gitignore
```

---

## Local Setup

### 1. Get a Free Groq API Key
Go to [console.groq.com](https://console.groq.com) → API Keys → Create key.

### 2. Get a Free MongoDB URI
Go to [cloud.mongodb.com](https://cloud.mongodb.com), create a free cluster, and copy the connection string.

### 3. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/medisync
GROQ_API_KEY=gsk_your_key_here
FRONTEND_URL=http://localhost:5173
```

```bash
npm install
npm run dev
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

```bash
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## Deployment

### Backend → Render / Railway

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm install` |
| Start command | `node server.js` |
| `MONGO_URI` | MongoDB Atlas URI |
| `GROQ_API_KEY` | Your Groq key |
| `FRONTEND_URL` | Your Vercel URL |

### Frontend → Vercel

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework preset | Vite |
| `VITE_API_URL` | Your Render/Railway backend URL |

The `frontend/vercel.json` handles React Router deep links automatically.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/users/register` | Register patient |
| POST | `/api/users/login` | Login by Unique ID |
| GET | `/api/medications` | List medications |
| POST | `/api/medications` | Add medication |
| PUT | `/api/medications/:id` | Update medication |
| DELETE | `/api/medications/:id` | Delete medication |
| POST | `/api/medications/log` | Log dose taken |
| GET | `/api/medications/logs/today` | Today's logs |
| GET | `/api/symptoms` | List symptoms |
| POST | `/api/symptoms` | Log symptom |
| DELETE | `/api/symptoms/:id` | Delete symptom |
| GET | `/api/reminders` | List reminders |
| POST | `/api/reminders` | Create reminder |
| PUT | `/api/reminders/:id` | Update reminder |
| DELETE | `/api/reminders/:id` | Delete reminder |
| GET | `/api/caretakers` | List caretakers |
| POST | `/api/caretakers` | Add caretaker |
| PUT | `/api/caretakers/:id` | Update caretaker |
| DELETE | `/api/caretakers/:id` | Remove caretaker |
| POST | `/api/reports/generate` | Generate health report |
| POST | `/api/reports/ai-summary` | Quick AI summary |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/dashboard/ai-insights` | AI insights |
| POST | `/api/consult/chat` | AI health consultant chat |
| GET | `/api/health` | Health check |

---

## AI Consultant — How It Works

The `/api/consult/chat` endpoint fetches the patient's live data from MongoDB before every Groq call and injects it into the system prompt:

- Active medications (name, dosage, frequency, times, notes)
- Symptoms logged in the last 7 days (name, severity, date)
- Doses taken today

This lets the AI give personalised responses — referencing actual medications when asked about food, or acknowledging previously logged symptoms — without the patient having to re-explain their situation.

Chat history persists in MongoDB so conversations survive page refresh and are available on any device when logging in with the same Unique Patient ID.

---

## Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=
GROQ_API_KEY=
FRONTEND_URL=
```

### Frontend `.env`
```env
VITE_API_URL=
```

---

## Notes

- The app uses `X-User-Id` header auth (MongoDB `_id`). Suitable for personal/prototype use. For production, replace with JWT.
- `GROQ_API_KEY` is backend-only — never sent to the browser.
- If `GROQ_API_KEY` is not set, AI features return a friendly fallback message; the rest of the app works normally.
- AI model: `llama-3.3-70b-versatile` — update in `routes/consult.js` and `routes/reports.js` if Groq deprecates it.