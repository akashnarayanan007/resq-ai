# RESQ.AI — AI-Assisted Disaster Incident Coordination Platform

> **EMERGENCY OPERATIONS HACKATHON DEMO PLATFORM**  
> **DISCLAIMER:** This application is a technology demonstration built with synthetic simulation data. It is **NOT** connected to live 112 emergency services or government response systems. In an actual disaster in India, dial **112 (National Emergency)**, **108 (Ambulance)**, or **1913 (GCC Disaster Helpline)**.

---

## 🌟 Overview & Architecture

**RESQ.AI** is a disaster incident management platform tailored for extreme climate and urban flood scenarios, modeled after the Greater Chennai Metropolitan Area (Velachery, Madipakkam, Tambaram, Saidapet, Adyar, Sholinganallur, Pallikaranai, and Mylapore).

```
[ Citizen SOS Intake ] ── (English / Tamil / Hindi text + Speech + Vision)
           │
           ▼
[ Next.js Server Route ] ── Zod Validation & Unguessable Token Generation
           │
   ┌───────┴───────────────────────┐
   ▼                               ▼
[ Gemini AI Triage ]     [ Deterministic Fallback ]
(Live 3.8/3.5 Flash)      (Emergency Multi-lingual Engine)
   │                               │
   └───────┬───────────────────────┘
           ▼
[ Repository Abstraction Layer ] ──> Firestore (Admin SDK) OR Local Demo Storage
           │
           ▼
[ Tactical Operations Command ] ── (Leaflet GIS, Haversine Recommendation, Double-Dispatch Guard)
           │
           ▼
[ Incident Lifecycle ] ── Pending ➔ Under Review ➔ Assigned ➔ In Progress ➔ Resolved
```

### Key Technical Pillars
1. **Next.js 14 App Router & TypeScript**: Server-side API isolation, dynamic SSR-safe Leaflet mapping, strictly typed schemas via Zod.
2. **Resilient Repository Pattern**: Transparently switches between server-side Firebase Admin Firestore and browser `localStorage`. Works 100% credential-free out of the box in Local Demo Mode.
3. **Multi-lingual AI Triage**: Analyzes English, Tamil (தமிழ்), and Hindi (हिन्दी) distress text, extracting life-safety hazards, vulnerabilities, and structured English translations.
4. **Deterministic Emergency Fallback**: Guarantees zero outage even if the Gemini API is rate-limited, unreachable, or unconfigured.
5. **Human-in-the-Loop Dispatch**: AI assists with analysis and rank-orders units using straight-line distance; human coordinators must confirm assignments.
6. **Double-Assignment Prevention & Auto-Release**: Units are locked to one active mission and automatically returned to `available` upon incident resolution.
7. **Privacy-Safe Tracking**: Public tracking requires an unguessable token (`trk_...`) and strips personal phone numbers, names, and exact door addresses.
8. **Server-Side Session Authentication**: Coordinator routes protected by HMAC SHA-256 signed session cookies (Demo Passcode: `RESQ-CHENNAI-2024`).

---

## 🚀 Key Routes

| Route | Purpose | Key Features |
| :--- | :--- | :--- |
| **`/`** | Landing Page | Scenario overview, crisis status feed, helpline shortcuts, and entry points. |
| **`/sos`** | Citizen SOS Intake | Mobile-first (375px+), English/Tamil/Hindi UI switcher, speech dictation, visual hazard upload, instant triage preview, and track status portal. |
| **`/dashboard`** | Tactical Command | Leaflet GIS map with pulsing urgency markers, Needs-Location queue for reports lacking coordinates, and unit assignment modal. |
| **`/dashboard/incidents`** | Incident Matrix | Table and Kanban views, urgency filters, audit milestone timelines, and invalid-report closure with required reason. |
| **`/dashboard/teams`** | Responder Roster | Live status of 5 simulated units (Boat, Paramedic, High-Water, Heavy Clearance, Drone Recon), VHF channels, and deployment states. |
| **`/dashboard/analytics`** | Operations Analytics | Recharts charts: hourly incident influx, status breakdown, urgency distribution, and coordinator-confirmed Demo Reset. |

---

## 🛠️ Setup & Local Execution

### Prerequisites
- Node.js `v18.x`, `v20.x`, or `v24.x`
- npm `v9.x` or `v10.x`

### 1. Installation
```bash
git clone <repo-url>
cd <repo-dir>
npm install
```

### 2. Environment Variables Configuration (Optional)
Create `.env.local` in project root:
```env
# Server-only Gemini API Key (optional — automatic fallback engine activates if omitted)
GEMINI_API_KEY="your-gemini-api-key"

# Coordinator Authentication (optional — defaults to RESQ-CHENNAI-2024)
COORDINATOR_PASSCODE="RESQ-CHENNAI-2024"
DEMO_ADMIN_SECRET="your-hmac-sha256-signing-secret"

# Firebase Admin Firestore (optional — falls back to Local Demo Mode if omitted)
FIREBASE_PROJECT_ID="resqai-ff9b3"
FIREBASE_CLIENT_EMAIL="your-service-account@resqai-ff9b3.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Demo Mode Indicator
DEMO_MODE=true
```

### 3. Verification & Test Suite
```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Run E2E Smoke Test Suite (40/40 tests)
npx tsx src/tests/e2eSmokeTest.ts

# Run Live HTTP Server Smoke Test (7/7 tests)
npx tsx src/tests/liveEndpointsSmokeTest.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🤖 AI Triage & Safety Rules

1. **Strict Zero-Fabrication Policy**: If victim count or location is unstated, the model returns `null` and adds the item to `missingInformation`. It never guesses street addresses.
2. **Missing Coordinates Separation**: Incidents without geographic coordinates are routed to a **Needs-Location Queue**; synthetic coordinates are never invented on the map.
3. **Straight-Line Distance Indicator**: Asset ranking uses Haversine straight-line distance, explicitly disclaiming road travel times due to flood blockage.
4. **Unverified Visual Screening**: Uploaded photos are labeled as `UNVERIFIED VISUAL AI OBSERVATION` to prevent automated false dispatch.

---

## 🌐 Deploying to Vercel

### Step 1: Install & Authenticate Vercel CLI
```bash
npm install -g vercel
vercel login
```

### Step 2: Link Project & Configure Environment Variables
In the Vercel Dashboard or CLI (`vercel env add`):
- `GEMINI_API_KEY`: Server-side Gemini API key.
- `COORDINATOR_PASSCODE`: `RESQ-CHENNAI-2024` (or custom passcode).
- `DEMO_ADMIN_SECRET`: Random 32+ character HMAC secret string.
- `FIREBASE_PROJECT_ID`: (Optional) Firebase project ID.
- `FIREBASE_CLIENT_EMAIL`: (Optional) Service account email.
- `FIREBASE_PRIVATE_KEY`: (Optional) Private key string with `\n` linebreaks.
- `DEMO_MODE`: `true`

### Step 3: Deploy
```bash
vercel --prod
```

---

## 📋 Limitations & Notes
- **Browser Speech Recognition**: Voice dictation uses the standard Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). In unsupported browsers, an informational notice is displayed and text input remains 100% accessible.
- **Simulated Response Units**: All responders, callsigns, VHF radio frequencies, and incident locations are synthetic constructs for training and hackathon demonstration purposes.
