# ManageMe — Phase 2 (Core Software Development)

Objective: Build a cross-platform full-stack MVP demonstrating the core task management features and the premium "Manager" AI mock, using Firebase for Auth and Firestore for storage. The app should work with mock data and not require external paid AI keys for demo flows.

Tech stack (Phase 2):
- Frontend: React (Create React App or Vite)
- Backend: Node.js proxy (optional) for security and integration tests — can be stubbed; for this phase Firebase Functions are optional.
- Database: Firestore (per-user collections)
- Authentication: Firebase Authentication (email/password)

Project deliverables:
- React app scaffolded with routing and two UI modes: Simple (default) and Advanced.
- Firebase integration: auth and Firestore CRUD for tasks.
- Task management UI: add/edit/delete, complete toggle, due date picker.
- Calendar view displaying tasks by day.
- 'The Manager' chat mock with text input and mock microphone that returns hardcoded replies for demo flows.
- Premium paywall and placeholders for advanced notifications and phone call features.

Acceptance criteria (minimum):
- Users can sign up and log in with email/password.
- After login, users can create tasks stored in Firestore under their user document.
- Tasks display in list and calendar views; completed toggle updates Firestore.
- 'The Manager' chat returns a friendly hardcoded response to any input and the mock microphone simulates a single transcription.
- Premium paywall shows and blocks premium features with clear messaging.

Sprint plan (suggested):
- Week 1: Project setup, Firebase project, auth implementation (T1-01, T1-02).
- Week 2: Firestore schema and core task CRUD (T1-03, T1-04).
- Week 3: Dashboard UI and Simple/Advanced toggle (T1-05, T1-06).
- Week 4: AI mock window, paywall, hardware placeholders, polish (T1-07, T1-08, T1-09).

Dev notes:
- Provide a `sample_db_seed.json` under `/assets/seeds/` to facilitate QA without requiring live accounts.
- Keep Firebase config in environment variables and provide `.env.example` (do not commit secrets.)
- For quick demos, use Firestore emulator locally or supply a test project config with rules allowing read/write for development.

Commands / Quickstart (dev):
```powershell
# from repo root
cd frontend
npm install
npm run dev
# set REACT_APP_FIREBASE_API_KEY etc in .env
```

Testing / QA:
- Provide a QA checklist including signup/login, add task, edit task, complete task, calendar navigation, and premium paywall gating.

