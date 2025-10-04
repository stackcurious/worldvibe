# WorldVibe

**Live at: [worldvibe.app](https://worldvibe.app)**

A global emotional check-in platform where users submit one anonymous check-in daily, and we visualize the world's mood in real-time through an interactive 3D globe.

## ✨ Features

- 🔒 **Privacy-First**: Ephemeral tokens, region hashing, no personal identifiers
- 🌍 **Interactive Globe**: Real-time 3D visualization of global emotional data
- 🎨 **Emotion Avatars**: Unique visual representations for each emotional state
- 📊 **Live Analytics**: Real-time dashboard showing global mood trends
- 🔄 **Daily Check-ins**: One anonymous emotional check-in per user, per day
- 🎭 **8 Core Emotions**: Joy, Love, Surprise, Sadness, Fear, Anger, Disgust, Neutral
- 📱 **Responsive Design**: Seamless experience across desktop and mobile
- ⚡ **Real-time Updates**: WebSocket-powered live data streaming

## 🚀 Quick Start

### Development (SQLite - Simplest)

```bash
# Install dependencies
npm install

# Start the app with SQLite
npm run dev:sqlite
```

This automatically creates a SQLite database, seeds sample data, and starts the dev server.

### Production Database (Supabase PostgreSQL)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14.0.3 (App Router)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL (Production), SQLite (Development)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D Visualization**: react-globe.gl, Three.js
- **Analytics**: Vercel Analytics, Google Analytics
- **Deployment**: Vercel
- **Real-time**: WebSockets

## 📁 Project Structure

```
worldvibe/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── checkin/            # Check-in flow
│   │   ├── globe/              # Interactive globe view
│   │   └── about/              # About page
│   ├── components/             # React components
│   │   ├── layout/             # Header, footer, etc.
│   │   ├── ui/                 # Reusable UI components
│   │   ├── visualization/      # Globe, charts, etc.
│   │   └── notifications/      # Toast notifications
│   ├── lib/                    # Core libraries
│   │   ├── db/                 # Database clients
│   │   ├── privacy/            # Privacy utilities
│   │   └── realtime/           # WebSocket handling
│   ├── services/               # Business logic
│   │   ├── check-in-service.ts
│   │   ├── analytics-service.ts
│   │   └── region-service.ts
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── scripts/                    # Utility scripts
└── public/                     # Static assets
```

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Standard Next.js development
npm run dev:sqlite       # Development with SQLite
npm run dev:safe         # Development with DB checks
npm run dev:seed         # Development with DB setup and seeding
```

### Database
```bash
npm run db:setup         # Initialize database with schema
npm run db:check         # Verify database connectivity
npm run db:test          # Test database functionality
```

### Quality Checks
```bash
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run format           # Prettier formatting
npm run test             # Run unit tests
```

### Production
```bash
npm run build            # Production build
npm run start            # Start production server
```

## 🌐 Deployment

The app is deployed on Vercel at [worldvibe.app](https://worldvibe.app).

### Environment Variables (Vercel)

Required:
```env
DATABASE_URL=postgresql://...              # Supabase connection string
NEXT_PUBLIC_APP_URL=https://worldvibe.app  # Production URL
```

Optional:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Google Analytics
```

### Pre-push Hook

Husky pre-push hook automatically runs ESLint and TypeScript checks before pushing to prevent deployment failures:

```bash
# Located in .husky/pre-push
npm run lint
npm run type-check
```

## 📊 Database

### Production: Supabase PostgreSQL
- Session pooler connection on port 5432
- 8 tables: check_ins, analytics, sessions, events, privacy_consents, rate_limits, realtime_stats, base_model
- Automatic connection pooling and health monitoring

### Development: SQLite
- Local file-based database
- Same schema as PostgreSQL for compatibility
- Automatic seeding with sample data

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed database documentation.

## 🎨 Key Features

### Interactive Globe
- 3D Earth visualization using react-globe.gl
- Real-time emotional data points from global check-ins
- Hover interactions showing location and emotion details
- Ambient lighting and atmosphere effects

### Emotion System
- 8 core emotions with unique color schemes and avatars
- Joy (Yellow), Love (Pink), Surprise (Purple), Sadness (Blue)
- Fear (Dark Purple), Anger (Red), Disgust (Green), Neutral (Gray)
- Each emotion has a custom-designed avatar character

### Privacy Architecture
- Device fingerprinting without personal data
- Regional data anonymization (no exact coordinates)
- Automatic data retention policies
- No user accounts or authentication required

### Analytics
- Global emotion distribution
- Real-time check-in counts
- Geographic emotion mapping
- Trend analysis over time

## 🔐 Security

- Content Security Policy (CSP) headers
- X-Frame-Options, X-XSS-Protection
- No personal identifiers stored
- Anonymous check-ins only
- Rate limiting on API endpoints

## 📖 Documentation

- **Setup Guide**: [STARTUP.md](STARTUP.md)
- **Database Guide**: [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Architecture Guide**: [CLAUDE.md](CLAUDE.md)

## 🤝 Contributing

Pull requests welcome! Please ensure:
1. ESLint and TypeScript checks pass
2. Tests are updated/added for new features
3. Follow existing code style and conventions

The pre-push hook will automatically validate your code before pushing.

## 📝 License

[MIT](LICENSE)

---

Built with ❤️ for understanding global emotions
