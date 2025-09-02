# CITS5206 2025S2 Group 1 Capstone Project

This is the repository for our UWA CITS5206 Capstone Project.

## Team Members

| PERSON_ID | SURNAME     | GIVEN_NAMES         |
| --------- | ----------- | ------------------- |
| 24260355  | Fington     | Christina           |
| 24301655  | Shen        | Zhaodong            |
| 24076678  | Dai         | Wei                 |
| 24261923  | Thomas      | Dani                |
| 24117655  | Shen        | Siqi                |
| 24297797  | Kanakaratne | Gayathri Kasunthika |
| 24004729  | Rawat       | Manas               |

## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Rockruff/CITS5206-2025S2-Group-1.git
cd CITS5206-2025S2-Group-1
```

### 2. Install Dependencies

This is a monorepo managed by **npm**. You’ll need to have [Node.js](https://nodejs.org) installed and run the following command — even if you're not working on the frontend — as it performs critical initialization tasks such as:

- Setting up Git hooks (e.g., auto-formatting code on commit)
- Installing dependencies for both frontend and backend

```bash
# Please make sure you are at the root of the repository
npm install
```

### 3. Start the Backend Server

```bash
cd backend

# Activate the Python virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows (PowerShell):
# .\.venv\Scripts\Activate.ps1
# On Windows (cmd.exe):
# .\.venv\Scripts\activate.bat

# TODO: Add instructions for starting the backend server after scaffolding
```

### 4. Start the Frontend Server

```bash
cd frontend
npm run dev
```
