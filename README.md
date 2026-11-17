# RESQ.AI — AI-Assisted Disaster Incident Coordination Platform

> **DEMO SIMULATION PLATFORM**  
> **DISCLAIMER:** This application is an emergency operations hackathon technology demonstrator with synthetic simulation data. It is **NOT** connected to official 112 emergency dispatchers or government response systems. In an actual life-threatening disaster in Tamil Nadu/India, immediately dial **112 (National Emergency)**, **108 (Ambulance)**, or **1913 (Greater Chennai Corporation)**.

---

## 🌟 Executive Summary

**RESQ.AI** is an emergency operations SaaS platform designed to solve the critical coordination breakdown that occurs during climate catastrophes, extreme weather events, and mass urban floods. Built around a simulated scenario modeled after extreme cyclone inundation across the **Greater Chennai Metropolitan Area** (Velachery, Madipakkam, Tambaram, Saidapet, Adyar, Sholinganallur, Pallikaranai, and Mylapore).

The platform bridges citizen distress signals directly into a multi-agency command matrix combining **autonomous Gemini AI triage**, **tactical GIS spatial mapping**, and **real-time field asset dispatch**.

---

## 🚀 Key Routes & Capabilities

| Route | Interface | Key Capabilities |
|---|---|---|
| **`/`** | **Mission Landing Page** | Operational overview, live sector status matrix, quick CTAs to Command Center or Citizen SOS, and official helpline access. |
| **`/sos`** | **Mobile-First Citizen Reporting** | Fast-load, low-bandwidth distress beacon. Geolocation latching, 0–10ft floodwater slider, vulnerable cohort flags (infants/elderly), boat & paramedic requests, photo attachment preview, and instant AI triage score output. |
| **`/dashboard`** | **Tactical Operations Command** | Dark Matter Leaflet GIS map with color-coded severity markers (pulsing red criticals, amber warnings, cyan units, green resolved), live telemetry stream, unit dispatch modal, and detailed incident inspection. |
| **`/dashboard/incidents`** | **Incident Management Matrix** | Dual-mode view: **Interactive Table** and **Kanban Columns** (`Reported`, `Triaged`, `Dispatched`, `In-Progress`, `Resolved`). Filter by severity, status, or search query. Direct inline status transition. |
| **`/dashboard/teams`** | **Responder Units Roster** | Real-time tracking of simulated units: NDRF Battalion, SDRF Coast Guard, 108 Amphibious Paramedics, TNFRS Fire Rescue, Pegasus Drone Wing, and GCC Dewatering. Live status toggles (`idle`, `en_route`, `on_scene`, `refueling`), VHF radio frequencies, battery/fuel percentages, and equipment kits. |
| **`/dashboard/analytics`** | **Disaster Impact Analytics** | Visual telemetry charts powered by Recharts: hourly incident influx timelines, severity distribution donuts, water depth distribution by sector, and distress category breakdowns. |

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, Server Components & Client Hydration)
- **Language**: TypeScript (Strict typing across repositories, models, and API interfaces)
- **Styling**: Tailwind CSS (Emergency operations dark navy palette: `#070C18`, `#0B1120`, `#0F172A`, crimson, amber, emerald, and cyan accents)
- **Mapping & GIS**: Leaflet & React Leaflet dynamic SSR-safe wrapper with CartoDB Dark Matter tiles and custom tactical HTML marker icons
- **Data Visualizations**: Recharts (Responsive Area, Bar, and Pie Charts)
- **Icons**: Lucide React
- **Data Layer & Architecture**: Typed Repository pattern (`IncidentRepository`, `TeamRepository`) backed by browser `localStorage` with seed simulation datasets. Works 100% out of the box with zero external credential dependencies, while exposing clean abstractions for Firebase Firestore.
- **AI Intelligence**: Next.js Server Route `/api/ai/triage`. If `GEMINI_API_KEY` is configured in environment, leverages Google Gemini 1.5. If no key is configured, transparently runs a high-precision deterministic emergency triage heuristic that calculates priority scores, identifies hidden hazards (live wire electrocution, hypothermia, septic water), and suggests tactical rescue assets.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x+)
- npm (v9.x or v10.x+)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables (Optional)
Create a `.env.local` file in the root directory:
```env
# Optional: Provide to enable live Gemini 1.5 Flash generation
# If omitted, the platform uses its built-in simulated neural triage engine
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🛡️ Architecture & Security Principles

1. **Zero Client Secret Leakage**: All AI model calls and API requests are routed strictly through server-side App Router endpoints (`/api/ai/triage`). No API keys or credentials are ever exposed in client bundles.
2. **Offline-Ready Resilience**: Disaster scenarios frequently degrade cellular networks. RESQ.AI's LocalStorage repository abstraction ensures all state changes, dispatches, and new SOS incident reports persist locally in the operator's browser session even without backend database connectivity.
3. **One-Click Simulation Reset**: Includes a "Reset Demo Data" button in the dashboard sidebar to instantly restore the initial synthetic Chennai flood baseline at any time.

---

## 🚒 Simulated Response Units

- **NDRF Unit 04 (Velachery Detachment)** — Callsign `TIGER-1` (VHF CH-14: 156.700 MHz)
- **108 Amphibious Medical Unit 07** — Callsign `MEDIC-7` (VHF CH-11: 156.550 MHz)
- **SDRF Coast Guard Bravo** — Callsign `COAST-BRAVO` (VHF CH-16: 156.800 MHz)
- **TNFRS Quick Response Tender 03** — Callsign `FIRE-TAMBARAM` (VHF CH-08: 156.400 MHz)
- **Pegasus Drone Recon & Payload Wing** — Callsign `SKY-PEGASUS` (Digital Link 2.4/5.8 GHz)
- **Greater Chennai Corp Dewatering Unit 09** — Callsign `GCC-FLOW-9` (GCC Civil UHF-02)
- **NDRF Delta Standby Reserve (Tambaram Base)** — Callsign `TIGER-2-STANDBY`
- **SDRF Sholinganallur Rapid Paramedic Squad** — Callsign `COAST-SHOLINGA`

---

## 📜 Official Emergency Numbers (Chennai / Tamil Nadu)

- **National Emergency Support System (Police / Fire / Ambulance)**: `112`
- **Greater Chennai Corporation Helpline**: `1913`
- **Ambulance Services**: `108`
- **TNSDMA State Emergency Operations Center**: `1070`
- **TANGEDCO Electricity / Wire Hazard Complaints**: `94987 94987`
