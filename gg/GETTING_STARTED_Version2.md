# Getting Started with the Premium Ecosystem

This document provides a summary of the project's architecture and a guide to getting started with development.

## Project Overview

This is a large and complex project that consists of a premium ecosystem of 5 enterprise applications:

*   **FlowDistributor:** An enterprise system for managing financial data.
*   **ShadowPrime:** A crypto wallet application.
*   **Apollo:** A GPS and drone control application.
*   **Synapse:** a conversational AI platform.
*   **Nexus:** A centralized control center for monitoring and analytics.

The project is built with a modern and sophisticated technology stack.

### Key Technologies

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **State Management:** Zustand, Immer
*   **Data Fetching:** TanStack React Query
*   **Routing:** React Router
*   **UI:** Radix UI, Heroicons, Recharts, Lucide React
*   **Backend:** Firebase (Firestore, Auth, Storage)
*   **AI/ML:** OpenAI, Anthropic, Google Gemini, Deepgram
*   **Testing:** Vitest (unit), Playwright (E2E), Lighthouse (performance)
*   **CI/CD:** GitHub Actions, Vercel, Firebase Hosting
*   **Containerization:** Docker, Docker Compose

## Getting Started

To get the project up and running, please follow these steps:

### 1. Install Dependencies

This project uses `npm` for package management. To install the dependencies, run the following command in your terminal:

```bash
npm install
```

**Note:** Due to limitations in the current environment, I was unable to run this command for you.

### 2. Configure Environment Variables

The project requires a large number of API keys and other secrets to be configured as environment variables.

1.  A file named `.env` has been created for you in the root of the project.
2.  This file contains a list of all the required environment variables.
3.  You will need to replace the placeholder values with your actual credentials.

**IMPORTANT:** Never commit the `.env` file to version control.

### 3. Run the Application in Development Mode

The project is set up to run in a Docker container for development. The `docker-compose.yml` file defines the development environment.

To start the development server, run the following command:

```bash
docker-compose up app
```

This will start the frontend application on `http://localhost:3001`. The application will automatically reload when you make changes to the source code.

### 4. Run the Tests

The project has a comprehensive test suite.

*   **Unit Tests:** To run the unit tests, use the following command:

    ```bash
    npm run test
    ```

*   **End-to-End (E2E) Tests:** To run the E2E tests, use the following command:

    ```bash
    npm run test:e2e
    ```

### 5. Run Health Checks

The project includes a number of health check scripts to verify the status of the Firebase services.

To run all health checks, use the following command:

```bash
npm run health:all
```

## Key Scripts

The `package.json` file contains a large number of scripts for various tasks. Here are some of the most important ones:

*   `dev`: Starts the development server.
*   `build`: Builds the application for production.
*   `test`: Runs the unit tests.
*   `test:e2e`: Runs the end-to-end tests.
*   `lint`: Lints the codebase.
*   `format`: Formats the codebase with Prettier.
*   `deploy`: Deploys the application to Firebase Hosting.
*   `docker:up`: Starts all the services defined in `docker-compose.yml`.
*   `docker:down`: Stops all the services.

## Docker Compose Profiles

The `docker-compose.yml` file uses profiles to manage different sets of services.

*   **`app` (default):** Runs the main application for development.
*   **`test`:** Runs the testing services.
*   **`production`:** Runs the production services (Nginx).
*   **`monitoring`:** Runs the optional monitoring services (Prometheus and Grafana).

To run a specific profile, use the `--profile` flag with the `docker-compose` command. For example, to run the testing services, use the following command:

```bash
docker-compose --profile test up
```

I hope this guide helps you get started with the project. Please let me know if you have any questions.
