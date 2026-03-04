# Knowledge Graph Management Workbench

Web application with a **React** frontend and **FastAPI** Python backend.

## Project structure

```
kgm/
├── UI/                 # React frontend (modularized)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page-level components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── src/                # Python FastAPI backend
│   ├── main.py         # App entry point
│   ├── api/            # API routes
│   └── ...
├── resources/          # Config and static resources
│   └── config/
│       └── app.yaml
├── requirements.txt
└── README.md
```

## Setup

### Backend (Python)

1. Create a virtual environment (recommended):

   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate  # macOS/Linux
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the API server:

   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API: http://localhost:8000  
   Docs: http://localhost:8000/docs

### Frontend (React)

1. From the project root:

   ```bash
   cd UI
   npm install
   npm run dev
   ```

   App: http://localhost:5173

The Vite dev server proxies `/api` to the backend, so the UI can call the API without CORS issues.

## How to run

Use two terminals: one for the backend, one for the frontend.

**Terminal 1 — Backend**

```bash
cd C:\Users\brahm\dev\kgm
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- API docs: http://localhost:8000/docs  

**Terminal 2 — Frontend**

```bash
cd C:\Users\brahm\dev\kgm\UI
npm run dev
```

- App: http://localhost:5173  

Start the backend first, then the frontend. The UI will proxy `/api` requests to the backend.

## Workflow (3 steps)

1. **Step 1 – Upload files**: Upload a data file (CSV or Excel) and an ontology file. Click *Upload and continue to mapping*.
2. **Step 2 – Map columns**: The app calls the Google Gemini LLM to suggest a mapping from each column to the ontology (entity, property, or object property). You can edit the table and click *Save mapping*, then *Continue to Step 3*.
3. **Step 3 – Generate**: The server generates Python code and an intermediate mapping to translate your data into the ontology.

**Gemini API key**: Set the `GEMINI_API_KEY` environment variable before running the backend (e.g. get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)). Without it, Step 2 suggestion will fail.

## Development

- **UI**: Add components under `UI/src/components/`, pages under `UI/src/pages/`, and register routes in `App.jsx`.
- **Backend**: Add routes under `src/api/` and include them in `src/main.py`. Use `resources/config/` for configuration.
