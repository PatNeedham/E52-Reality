# E52 Reality

Welcome to the E52 Reality project! This is a full-stack web application for designing and simulating immersive VR motion experiences.

## Overview

The application consists of the following services:
- **frontend**: A React application serving the user interface.
- **backend**: A Node.js (Express) API for managing data.
- **db**: A PostgreSQL database for data storage.
- **otel-collector**: An OpenTelemetry collector for observability.

## Prerequisites

- Docker & Docker Compose (for containerized deployment)
- Node.js v22+
- npm v11+
- PostgreSQL (for local development)

## Getting Started (with Docker)

1.  **Clone the repository**.

2.  **Environment Variables**:
    Copy the example `.env` files and customize them if needed.
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```

3.  **Build and Run the Application**:
    Use Docker Compose to build and start all the services.
    ```bash
    docker-compose up --build
    ```

4.  **Access the Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8080](http://localhost:8080)

## Local Development (Without Docker)

This approach is recommended for active development.

1.  **Setup Backend**:
    - Navigate to the `backend` directory: `cd backend`
    - Install dependencies: `npm install`
    - Make sure you have a PostgreSQL server running.
    - Create a `.env` file (from `.env.example`) and configure the `DATABASE_URL`.
    - Run the database migrations: `npm run db:init` (You'll need to add this script to package.json)
    - Start the development server: `npm run dev`

2.  **Setup Frontend**:
    - Navigate to the `frontend` directory: `cd frontend`
    - Install dependencies: `npm install`
    - Create a `.env` file (from `.env.example`) if you need to override default settings.
    - Start the development server: `npm start`

3.  **Access the Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8080](http://localhost:8080)


## Application Views

- **3D Course Editor**: The main page where you can design motion paths.
- **Spectator View**: A panel showing the simulated motion system.
- **First-Person View**: A panel showing the FPV from the simulated chair.
- **My Library**: A page to view your saved courses.
- **Course History**: A page to view the version history of a specific course.
- **Discover**: A page to find courses published by other users.

## Observability

The project is instrumented with OpenTelemetry. When running with Docker, the `otel-collector` service receives traces, logs, and metrics and exports them to the console by default. You can view the output by checking the logs of the collector:
```bash
docker-compose logs otel-collector
```

## Code Quality

This project uses ESLint, Prettier, and TypeScript for maintaining code quality and consistency. See [CODE_QUALITY.md](./CODE_QUALITY.md) for detailed information about the setup and available commands.

### Quick Quality Check
```bash
# Run all quality checks
npm run quality:check

# Auto-fix formatting and linting issues
npm run quality:fix
```

### Development Workflow
1. Make your changes
2. Run `npm run quality:fix` to auto-fix any issues
3. Run `npm run quality:check` to verify everything passes
4. Commit and push your changes

The GitHub Actions workflow will automatically run these checks on every pull request.
