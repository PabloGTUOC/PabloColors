# PabloColors
Light App to manage receipts inside my X100VI

# Fuji Recipe Manager — Product Specification
> For Claude Code/Anigravity. Read this fully before writing any code.

---

## 1. Project Overview

A self-hosted web application for managing Fujifilm X-series film simulation recipes. The app runs on a Synology NAS, is exposed publicly via a Cloudflare Tunnel, and provides a browser-based UI to create, organise, and push recipes to a connected Fujifilm X100VI camera over USB.

**App name:** PabloColors

---

## 2. Architecture

### Critical constraint: WebUSB is client-side only

WebUSB — the API used to communicate with the camera over USB — runs **entirely in the browser**. It cannot be proxied through the server. The NAS backend has no role in camera communication. This means:

- **Remote use (via Cloudflare):** Recipe management only — browse, create, edit, tag, delete recipes from any device/location
- **Local use (Mac + Chrome + camera plugged in):** All of the above, plus the ability to read/write camera slots C1–C7 via WebUSB

The UI must make this distinction clear. Camera features should be gracefully disabled (not broken) when WebUSB is unavailable or no camera is connected.

### Components

```
┌─────────────────────────────────────────────────┐
│  Browser (Chrome required for WebUSB)           │
│                                                 │
│  ┌─────────────────┐   ┌─────────────────────┐  │
│  │  Vue.js SPA     │   │  WebUSB PTP Layer   │  │
│  │  (UI + state)   │◄──│  (camera comms)     │  │
│  └────────┬────────┘   └──────────┬──────────┘  │
│           │ HTTPS                 │ USB          │
└───────────┼───────────────────────┼─────────────┘
            │                       │
            ▼                       ▼
┌───────────────────────────────┐  ┌──────────────────────┐
│  Synology NAS                 │  │  Fujifilm X100VI     │
│                               │  │  (USB-C connected)   │
│  ┌─────────────────────────┐  │  └──────────────────────┘
│  │  NGINX (existing)       │  │
│  │  reverse proxy          │  │
│  │  pablocolors.yourdomain │  │
│  └────────────┬────────────┘  │
│               │ proxy_pass    │
│               ▼               │
│  ┌─────────────────────────┐  │
│  │  pablocolors-app        │  │
│  │  Docker container       │  │
│  │  Node.js + Express      │  │
│  │  port 3000 (internal)   │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  cloudflared            │  │
│  │  Docker container       │  │
│  │  (existing, separate)   │  │
│  │  routes via NGINX       │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Vue 3 + Vite | Lightweight, fast, good TypeScript support |
| Backend | Node.js + Express | Simple REST API, easy on NAS resources |
| Database | SQLite (via `better-sqlite3`) | No separate DB process, file-based, easy to back up on NAS |
| Camera comms | WebUSB (browser, TypeScript) | Same protocol as FilmKit and X RAW Studio |
| Container | Docker (single `docker-compose.yml`, one service) | Clean deployment on Synology, easy updates |
| Auth | Simple session-based login (username + password) | Single user, no OAuth complexity needed |
| Reverse proxy | NGINX (existing on NAS) | Routes `pablocolors.yourdomain` → container port 3000 |
| Public tunnel | `cloudflared` (existing separate Docker container on NAS) | Already manages Cloudflare Tunnel — PabloColors does not own or run this |

---

## 4. Deployment

### Infrastructure context

The NAS already runs two existing services that PabloColors integrates with but does **not** own or manage:

- **`cloudflared` Docker container** — manages the Cloudflare Tunnel. Already running. PabloColors does not touch this.
- **NGINX** — acts as the reverse proxy and routes incoming requests by hostname to the correct internal service. Already running.

PabloColors ships as a **single Docker container** (`pablocolors-app`). There is no `cloudflared` service in its `docker-compose.yml`.

### Docker setup

The `docker-compose.yml` contains one service:

- **`pablocolors-app`** — Node.js server serving both the static Vue SPA and the REST API. Listens on an internal port (default `3000`). Exposes that port to the NAS host so NGINX can proxy to it.

The SQLite database and uploaded sample photos are stored in a bind-mounted NAS directory (e.g. `/volume1/docker/pablocolors/data`).

### NGINX configuration

Add a new server block to the existing NGINX config to route the PabloColors subdomain to the container. The generated README must include a ready-to-use NGINX snippet:

```nginx
server {
    listen 443 ssl;
    server_name pablocolors.yourdomain.com;

    # SSL handled by Cloudflare Tunnel — adjust if terminating locally
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Required for session cookies over proxy
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

> Replace `pablocolors.yourdomain.com` with your actual subdomain and `3000` with your chosen host port if changed.

### Cloudflare Tunnel

In the existing `cloudflared` config, add a route entry pointing the PabloColors subdomain to NGINX (or directly to `localhost:3000` if preferred). No changes to the `cloudflared` container itself are needed — only a config update. The README must document this step clearly but note that the tunnel infrastructure is pre-existing.

### Environment variables (`.env` file)

```
PORT=3000
SESSION_SECRET=<random string — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ADMIN_USERNAME=<your username>
ADMIN_PASSWORD_HASH=<bcrypt hash — see README for generation command>
DATA_DIR=/app/data
```

### Build & run

```bash
docker-compose up -d
```

The container starts and listens on `localhost:3000`. NGINX routes the configured subdomain to it. The Cloudflare Tunnel makes it publicly accessible via HTTPS.

---

## 5. Authentication

Single-user session login:

- Login page at `/login` — username + password form
- Passwords stored as bcrypt hashes in the `.env` or a config file (not in the DB)
- Sessions via `express-session` with `connect-sqlite3` store
- All routes (API and UI) require authentication
- Session expires after 30 days (`remember me` checkbox on login page)
- No registration flow — credentials are set via environment variables at deploy time

---

## 6. Recipe Organisation

Recipes are organised primarily by **shooting scenario**. This is a first-class concept in the data model, not just a tag.

### Scenarios (fixed list, cannot be deleted, can be hidden)

```typescript
enum Scenario {
  Portrait = 'portrait',
  Family = 'family',
  Street = 'street',
  Travel = 'travel',
  Nature = 'nature',
  Indoors = 'indoors',
  LowLight = 'low_light',
  BlackAndWhite = 'black_and_white',
  Other = 'other',
}
```

Each recipe belongs to **one scenario** (required field). Tags remain available as a secondary, freeform layer for further organisation within a scenario (e.g. "warm", "summer", "overcast").

### UI implication

The Library view's primary navigation is a scenario sidebar or tab row. Selecting a scenario filters the recipe grid to that scenario. A special "All" view shows everything. Search works across all scenarios.

---

## 7. Recipe Data Model

### Recipe object

```typescript
interface Recipe {
  id: string;                  // UUID
  name: string;                // e.g. "Kodachrome 64"
  scenario: Scenario;          // Required — primary organisation axis
  description?: string;        // Free text notes
  tags: string[];              // Secondary freeform labels e.g. ["warm", "overcast"]
  samplePhotoPath?: string;    // Path to uploaded sample image on server
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
  settings: RecipeSettings;
}

interface RecipeSettings {
  filmSimulation: FilmSimulation;
  grainEffect: GrainEffect;
  grainSize: GrainSize;
  colorChromeEffect: EffectLevel;
  colorChromeFxBlue: EffectLevel;
  whiteBalance: WhiteBalance;
  wbColorTemp?: number;            // Kelvin, only when WB = ColorTemp
  wbShiftRed: number;             // -9 to +9
  wbShiftBlue: number;            // -9 to +9
  dynamicRange: DynamicRange;
  highlightTone: number;           // -2 to +4 (stored as ×10 internally for camera)
  shadowTone: number;              // -2 to +4
  color: number;                   // -4 to +4
  sharpness: number;               // -4 to +4
  noiseReduction: number;          // -4 to +4
  clarity: number;                 // -5 to +5
  smoothSkin: EffectLevel;
  exposureBias: number;            // -5 to +5 in 1/3 EV steps
}
```

### Enums (X100VI / X-Trans V)

```typescript
enum FilmSimulation {
  Provia = 'PROVIA', Velvia = 'VELVIA', Astia = 'ASTIA',
  ClassicChrome = 'CLASSIC_CHROME', Reala = 'REALA',
  ProNegHi = 'PRO_NEG_HI', ProNegStd = 'PRO_NEG_STD',
  ClassicNeg = 'CLASSIC_NEG', Nostalgic = 'NOSTALGIC_NEG',
  Eterna = 'ETERNA', EternaBleachBypass = 'ETERNA_BLEACH_BYPASS',
  AcrossYe = 'ACROS_YE', AcrossR = 'ACROS_R', AcrossG = 'ACROS_G',
  Acros = 'ACROS', Monochrome = 'MONOCHROME',
  MonochromeYe = 'MONOCHROME_YE', MonochromeR = 'MONOCHROME_R',
  MonochromeG = 'MONOCHROME_G', Sepia = 'SEPIA',
}

enum GrainEffect { Off = 0, Weak = 1, Strong = 2 }
enum GrainSize { Small = 0, Large = 1 }
enum EffectLevel { Off = 0, Weak = 1, Strong = 2 }
enum WhiteBalance {
  Auto = 'AUTO', AutoWhite = 'AUTO_WHITE', AutoAmbient = 'AUTO_AMBIENT',
  Daylight = 'DAYLIGHT', Shade = 'SHADE', FluorescentD = 'FL_D',
  FluorescentN = 'FL_N', FluorescentW = 'FL_W', FluorescentWW = 'FL_WW',
  Incandescent = 'INCANDESCENT', Underwater = 'UNDERWATER',
  ColorTemp = 'COLOR_TEMP', Custom1 = 'CUSTOM1', Custom2 = 'CUSTOM2',
  Custom3 = 'CUSTOM3',
}
enum DynamicRange { DR100 = 100, DR200 = 200, DR400 = 400 }
```

---

## 8. REST API

Base path: `/api/v1`

All endpoints require authentication (session cookie).

### Recipes

| Method | Path | Description |
|---|---|---|
| `GET` | `/recipes` | List all recipes. Supports `?scenario=portrait&tag=warm&search=kodak` |
| `GET` | `/recipes/:id` | Get a single recipe |
| `POST` | `/recipes` | Create a recipe |
| `PUT` | `/recipes/:id` | Update a recipe |
| `DELETE` | `/recipes/:id` | Delete a recipe |
| `POST` | `/recipes/:id/photo` | Upload sample photo (multipart, max 10MB, JPEG/PNG) |
| `DELETE` | `/recipes/:id/photo` | Remove sample photo |

### Tags

| Method | Path | Description |
|---|---|---|
| `GET` | `/tags` | List all tags in use with counts |

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Body: `{ username, password }` |
| `POST` | `/auth/logout` | Destroy session |
| `GET` | `/auth/me` | Returns current user or 401 |

---

## 9. Frontend — UI Screens

### 9.1 Login page (`/login`)
- Username + password fields
- "Remember me" checkbox (30-day session)
- Minimal, clean design. App name "PabloColors" shown prominently.

### 9.2 Recipe Library (`/`)

**Primary navigation: scenario sidebar (desktop) or tab row (mobile)**

- Scenarios listed vertically on the left with recipe count per scenario
- "All" at the top shows everything
- Clicking a scenario filters the grid
- Search bar above the grid — searches name, description, tags across all scenarios
- Tag filter chips appear below search when a scenario is selected
- Grid of recipe cards (default view); list toggle available
- Each card shows: name, scenario badge, film simulation, tags, sample photo thumbnail if available
- "+ New Recipe" button (opens editor with current scenario pre-selected)

### 9.3 Recipe Detail / Editor (`/recipes/:id` and `/recipes/new`)
- **Scenario selector** — dropdown at the top of the form (required)
- Full form for all `RecipeSettings` fields
- Sliders for numeric ranges, dropdowns for enums
- WB Color Temp field: visible only when WB = Color Temp
- Monochrome film sims: disable and grey out Color, ColorChrome, ColorChromeFxBlue with tooltip explanation
- Tag input (chip-style, freeform)
- Description textarea
- Sample photo upload (drag-and-drop + click, shows preview)
- Save / Cancel / Delete (with confirmation dialog)

### 9.4 Camera Panel

Show as a persistent bottom bar. Visibility logic:

- **Chromium browser + WebUSB available:** Show full panel
- **Non-Chromium or WebUSB unavailable:** Show a subtle static banner only: *"Camera features require Chrome with the camera connected via USB-C."*

Panel contents:

- **Connect button** — calls `navigator.usb.requestDevice()`. Must be user-triggered (WebUSB requirement).
- **Status indicator** — "No camera" / "X100VI connected"
- **Slot grid C1–C7** — shows current preset name read from camera after connection
- **Push to slot** — from any recipe card or detail view, "Push to camera" opens a slot picker (C1–C7) and writes the recipe to that slot
- **Pull from slot** — reads a slot and creates a new recipe, opening the editor pre-filled (scenario defaults to "Other", user must assign)
- **Refresh** — re-reads all slots from the camera

---

## 10. WebUSB / PTP Camera Layer

Lives entirely in the browser at `client/src/camera/`.

### Protocol

PTP (Picture Transfer Protocol) over USB bulk transfers — ISO 15740. Same protocol as Fujifilm X RAW Studio.

### PTP container format

```
[0-3]  uint32 LE: total length
[4-5]  uint16 LE: type (1=CMD, 2=DATA, 3=RESPONSE)
[6-7]  uint16 LE: operation code
[8-11] uint32 LE: transaction ID
[...]  up to 5 × uint32 params, or data payload
```

### Property IDs (X100VI)

```
D18C  slot selector (write 1–7 to switch active slot)
D18D  preset name (PTP string)
D18E–D1A5  24 recipe properties (film sim, tones, WB, grain, effects)
```

### Read slot N

1. `SetDevicePropValue(D18C, N)`
2. `GetDevicePropValue(D18D)` → name
3. `GetDevicePropValue(D18E)` through `GetDevicePropValue(D1A5)` → 24 properties

### Write slot N

1. `SetDevicePropValue(D18C, N)`
2. `SetDevicePropValue(D18D, name)`
3. For each property in `D18E`–`D1A5`: `SetDevicePropValue(prop, value)`

### Encoding rules (confirmed X100VI, from FilmKit reverse engineering)

- Tone values (Highlight, Shadow, Color, Sharpness, Clarity): ×10 encoding — `+1.5` stored as `15`
- Noise Reduction: proprietary non-linear lookup table — copy lookup table from FilmKit `src/profile/d185.ts`
- Color Temperature: can only be written when WB mode is already set to Color Temp
- Monochrome film sims: reject Color property writes — check film sim before writing
- Write order matters: follow FilmKit's property write ordering exactly

### Value translation module (`preset-translate.ts`)

Must convert between:
- **UI values** — human readable (`+1.5`, `"Velvia"`, `"Weak"`)
- **Camera wire values** — raw bytes (`15`, `0x02`, `0x01`)

Port this logic directly from FilmKit's `src/profile/preset-translate.ts`.

### Error handling

- Wrap all PTP operations in try/catch
- Surface errors in Camera Panel UI
- Partial write failures: report which properties succeeded/failed
- Camera errors must not crash the app or affect recipe library

---

## 11. Known Constraints

| Constraint | Decision |
|---|---|
| WebUSB is Chromium-only | Documented in UI and README. No workaround. |
| WebUSB requires HTTPS or localhost | Cloudflare Tunnel provides HTTPS. Dev uses localhost. |
| WebUSB requires user gesture to connect | "Connect camera" button satisfies this. No auto-connect. |
| Camera comms are local-only | Explicitly communicated in UI. Remote users see library only. |
| Single user | No multi-user. Credentials via environment variables only. |
| Sample photos | Stored at `DATA_DIR/photos/`. Served by Express. Max 10MB. |
| RAW conversion | Out of scope for MVP. |

---

## 12. File Structure

```
pablocolors/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── src/
│       ├── index.ts               # Express entry point
│       ├── auth.ts                # Session middleware
│       ├── db.ts                  # SQLite setup + migrations
│       ├── routes/
│       │   ├── recipes.ts
│       │   └── tags.ts
│       └── types.ts
│
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.ts
        ├── App.vue
        ├── router.ts
        ├── stores/
        │   ├── recipes.ts         # Pinia store
        │   └── camera.ts          # Camera connection state
        ├── views/
        │   ├── LoginView.vue
        │   ├── LibraryView.vue    # Scenario sidebar + recipe grid
        │   ├── RecipeView.vue
        │   └── NewRecipeView.vue
        ├── components/
        │   ├── RecipeCard.vue
        │   ├── RecipeForm.vue
        │   ├── ScenarioSidebar.vue
        │   ├── CameraPanel.vue
        │   ├── SlotPicker.vue
        │   └── TagFilter.vue
        └── camera/
            ├── index.ts
            ├── session.ts
            ├── transport.ts
            ├── container.ts
            ├── constants.ts
            ├── preset-translate.ts
            └── enums.ts
```

---

## 13. SQLite Schema

```sql
CREATE TABLE recipes (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  scenario          TEXT NOT NULL DEFAULT 'other',  -- Scenario enum value
  description       TEXT,
  tags              TEXT NOT NULL DEFAULT '[]',      -- JSON array of strings
  sample_photo_path TEXT,
  settings          TEXT NOT NULL,                   -- JSON blob of RecipeSettings
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX idx_recipes_name     ON recipes(name);
CREATE INDEX idx_recipes_scenario ON recipes(scenario);
```

---

## 14. README Requirements

The generated `README.md` must include:

1. Prerequisites (Docker on Synology, existing NGINX service, existing `cloudflared` Docker container, Chrome for camera features)
2. Step-by-step Synology deployment (Container Manager / docker-compose — single container only)
3. How to generate the bcrypt password hash (`node -e` one-liner)
4. Ready-to-paste NGINX server block for the PabloColors subdomain (see Section 4)
5. How to add the PabloColors route to the existing `cloudflared` tunnel config (subdomain → NGINX or localhost:3000)
6. Camera usage instructions (Chrome only, USB-C, set camera USB mode to PC Connection / X RAW Studio mode)
7. Known limitations (WebUSB browser requirement, camera comms local-only)
8. Backup instructions (copy `DATA_DIR/pablocolors.db` and `DATA_DIR/photos/`)

---

## 15. Out of Scope (MVP)

- RAW conversion via camera engine
- Multi-user support
- Recipe sharing / export links
- Import from community sources (Fuji X Weekly, etc.)
- PWA / offline mode
- Support for cameras other than X100VI (architecture must not prevent future additions, but no other cameras are mapped or tested)
- Auto-connect on page load

---

## 16. Key Reference Repositories

| Repo | What to study |
|---|---|
| `github.com/eggricesoy/filmkit` | Primary reference. Full WebUSB + PTP for X100VI. Study `QUICK_REFERENCE.md`, `src/ptp/`, and `src/profile/preset-translate.ts`. MIT licensed. |
| `github.com/petabyt/fp` | Fujifilm 625-byte d185 profile format parser |
| `github.com/petabyt/fudge` | Broader Fuji PTP/IP reference |
| `github.com/pinpox/rawji` | Secondary PTP reference used by FilmKit |
