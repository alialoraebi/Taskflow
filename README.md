# TaskFlow App

A full-stack task and project management application built with React and Express.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm**
- **MongoDB** (local instance or a cloud provider like MongoDB Atlas)

## Project Structure

```
Taskflow_App/
├── taskflow_backend/    # Express REST API
└── taskflow_frontend/   # React frontend
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Taskflow_App
```

### 2. Set up the backend

```bash
cd taskflow_backend
npm install
```

Create a `.env` file in the `taskflow_backend/` directory:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=27017
DB_NAME=taskflow
DB_USER=
DB_PASSWORD=
USE_SRV=false
JWT_SECRET=your_jwt_secret_here
CORS_ORIGINS=http://localhost:3000
```

> If you are using MongoDB Atlas, set `USE_SRV=true` and fill in `DB_HOST`, `DB_USER`, and `DB_PASSWORD` accordingly.

Start the backend server:

```bash
npm start
```

The API will be available at `http://localhost:8080`.

### 3. Set up the frontend

Open a new terminal:

```bash
cd taskflow_frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

## Available Scripts

### Backend (`taskflow_backend/`)

| Command         | Description                |
| --------------- | -------------------------- |
| `npm start`     | Start the server           |
| `npm run dev`   | Start with nodemon (live reload) |
| `npm test`      | Run tests with Jest        |

### Frontend (`taskflow_frontend/`)

| Command         | Description                |
| --------------- | -------------------------- |
| `npm start`     | Start the dev server       |
| `npm run build` | Create a production build  |
| `npm test`      | Run tests                  |

## API Endpoints

| Route              | Description       |
| ------------------ | ----------------- |
| `/api/users`       | User management   |
| `/api/projects`    | Project CRUD      |
| `/api/tasks`       | Task CRUD         |
| `/api/holidays`    | Holiday lookup    |
| `/health`          | Health check      |
