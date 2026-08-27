# Notice2Action — Frontend

A React single-page application for the Notice2Action platform. Built with Vite, Tailwind CSS v4, and React Router v7. The frontend sends a notice to the backend, shows a loading screen while it is processed, then presents the summary, deadlines, eligibility, and a tickable action checklist.

---

## What This Project Does

The frontend provides a four-screen linear flow. A user pastes notice text or uploads a PDF on the Home screen. The app navigates to a Processing screen while the API call runs. On success it navigates to a Results screen showing three output cards. From there the user opens a Checklist screen where they can tick off action items one by one. Ticking an item immediately updates the backend so progress is preserved on a page refresh or if the user comes back to the same URL later.

A Recent Notices strip on the Home screen stores the last few processed notices in localStorage so the user can navigate back to any of them without re-processing.

---

Frontend Deployment Link: https://notice2-action-team21.vercel.app

---

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4 with the @tailwindcss/vite plugin
- React Router 7
- Axios 1 with a base URL configured from an environment variable

---

## Folder Structure

```
frontend/
├── index.html
├── vite.config.js
├── vercel.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── axiosInstance.js
│   ├── store/
│   │   └── noticeStore.js
│   ├── styles/
│   │   └── common.js
│   └── components/
│       ├── Home.jsx
│       ├── Processing.jsx
│       ├── Results.jsx
│       └── Checklist.jsx
```

---

## Environment Variables

```
VITE_API_URL=http://localhost:5000/notice-api
```

In production, set this to your Render backend URL:

```
VITE_API_URL=https://notice2action-team21.onrender.com/notice-api
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Paste / upload screen with Recent Notices strip |
| `/processing` | Processing | Loading screen shown while the API call is in progress |
| `/results/:id` | Results | Summary, deadlines, eligibility for a processed notice |
| `/checklist/:id` | Checklist | Tickable action list with progress bar |

Navigation between screens is handled entirely by React Router. The `:id` in the Results and Checklist routes is the MongoDB `_id` returned by the backend after processing.

---

## State Management

There is no global state library. State is handled at the component level with `useState` and `useEffect`, and persisted across sessions using a localStorage-backed store.

### noticeStore.js

A plain JavaScript module that reads from and writes to `localStorage` under the key `notice2action_recent`. It exports two functions:

`getRecentNotices()` — reads the array from localStorage and returns it, or returns an empty array if nothing is stored.

`addRecentNotice(notice)` — prepends a new entry to the array and writes it back. Keeps at most the five most recent notices. Each entry stores the notice `_id`, `summary` (truncated), `category`, and `createdAt` timestamp so the Recent strip can render without a network request.

---

## Components (Screens)

### Home (`/`)

Starting screen with two tabs: **Paste text** and **Upload PDF**.

On the Paste tab, the user types or pastes notice text into a full-height textarea. On the Upload tab, a drag-and-drop area accepts PDF files — clicking it opens the file browser. The active tab is tracked with a state variable; only one is shown at a time.

Submitting the form navigates to `/processing` and stores the pending request data in React Router's location state so the Processing screen can pick it up and make the API call.

At the bottom of the screen, a Recent Notices strip reads from `noticeStore.js` and renders a row for each saved notice. Clicking a row navigates directly to `/results/:id` for that notice.

---

### Processing (`/processing`)

Loading screen shown while the backend processes the notice.

On mount, this component reads the submitted data from React Router location state and calls `POST /notice-api/process`. While the request is in flight, an animated step list cycles through three labels: "Reading your notice", "Extracting key details", and "Building your checklist". Each step highlights in sequence to give a sense of progress.

On success, the backend response is saved to `noticeStore.js` and the component navigates to `/results/:id` using the returned `_id`.

On failure, the animated list is replaced by an error card showing the failure reason and a "Go back" button that returns to the Home screen.

If the user navigates to `/processing` directly without a pending request in location state, they are redirected to Home immediately.

---

### Results (`/results/:id`)

Output screen for a processed notice. The `:id` param is used to fetch the notice from `GET /notice-api/notice/:id` on mount.

Three sections are rendered:

**Summary card** — the plain-language overview from Gemini displayed as a paragraph.

**Deadlines and Eligibility panel** — two sub-sections side by side. Deadlines lists each `{ label, date }` pair. Eligibility lists each condition string. If either array is empty, the sub-section shows a short message ("No specific deadlines found" / "No specific eligibility conditions found") rather than an empty space.

**Open Checklist button** — navigates to `/checklist/:id`.

A "Process another notice" link at the bottom returns to the Home screen.

---

### Checklist (`/checklist/:id`)

Action list screen. The `:id` param is used to fetch the notice from `GET /notice-api/notice/:id` on mount.

A progress bar at the top shows `x of n steps completed` and fills proportionally. Below it, each checklist item renders as a row with a checkbox, the task text, and a visual strike-through on completion.

When the user ticks or unticks a checkbox, the component immediately calls `PUT /notice-api/notice/:id/checklist` with `{ index, done }` and updates local state optimistically — the checkbox responds instantly and the network request runs in the background. If the request fails, the checkbox is reverted and a short error message appears.

When every item is ticked, a completion banner appears at the top of the list.

Navigation links at the bottom allow the user to jump back to the Results screen or return to Home to process another notice.

---

## Design System

All Tailwind class strings used across the app are stored as named constants in `src/styles/common.js`. Components import these tokens by name instead of writing class strings inline. This keeps the visual language consistent across all four screens and means a colour or spacing change only needs to happen in one place.

The design uses a navy primary (`#1B2A6B`), teal accent (`#0B9A8A`), and light grey backgrounds for cards. Alert colours, progress bars, and the completion banner use semantic colours that communicate state directly.

