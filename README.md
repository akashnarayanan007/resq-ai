# RESQ.AI — Every Second Matters 🚨
### AI-Assisted Multilingual Disaster Intake & Tactical Rescue Coordination Platform

[![Live Production](https://img.shields.io/badge/Production%20Deployment-resq--ai--sigma.vercel.app-00D9FF?style=for-the-badge&logo=vercel&logoColor=white)](https://resq-ai-sigma.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Multilingual%20Triage-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase Firestore](https://img.shields.io/badge/Firebase-Firestore%20Admin-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Leaflet GIS](https://img.shields.io/badge/GIS%20Mapping-Leaflet%20OSM-19E6A0?style=for-the-badge&logo=leaflet&logoColor=black)](https://leafletjs.com/)

---

> [!IMPORTANT]
> **EMERGENCY PLATFORM DISCLAIMER & SYNTHETIC DATA DISCLOSURE**  
> **RESQ.AI** is a technology demonstration and hackathon prototype built using synthetic disaster simulation data. It is **NOT** connected to live 112/911 public emergency services or real-world municipal first responders. In an actual disaster in India, immediately dial **112 (National Emergency)**, **108 (Ambulance)**, or **1913 (GCC Disaster Helpline)**.

---

## 🌐 Live Production Deployment

Experience the fully functional, responsive live application deployed on Vercel:

🔗 **[https://resq-ai-sigma.vercel.app](https://resq-ai-sigma.vercel.app)**

- **Citizen SOS Portal**: Accessible directly at [`/sos`](https://resq-ai-sigma.vercel.app/sos) (no credentials needed).
- **Incident Tracking**: Instant status lookup at [`/sos?tab=track`](https://resq-ai-sigma.vercel.app/sos?tab=track) using your tracking token.
- **Tactical Command Center**: Coordinator operations at [`/dashboard`](https://resq-ai-sigma.vercel.app/dashboard).

---

## 📸 Key Application Walkthrough

### 1. Mission Control & Emergency Telemetry Hub
*The central nexus providing critical hotline numbers, active incident counters, live corridor status feeds, and direct routing for citizens and coordinators.*

![RESQ.AI Landing Hub](docs/screenshots/01-landing-overview.png)

---

### 2. Multilingual Citizen SOS Intake & Gemini AI Triage
*Citizens report distress in English, Tamil (தமிழ்), or Hindi (हिन्दी) with voice dictation, GPS pin-pointing, and visual hazard screening. Gemini automatically parses severity, trapped victim count, and vulnerabilities in real time.*

![Citizen SOS & Gemini AI Triage](docs/screenshots/02-gemini-triage.png)

---

### 3. Tactical Command Center & GIS Fleet Dispatch
*Interactive Leaflet operations map showing urgency-coded incident pins, a dedicated Needs-Location queue, and Haversine distance-ranked unit dispatch.*

![Tactical Command Center](docs/screenshots/03-command-center.png)

---

## 💡 The Problem & The Solution

During extreme weather events and urban monsoon inundations (such as the Chennai floods), emergency hotlines experience crippling call-volume spikes:
- **Linguistic Bottlenecks**: Citizens report distress in regional vernaculars (Tamil, Hindi, mixed scripts) under extreme panic.
- **Fragmented Data**: Emergency operators receive unstructured voice calls lacking verified GPS coordinates, medical vulnerabilities, or water depth estimates.
- **Coordination Delays**: Rescuers face double-dispatch conflicts, dispatching identical assets to duplicate calls while high-risk victims remain unassigned.

**RESQ.AI** bridges this gap by unifying multilingual AI triage, zero-outage fallback intelligence, and tactical GIS resource dispatch into a single high-reliability operational platform.

---

## 🏗️ System Architecture

```
                                  [ CITIZEN SOS CLIENT ]
                           (English / தமிழ் / हिन्दी Speech & Text)
                                       │
                                       ▼ POST /api/incidents
                        ┌─────────────────────────────────────┐
                        │   Next.js 14 Server Route Handler   │
                        │    - Zod Payload Validation         │
                        │    - Unguessable Token Generation   │
                        └──────────────────┬──────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       [ Google Gemini AI Engine ]                  [ Deterministic Fallback ]
        - Multilingual Extraction                    - Regex & Keyword Triage
        - Life-Threat Hazard Scoring                 - 100% Zero-Downtime Guarantee
        - Structured Translation Output              - Instant Localized Parsing
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           │
                                           ▼
                       ┌──────────────────────────────────────┐
                       │     Repository Abstraction Layer     │
                       ├──────────────────┬───────────────────┤
                       ▼                  ▼                   ▼
             [ Firestore Admin ]    [ LocalStorage ]   [ In-Memory Store ]
              Cloud Persistence      Browser Demo       Edge Test Storage
                                           │
                                           ▼
                       ┌──────────────────────────────────────┐
                       │     Tactical Operations Command      │
                       │    - Leaflet OpenStreetMap GIS        │
                       │    - Haversine Fleet Dispatch         │
                       │    - Double-Assignment Interlocks     │
                       │    - Real-Time Audit Milestones       │
                       └──────────────────────────────────────┘
```

---

## 🚀 Core Capabilities & Technical Pillars

### 1. Multilingual Natural Language Triage (Gemini AI + Fallback)
- **Zero Language Barrier**: Seamlessly parses distress messages written in conversational English, Tamil (`வெள்ளம் சூழ்ந்துள்ளது`), or Hindi (`मदद चाहिए`).
- **Structured Extraction**: Automatically identifies urgency (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), estimated trapped victim count, medical conditions (e.g., insulin dependence, elderly, pregnant), and flood depth.
- **Zero-Outage Deterministic Fallback**: If the Gemini API is rate-limited, offline, or unconfigured, an in-house localized rule engine immediately triages the incident with zero delay.
- **Zero-Fabrication Guardrail**: Never hallucinates addresses or victim counts; unknown fields are cataloged under `missingInformation`.

### 2. Tactical Operations & Haversine Fleet Dispatch
- **Dynamic Leaflet GIS**: Real-time map displaying pulse-animated urgency markers, responder team positions, and danger perimeters.
- **Needs-Location Queue**: Incidents submitted without precise GPS coordinates are automatically isolated in a dedicated queue rather than placed at synthetic map points.
- **Distance-Ranked Dispatch**: Calculates straight-line distance via the Haversine formula across simulated specialized units (Inflatable Rescue Boat, Paramedic Quick Response, High-Water Rescue Truck, Heavy Clearance, Drone Recon).
- **Anti-Conflict Interlock**: Active units cannot be double-assigned to competing incidents, and are automatically freed upon incident resolution.

### 3. Privacy-Preserving Citizen Tracking
- **Unguessable Tracking Tokens**: Every submission issues a private `trk_...` reference key.
- **PII Scrubbing**: Public tracking endpoints completely redact phone numbers, caller names, and specific residence details, exposing only operational status and safety guidance.

### 4. Resilient Hybrid Repository
- Seamlessly operates across cloud **Firebase Firestore (Admin SDK)** and client-side **LocalStorage Demo Mode**. Works completely credential-free out of the box for hackathon judges and evaluators.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server-only modules) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict type checking) |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/) ("Neon Command" tactical UI palette) |
| **AI / Machine Learning** | [Google Gemini 2.5 / 1.5](https://ai.google.dev/) (`@google/genai` & `@google/generative-ai`) |
| **Database & Persistence** | [Firebase Admin SDK](https://firebase.google.com/) Firestore + LocalStorage fallback |
| **Mapping & GIS** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) + OpenStreetMap |
| **Data Visualization** | [Recharts](https://recharts.org/) (Real-time analytics and hourly incident surge charts) |
| **Validation & Security** | [Zod](https://zod.dev/) schemas, HMAC-SHA256 session cookies, Nanoid tokens |
| **Testing & Automation** | [Playwright](https://playwright.dev/) + TSX automated test runner |
| **Deployment** | [Vercel](https://vercel.com/) (Edge-optimized serverless runtime) |

---

## 🏃 Local Setup & Development

### Prerequisites
- Node.js `v18.x`, `v20.x`, or `v24.x`
- npm `v9.x` or `v10.x`

### 1. Clone & Install
```bash
git clone https://github.com/akashnarayanan007/resq-ai.git
cd resq-ai
npm install
```

### 2. Environment Configuration (Optional)
Create a `.env.local` file in the root directory:
```env
# Google Gemini API Key (optional - built-in deterministic fallback engine activates if omitted)
GEMINI_API_KEY="your-gemini-api-key"

# Coordinator Operations Authentication
COORDINATOR_PASSCODE="your-secure-passcode"
DEMO_ADMIN_SECRET="your-32-character-hmac-sha256-signing-secret"

# Firebase Admin Firestore (optional - falls back to Local Demo Mode if omitted)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Demo Mode Indicator
DEMO_MODE=true
```

### 3. Run Verification Suite
```bash
# TypeScript compiler type check
npx tsc --noEmit

# ESLint audit
npm run lint

# Comprehensive E2E Smoke Test Suite
npx tsx src/tests/e2eSmokeTest.ts

# Production build verification
npm run build
```

### 4. Launch Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗺️ Key Routes & Access Points

| Route | Description | Target User |
| :--- | :--- | :--- |
| **`/`** | Live Mission Control Hub & Crisis Overview | Public / Citizens / Coordinators |
| **`/sos`** | Multilingual Citizen Emergency SOS Intake Form | Citizens in Distress |
| **`/sos?tab=track`** | Anonymous Citizen Incident Tracking Portal | Citizens & Families |
| **`/dashboard`** | Tactical Command Center (GIS Map & Fleet Dispatch) | Emergency Coordinators |
| **`/dashboard/incidents`**| Incident Matrix (Table & Kanban Views, Urgency Filters)| Incident Managers |
| **`/dashboard/teams`** | Specialized Responder Team Status & VHF Channels | Dispatch Operators |
| **`/dashboard/analytics`**| Operations Analytics, Surge Charts & System Health | Incident Commanders |

---

## ⚖️ Safety & Responsible AI Principles

1. **Human-in-the-Loop Authority**: The AI model only performs triaging, extraction, and ranking assistance; human incident commanders retain final authority over resource assignment.
2. **Missing Information Transparency**: The system explicitly flags missing data (such as unconfirmed victim numbers or ambiguous cross-streets) instead of guessing.
3. **Unverified Visual Screening**: Uploaded photos are categorized as `UNVERIFIED VISUAL AI OBSERVATION` to avoid false dispatches.
4. **Resilience by Design**: The platform is architected so that network throttling, API downtime, or missing external credentials never halt life-safety emergency logging.

---

## 📄 License & Hackathon Attribution

Developed for hackathon demonstration. Built with passion for disaster resilience and life-saving operational technology.

**Live App**: [https://resq-ai-sigma.vercel.app](https://resq-ai-sigma.vercel.app)  
**Repository**: [https://github.com/akashnarayanan007/resq-ai](https://github.com/akashnarayanan007/resq-ai)
