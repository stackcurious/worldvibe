#!/bin/bash

################################################################################
# create-root-files.sh
# 
# Creates/overwrites root files in the current directory:
#   Dockerfile, docker-compose.yml, next.config.js, tailwind.config.js,
#   package.json, README.md, tsconfig.json
################################################################################

################################################################################
# Dockerfile
################################################################################
cat << 'EODOCKER' > Dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
EODOCKER

################################################################################
# docker-compose.yml
################################################################################
cat << 'EODC' > docker-compose.yml
version: "3.9"
services:
  worldvibe:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://user:pass@db:5432/worldvibe"
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: worldvibe
    ports:
      - "5432:5432"
EODC

################################################################################
# next.config.js
################################################################################
cat << 'EONEXT' > next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
EONEXT

################################################################################
# tailwind.config.js
################################################################################
cat << 'EOTAILWIND' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOTAILWIND

################################################################################
# package.json (excerpt)
################################################################################
cat << 'EOPKG' > package.json
{
  "name": "worldvibe",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "jest",
    "test:integration": "jest --config jest.config.js --testPathPattern=tests/integration",
    "test:e2e": "cypress run"
  },
  "dependencies": {
    // Insert your production dependencies here
    // e.g.: "next": "latest", "react": "latest", "react-dom": "latest"
  },
  "devDependencies": {
    // Insert your dev dependencies here
    // e.g.: "@types/react": "latest", "@types/node": "latest"
  }
}
EOPKG

################################################################################
# README.md
################################################################################
cat << 'EOREAD' > README.md
# WorldVibe

A global emotional check-in platform. Users submit one anonymous check-in daily, and we visualize the world's mood in real-time.

## Features
- **Privacy-first**: ephemeral tokens, region hashing, no personal identifiers.
- **Real-time**: streaming data with Kafka + Flink or WebSockets.
- **Scalable**: built on Next.js, containerized via Docker/K8s, infrastructure managed by Terraform.
- **Engaging**: daily streaks, mood cards, ambient UI changes, contextual ads.

## Development

1. **Install**: \`npm install\`
2. **DB Setup**: \`npx prisma migrate dev\`
3. **Run**: \`npm run dev\`
4. **Test**: \`npm run test\`

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
EOREAD

################################################################################
# tsconfig.json (excerpt)
################################################################################
cat << 'EOTS' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOTS

echo "Root files created/overwritten. Run './create-root-files.sh' to recreate any time."