---

## Key Design Decisions

- **Processing screen owns the API call** — the Home screen does not call the backend directly. It navigates to `/processing` with the form data in router state and lets the Processing screen make the request. This means the loading animation is always shown for any submit, even if the network is fast, and error handling is centralised in one place.

- **Optimistic checklist updates** — ticking a checkbox updates React state immediately before the network request completes. This makes the UI feel instant. If the request fails the checkbox is reverted so the user knows something went wrong without losing their progress on other items.

- **noticeStore as a plain module** — rather than a context or state library, `noticeStore.js` is a plain module that reads and writes localStorage directly. The Recent strip only needs this data on mount, not reactively, so the overhead of a context or store is not needed.

- **localStorage for recent notices, MongoDB for checklist state** — history is stored locally because there are no user accounts. Checklist progress is stored on the server because it is tied to a specific notice `_id` that can be shared or bookmarked, and losing tick state on a page refresh would be frustrating.

- **vercel.json rewrite rule** — a rewrite rule that maps `/*` to `/index.html` is required for React Router to work correctly on Vercel. Without it, refreshing any URL other than `/` returns a 404 because Vercel tries to serve a static file at that path.

- **Single axiosInstance** — `axiosInstance.js` creates one Axios instance with `baseURL` set from `VITE_API_URL`. All components import this instance rather than using `axios` directly, so the base URL is configured in one place.

---

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/notice-api
```

Then start the dev server:

```bash
npm run dev
```

Opens on [http://localhost:5173](http://localhost:5173). The backend must be running for any API calls to work.

---

## Building for Production

```bash
npm run build
```

Creates a `dist/` folder. The `vercel.json` in the frontend folder contains the rewrite rule Vercel needs to handle React Router correctly.

---

## Deploying to Vercel

1. Push your code to GitHub.
2. Create a new project on [Vercel](https://vercel.com), connect your repo, and set the root directory to `frontend/`.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Add the environment variable `VITE_API_URL` pointing to your Render backend URL.
5. Deploy. After deploying, copy the Vercel URL and add it as `FRONTEND_URL` in your Render environment variables so the backend's CORS config allows requests from your Vercel domain.

---

## A Few Things Worth Knowing

**The recent notices strip uses localStorage.** There is no user account — notice history is stored in your browser. Clearing site data or opening a private window shows an empty strip.

**Checklist state is persisted to MongoDB.** When you tick a checklist item, the frontend calls `PUT /notice-api/notice/:id/checklist` immediately. Your progress is saved on the server and survives a page refresh or a new browser session as long as you navigate to the same notice URL.

**The Render backend has a cold-start delay.** Render's free tier spins down after 15 minutes of inactivity. The Processing screen copy ("This usually takes 5–15 seconds") is accurate for a warm backend. A cold start takes around 30 seconds. Open the Render URL in a browser tab a minute before any live demo to wake the service.
