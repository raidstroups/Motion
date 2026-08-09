# Motion Studio

AI-powered video post-production platform.

## Overview

Motion Studio is a professional web-based video post-production system that uses AI agents to perform complex video editing tasks. The system preserves the original video and only modifies the specific regions/frames requested by the user.

## Architecture

```
┌──────────────────────────────────────────────┐
│                 NEXT.JS APP                  │
│              (Editor / UI)                   │
└──────────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────┐
│               API / CONTROL                  │
└──────────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────┐
│              DIRECTOR AGENT                  │
└──────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
┌───────────┐  ┌───────────┐  ┌───────────┐
│  VIDEO    │  │  AUDIO    │  │  VFX      │
│ ANALYZER  │  │ ANALYZER  │  │  AGENT    │
└───────────┘  └───────────┘  └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ↓
┌──────────────────────────────────────────────┐
│            MEDIA PROCESSING                  │
│              (Workers)                       │
└──────────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────┐
│              RENDER ENGINE                   │
└──────────────────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────┐
│               QA AGENT                       │
└──────────────────────────────────────────────┘
```

## Features

- **Natural Language Interface**: Describe what you want to change in plain English
- **Intelligent Analysis**: AI analyzes video content to understand scenes, objects, and audio
- **Non-Destructive Editing**: Original footage is preserved; only specified regions are modified
- **Temporal Consistency**: VFX operations maintain consistency across frames
- **Real-Time Preview**: See changes before final render
- **Professional Quality**: Output meets broadcast standards

## Tech Stack

### Frontend
- Next.js 15+ with App Router
- React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)
- TanStack Query (data fetching)

### Backend
- Next.js API Routes
- Vercel AI SDK
- Prisma (database ORM)
- Supabase (PostgreSQL)

### AI Agents
- Director Agent (orchestration)
- Video Analyzer Agent
- VFX Agent
- Color Agent
- Audio Agent
- QA Agent

### Media Processing
- FFmpeg
- Fluent-ffmpeg
- BullMQ (job queues)
- Redis

### Workers
- Video Worker
- Audio Worker
- VFX Worker
- Render Worker

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis (for job queues)
- PostgreSQL (via Supabase)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd motion-studio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI (for AI agents)
OPENAI_API_KEY=sk-...

# Storage
STORAGE_BUCKET=motion-assets
```

## Project Structure

```
motion-studio/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages
│       │   ├── api/           # API routes
│       │   ├── page.tsx       # Main editor page
│       │   └── layout.tsx     # Root layout
│       ├── components/        # React components
│       │   ├── VideoPreview.tsx
│       │   ├── Timeline.tsx
│       │   ├── AICommandInput.tsx
│       │   └── ProjectPanel.tsx
│       └── styles/
│           └── globals.css
├── packages/
│   ├── shared/                # Shared types and utilities
│   │   └── src/
│   │       ├── types/        # TypeScript types
│   │       └── utils/        # Utility functions
│   ├── schemas/               # Zod validation schemas
│   ├── database/              # Prisma schema and repositories
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       └── repositories/
│   ├── agents/                # AI agents
│   │   └── src/
│   │       ├── director/
│   │       ├── video-analyzer/
│   │       ├── vfx/
│   │       ├── color/
│   │       ├── audio/
│   │       └── qa/
│   ├── media/                 # Media processing
│   │   └── src/
│   │       ├── video/
│   │       ├── audio/
│   │       ├── proxy/
│   │       └── metadata/
│   ├── storage/               # Object storage
│   └── render/                # Render engine
└── workers/
    ├── video-worker/          # Video processing worker
    ├── audio-worker/          # Audio processing worker
    ├── vfx-worker/            # VFX processing worker
    └── render-worker/         # Render worker
```

## Usage

### Basic Workflow

1. **Upload Video**: Drag and drop or click to upload video files
2. **Describe Changes**: Type natural language instructions in the AI command input
3. **Review Plan**: AI analyzes the video and presents an edit plan
4. **Execute**: Click to execute the planned operations
5. **Preview**: View changes in real-time
6. **Render**: Export the final video

### Example Commands

- "Remove the person standing behind me between 1:20 and 1:35"
- "Brighten my face without affecting the background"
- "Clean up the audio noise in my voice"
- "Add a smooth transition between these two clips"
- "Color grade the footage to look more cinematic"

## Development

### Running Locally

```bash
# Start all services
npm run dev

# Start specific workspace
npm run dev --workspace=@motion/web

# Start workers
npm run dev --workspace=@motion/video-worker
npm run dev --workspace=@motion/audio-worker
npm run dev --workspace=@motion/vfx-worker
npm run dev --workspace=@motion/render-worker
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@motion/web
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
