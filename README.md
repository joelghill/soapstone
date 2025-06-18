# SOAPSTONE
A location based messaging app based on the social mechanics in the popular Dark Souls games.

This initial version is a proof of concept built on the [Quick start guide to building applications on AT Protocol](https://atproto.com/guides/applications).

### Planned Features:
- Signin via OAuth
- REST API for client applications
- Custom lexicon for message and location data

## Getting Started

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

### Running the App

```
git clone https://https://github.com/joelghill/soapstone.git
cd soapstone
cp .env.template .env
npm install
npm run dev
# Navigate to http://localhost:8080
```

## Tech Stack
  - Typescript
  - NodeJS web server (express)
  - SQLite database (Kysely)
  - Server-side rendering (uhtml)
