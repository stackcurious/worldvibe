# WorldVibe

A global emotional check-in platform. Users submit one anonymous check-in daily, and we visualize the world's mood in real-time.

## Features
- **Privacy-first**: ephemeral tokens, region hashing, no personal identifiers.
- **Real-time**: streaming data with Kafka + Flink or WebSockets.
- **Scalable**: built on Next.js, containerized via Docker/K8s, infrastructure managed by Terraform.
- **Engaging**: daily streaks, mood cards, ambient UI changes, contextual ads.

## Quick Start

### Option 1: SQLite (Simplest)

This setup uses SQLite which requires no additional services:

```bash
# Install dependencies
npm install

# Start the app with SQLite
npm run dev:sqlite
```

This setup automatically:
- Creates a SQLite database in `prisma/dev.db`
- Seeds the database with sample data
- Starts the Next.js development server

### Option 2: Full Database Setup

```bash
# Install dependencies
npm install

# Start with database setup and seeding
npm run dev:seed
```

For more startup options, see [STARTUP.md](STARTUP.md).

## Documentation

- **Database**: Detailed information in [DATABASE.md](docs/DATABASE.md)
- **Setup Guide**: Complete setup instructions in [STARTUP.md](STARTUP.md)
- **Database Implementation**: Implementation details in [DATABASE_SETUP.md](DATABASE_SETUP.md)

## Production
- Build: \`npm run build\`
- Start: \`npm run start\`
- Containerization: see \`Dockerfile\` or \`docker-compose.yml\`
- K8s: check \`infrastructure/kubernetes\`
- Terraform: check \`infrastructure/terraform\`

## Contributing
Pull requests welcome. Ensure lint/test pass before merging.

## License
[MIT](LICENSE)
