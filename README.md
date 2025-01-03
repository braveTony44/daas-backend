# PostgresSaas

PostgresSaas is a project that provides a SaaS solution for managing PostgreSQL databases. It includes features for creating, pausing, unpausing, and deleting PostgreSQL containers, as well as retrieving table and column information from the databases.

## Features

- Create PostgreSQL containers
- Pause and unpause PostgreSQL containers
- Delete PostgreSQL containers
- Retrieve table and column information from PostgreSQL databases
- Check PostgreSQL database connection status

## Prerequisites

- Node.js
- Docker
- PostgreSQL

## Project Structure

```
daas-project
├── src
│   ├── index.ts          # Entry point of the application
│   └── config
│       └── database.ts   # Database configuration and connection URL
├── docker-compose.yml     # Docker configuration for services
├── Dockerfile             # Instructions for building the Docker image
├── package.json           # npm configuration and dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/PostgresSaas.git
   cd PostgresSaas
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Build the Docker image:**
   ```
   docker build -t daas-project .
   ```

4. **Run the application with Docker Compose:**
   ```
   docker-compose up
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:4000` to see the application in action.

## Usage Guidelines

- The application exposes a simple API endpoint at `/` that returns a JSON response.
- The PostgreSQL database connection details can be configured in `src/config/database.ts`.

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```
PORT=4000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
MONGO_URI=your_mongodb_connection_string
```

## License

This project is licensed under the MIT License.