# MPT Therapist Chatbot

## Overview

MPT Therapist is an AI-powered chatbot designed to assist psychologists practicing Meta-Personal Therapy (MPT). The application provides two core modes: conducting therapeutic sessions with guided MPT scripts, and analyzing completed therapy sessions. Built as a full-stack TypeScript application with React frontend and Express backend, it leverages the Cerebras AI API for natural language processing while maintaining therapeutic context through MPT knowledge bases.

## Recent Changes

**December 5, 2025 - Replit Environment Setup (GitHub Import - Complete)**
- Created missing `shared/schema.ts` with all TypeScript types and Zod schemas
- Added `.gitignore` with proper Node.js exclusions  
- Installed all npm dependencies via npm install
- Provisioned PostgreSQL database and pushed schema using Drizzle (`npm run db:push`)
- Configured Vite server with `allowedHosts: true` for Replit proxy compatibility
- Configured workflow "Start application" to run dev server on port 5000 with webview output
- Set up deployment configuration for autoscale deployment target with build and start commands
- Verified frontend loads correctly - UI displays in Russian with MPT Therapist branding
- Application requires `CEREBRAS_API_KEY` secret to be added by user for AI functionality
- Server properly configured to bind to `0.0.0.0:5000` 
- All systems operational and ready for use

**December 5, 2024 - Comprehensive MPT Knowledge Base Integration**
- Added 24 complete MPT scripts from uploaded knowledge base document (база знаний мпт):
  - Session scripts: Скрипт первой сессии, Исследование стратегии, 5 условий запроса, 7 базовых принципов
  - Body/emotion work: Работа с телесными ощущениями, Работа с эмоциями, Исследование телесной блокировки
  - Shadow work: Теневое желание, Светлая тень, Работа с архетипами
  - Fear transformation: Исследование страха, Трансформация страха денег, Богатый человек
  - Belief work: Исследование убеждения, Надо и Хочу, Мотивация эталонного состояния
  - Integration: Ресурсная метапозиция, Интеграция и новые действия, Практики внедрения
  - Trance protocols: Транс "Тайное сокровище", Техника погружения, Исследование сопротивления
  - Additional: О методе МПТ, Помогающие вопросы, Страхи психолога, Привычная идентичность
- Strengthened AI system prompts with strict MPT methodology adherence
- Added explicit rules: ONE question at a time, short responses (2-3 sentences), forbidden actions
- Fixed knowledge base dialog content display when scripts are expanded
- Added auto-focus to chat input after sending messages
- Application fully functional with Russian UI

**December 5, 2024 - Script Management System**
- Added PostgreSQL-backed custom script storage (`custom_scripts` table)
- Created script storage API with CRUD endpoints (`/api/knowledge-base`)
- Scripts distinguished by `isCustom` flag (static vs user-added)
- Chat uses combined static + custom scripts for AI responses
- Knowledge base dialog updated with add/delete functionality for custom scripts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as build tool and development server with HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**UI Component Strategy**
- shadcn/ui component library with Radix UI primitives for accessible, customizable components
- Material Design 3 principles following design guidelines in `design_guidelines.md`
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theme management supporting light/dark modes
- Typography: Inter (primary), Source Serif 4 (secondary for therapeutic content)

**State Management**
- TanStack Query (React Query) for server state management and API caching
- Local storage for session persistence (`session-storage.ts`)
- React Context for theme management
- No global state library - relies on component state and server state

**Key UI Patterns**
- Sidebar navigation with session history
- Chat interface with message threading
- Collapsible knowledge base dialog for MPT scripts
- Empty states for onboarding and guidance
- Responsive design with mobile-first approach

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP server (no WebSocket implementation currently)
- RESTful API design pattern
- Middleware: JSON parsing, URL encoding, custom logging

**API Integration**
- Cerebras AI API for LLM responses using `llama-4-scout-17b-16e-instruct` model
- Custom system prompts for MPT therapeutic context
- Configurable temperature (0.7) and top_p (0.9) parameters
- API key authentication via environment variables

**Knowledge Base System**
- In-memory MPT scripts stored in `mpt-knowledge.ts`
- Structured script format with categories, tags, and content
- System prompts guide AI to follow MPT methodology
- Analysis prompts for session review and feedback

**Data Architecture**
- In-memory storage implementation (`MemStorage` class)
- Interface-based storage pattern (`IStorage`) for future database migration
- Session data stored client-side in localStorage
- User authentication scaffolding (not currently implemented)

### Database Strategy

**Current State**
- PostgreSQL database active via Drizzle ORM
- Custom scripts stored in `custom_scripts` table
- Schema defined in `shared/schema.ts` with users and custom_scripts tables

**Active Schema**
```typescript
- users table: id, username, password
- custom_scripts table: id, title, category, content, tags
- MPTScript interface: id, title, category, content, tags, isCustom
- Session interface: id, title, messages, timestamps, mode, status
- ChatMessage interface: id, role, content, timestamp, scriptReference
```

**Database Configuration**
- Environment variable `DATABASE_URL` required for script persistence
- Drizzle ORM with pg driver for database operations
- Connect-pg-simple available for session storage
- Drizzle Zod integration for runtime validation

### External Dependencies

**AI Services**
- Cerebras AI API (`https://api.cerebras.ai/v1/chat/completions`)
  - Model: llama-3.3-70b (Llama 3.3 70B)
  - Max tokens: 8192
  - Temperature: 0.7, top_p: 0.9
  - Authentication: Bearer token via `CEREBRAS_API_KEY` environment variable

**UI Component Libraries**
- Radix UI primitives (accordion, dialog, dropdown-menu, etc.)
- shadcn/ui component system
- Tailwind CSS for styling
- class-variance-authority for component variants
- embla-carousel-react for carousel functionality

**Development Tools**
- Vite plugins: React, runtime error overlay, Replit integration (cartographer, dev-banner)
- TypeScript for type checking
- esbuild for server bundling
- PostCSS with Autoprefixer

**Frontend Utilities**
- clsx + tailwind-merge for className management
- date-fns for date formatting
- react-hook-form with Zod resolvers for form validation
- nanoid for unique ID generation

**Backend Utilities**
- Express middleware ecosystem
- Drizzle ORM with Zod integration
- UUID generation (crypto.randomUUID)

**Font Dependencies**
- Google Fonts: Inter (400, 500, 600, 700), Source Serif 4 (400, 600, italic)
- Preconnected for performance optimization

**Build & Deployment**
- Custom build script using esbuild and Vite
- Server dependencies bundled (allowlist in `build.ts`)
- Static file serving in production
- Node.js runtime
- Deployment configured for autoscale (stateless frontend)
- Build command: `npm run build`
- Start command: `npm start`

## Setup Instructions

### Required Configuration
1. **CEREBRAS_API_KEY** (required): Add your Cerebras AI API key as a secret for chat functionality
2. **DATABASE_URL** (optional): Already provisioned but not currently used by the application

### Development
- Run `npm run dev` to start the development server on port 5000
- Frontend configured with `allowedHosts: true` for Replit proxy compatibility
- Server binds to `0.0.0.0:5000` for external access

### Production Deployment
- Build: `npm run build` (bundles client with Vite and server with esbuild)
- Start: `npm start` (serves production build)
- Deployment target: autoscale (stateless application)