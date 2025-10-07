# CITS5206 2025S2 Group 1 Capstone Project

This is the repository for our UWA CITS5206 Capstone Project.

## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Rockruff/CITS5206-2025S2-Group-1.git
cd CITS5206-2025S2-Group-1
```

### 2. Install Dependencies

This is a monorepo managed by **npm** which will install all the dependencies for you. First, you'll have to go to the following link and download [Node.js](https://nodejs.org). Install it in your system, restart your device and run the following command — even if you're not working on the frontend — as it performs critical initialization tasks such as:

- Setting up Git hooks (e.g., auto-formatting code on commit) - this formats any written code to a standard style to ensure uniformity.
- Installing dependencies for both frontend and backend

```bash
# Please make sure you are at the root of the repository
npm install
```

The above code will take some time to run and install all the dependencies. Once completed, move on to the following steps.

### 3. Start the Backend Server

```bash
cd backend
npm run server
```

If you encounter database issues (for example, during the first setup or after changing your Django models), you can reset and rebuild the database:

```bash
# (Optional) Delete existing database and migrations
npm run db:clean

# Recreate migrations and apply them
npm run db:migrate
```

### 4. Start the Frontend Server

Navigate to the root repository and then choose the frontend folder and run the server.

```bash
cd frontend
npm run dev
```

Follow the link displayed in the terminal to access the frontend server.

## Team Members

(Ordered by Student Number)

| Student Number | Surname     | Given Name          |
| -------------- | ----------- | ------------------- |
| 24004729       | Rawat       | Manas               |
| 24076678       | Dai         | Wei                 |
| 24117655       | Shen        | Siqi                |
| 24260355       | Fington     | Christina           |
| 24261923       | Thomas      | Dani                |
| 24297797       | Kanakaratne | Gayathri Kasunthika |
| 24301655       | Shen        | Zhaodong            |
