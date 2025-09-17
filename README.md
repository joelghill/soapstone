# SOAPSTONE
A location based messaging app based on the social mechanics in the popular Dark Souls games.

This initial version is a proof of concept built on the [Quick start guide to building applications on AT Protocol](https://atproto.com/guides/applications).

### Planned Features:
- Signin via OAuth
- REST API for client applications
- Custom lexicon for message and location data
- PostGIS integration for geospatial features

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher) with PostGIS extension
- Yarn package manager

### Installing Yarn
This project uses [Yarn](https://yarnpkg.com/getting-started/install) as its package manager. If you don't have Yarn installed, you can set it up by following these steps:

1. Install Corepack, an intermediary tool that will let you configure your package manager version on a per-project basis:
```
npm install -g corepack
```
2. Install Yarn
```
yarn install
```

## Running Unit Tests

Tests can be ran with coverage:
```
yarn run jest --coverage
```

## Running with Docker (Recommended)

The easiest way to get started is using Docker Compose, which includes PostgreSQL with PostGIS:

```bash
git clone https://github.com/joelghill/soapstone.git
cd soapstone

# Start the application with Docker
docker-compose up -d

# The app will be available at http://localhost:3000
# PostgreSQL will be available at localhost:5432
# pgAdmin (optional) at http://localhost:5050
```

To stop the application:
```bash
docker-compose down
```

To view logs:
```bash
docker-compose logs -f app
```

## Manual Setup (Alternative)

If you prefer to run without Docker:

### Database Setup
1. Install PostgreSQL and PostGIS:
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgis postgresql-contrib`
   - **macOS**: `brew install postgresql postgis`
   - **Windows**: Download from [PostgreSQL website](https://www.postgresql.org/download/)

2. Create a database:
```sql
createdb soapstone
```

3. Enable PostGIS extension:
```sql
psql soapstone -c "CREATE EXTENSION postgis;"
```

### Running the App

```bash
git clone https://github.com/joelghill/soapstone.git
cd soapstone
cp .env.example .env
# Edit .env with your PostgreSQL connection details
yarn install
yarn migrate  # Run database migrations
yarn dev
# Navigate to http://localhost:3000
```

### Environment Variables
Copy `.env.example` to `.env` and configure the following:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soapstone
DB_USER=postgres
DB_PASSWORD=your_password_here

# Application Configuration
NODE_ENV=development
HOST=localhost
PORT=3000
PUBLIC_URL=http://localhost:3000
COOKIE_SECRET=your_secure_random_string_here
```

### Database Migrations
- `yarn migrate` - Run all pending migrations
- `yarn migrate:rollback` - Rollback the last migration
- `yarn migrate:make <name>` - Create a new migration file
- `yarn db:check` - Check database connection and PostGIS availability

### Docker Commands
- `docker-compose up -d` - Start all services in background
- `docker-compose down` - Stop all services
- `docker-compose logs -f app` - View application logs
- `docker-compose exec postgres psql -U postgres -d soapstone` - Access database directly
- `docker-compose --profile tools up pgadmin` - Start with pgAdmin for database management

## PostGIS Features

This application is ready for location-based features using PostGIS:

```javascript
// Example: Add location data to status updates
await knex.schema.table('status', function(table) {
  table.specificType('location', 'POINT');
  table.index('location', null, 'GIST');
});

// Example: Find nearby statuses
const nearbyStatuses = await knex('status')
  .select('*')
  .whereRaw('ST_DWithin(location, ST_Point(?, ?), ?)', [longitude, latitude, radiusInMeters]);
```

## Tech Stack
  - Typescript
  - NodeJS web server (Express)
  - PostgreSQL database with PostGIS (Knex.js)
  - Server-side rendering (uhtml)
  - AT Protocol integration
  - Docker & Docker Compose
