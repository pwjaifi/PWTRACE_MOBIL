# Greenhouse Farm Management App

Expo React Native mobile app for greenhouse agricultural observation management.

## Architecture

- **Framework**: Expo Router (file-based routing) + Express backend on port 5000
- **Frontend**: Port 8081 (Expo dev server)
- **State**: React Context (AuthContext) + React Query for server state + useState for local
- **Fonts**: Poppins (400, 500, 600, 700) via @expo-google-fonts/poppins
- **Theme**: Deep forest green (#1A6B3C), mint accents, sage background (#F0F7F4)

## Features

### Authentication
- `app/login.tsx` — Login screen with email/password, validation, account-disabled error state
- `contexts/AuthContext.tsx` — Auth state with AsyncStorage persistence; any valid email works (placeholder); `disabled@example.com` triggers account-disabled
- Root layout guards: unauthenticated users are redirected to `/login` via `useEffect`

### Observation Forms (6 categories)
All forms save **locally** (offline-first) and display a "Saved locally" success message.
Submitting navigates back after saving.

| Route | Category | Key fields |
|---|---|---|
| `/observations/virus` | Virus | Farm/Secteur/Serre, plants count, severity, lines, description, photo |
| `/observations/auxiliaire` | Auxiliaire | Farm/Secteur/Serre, type, population level, description, photo |
| `/observations/ravageurs` | Ravageurs | Farm/Secteur/Serre, type, lines, severity, description, photo |
| `/observations/irrigation` | Irrigation | Farm/Secteur/Serre, Supply (VQV/EC/PH), Drainage (VQV/EC/PH), datetime, lines |
| `/observations/inspection` | Inspection | Serre, culture, date, dynamic multi-blocks (category+type+status+photos+description) |
| `/observations/compteur` | Compteur | Type IN/OUT, Farm, Compteur ID, datetime, V-Compteur value |

### Offline-First Architecture
- `services/LocalStorageService.ts` — Saves pending items to AsyncStorage by category key `pending_<category>`; provides `getUnsyncedCounts()` for the Sync tab
- `services/SyncService.ts` — 6 independent sync methods (`syncVirusObservations()`, etc.) + `syncAll()`; each reads from LocalStorageService, calls ApiService, removes on success
- `services/ApiService.ts` — All methods are placeholders with TODO comments for backend integration; simulate 1s delay

### Tabs
- **Observations** (`index.tsx`) — Dashboard with 6 category cards, user avatar/name, logout button
- **Sync** (`sync.tsx`) — Shows only categories with pending data; per-category sync button + "Sync All" button; auto-refreshes on tab focus
- **Historique** (`history.tsx`) — Observation history list

## Key Files
```
app/
  _layout.tsx          # Root layout with AuthProvider, font loading, auth guard
  login.tsx            # Login screen
  (tabs)/
    _layout.tsx        # Tab layout (NativeTabs on iOS 26+, ClassicTabs otherwise)
    index.tsx          # Home dashboard
    sync.tsx           # Sync management screen
    history.tsx        # History tab
  observations/
    virus.tsx          # Virus form
    auxiliaire.tsx     # Auxiliaire form
    ravageurs.tsx      # Ravageurs form
    irrigation.tsx     # Irrigation form
    inspection.tsx     # Inspection form (dynamic blocks)
    compteur.tsx       # Compteur form

contexts/
  AuthContext.tsx      # Auth state, login/logout, AsyncStorage persistence

services/
  ApiService.ts        # API placeholders (all TODOs marked for backend integration)
  LocalStorageService.ts # AsyncStorage CRUD for offline pending observations
  SyncService.ts       # 6 category sync methods + syncAll()
  mockData.ts          # Mock farms, secteurs, serres, observation types (replace with real API)

models/index.ts        # TypeScript interfaces for all observation types
constants/colors.ts    # Color system with categoryColors per observation type
components/forms/      # Reusable form components (FormDropdown, FormMultiSelect, etc.)
```

## Integration Points
When connecting to real backend:
1. Update `contexts/AuthContext.tsx` → `login()` method: replace placeholder with `ApiService.login()`
2. Update `services/ApiService.ts` → uncomment `fetch` calls in each method
3. Update `services/mockData.ts` → replace with API calls (farms, secteurs, serres, observation types)
4. The `SyncService` architecture is ready — no changes needed when API is real

## Dev Notes
- Warnings `"shadow* deprecated"` and `"props.pointerEvents deprecated"` are cosmetic only
- No external API keys needed — all integrations are internal
- To test sync: submit any observation → go to Sync tab → tap category sync button
