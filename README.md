# AppGatePro — BMX Gate Start Analytics

<div align="center">

![AppGatePro Logo](static/jnspro_logo.png)

**Lab-grade BMX gate start analytics. UCI-compliant timing, 200Hz biomechanical data, and performance insights previously only available to elite teams.**

[![Built with SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-FF3E00?style=flat&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

[Features](#features) • [Getting Started](#getting-started) • [Development](#development) • [Deployment](#deployment)

</div>

---

## 🚀 Overview

AppGatePro by JNS Pro Systems democratizes BMX gate start analytics by providing professional-grade performance data at an accessible price point. The platform offers the same level of biomechanical analysis previously available only in £10,000–£50,000 commercial systems, making it accessible to riders and coaches at every level.

### Key Capabilities

- **UCI-Compliant Timing**: Random delays, 632Hz light sequence, reaction time to ±1ms precision
- **Biomechanical Analytics**: G-force curves, speed integration, impulse analysis, power estimation
- **200Hz IMU Sampling**: High-frequency orientation and motion data capture
- **Real-time Dashboard**: Live data streaming over WiFi with <15ms latency
- **Adaptive UI**: Layered complexity from simple metrics for young riders to full biomechanical breakdowns for elite athletes

---

## ✨ Features

### Performance Analytics
- ⚡ Reaction time measurement (±1ms accuracy)
- 📊 Speed curve from IMU integration
- 🏎️ Peak, average, and end speed tracking
- 💪 Estimated power output (Watts)
- 📈 Impulse & force distribution analysis
- 🎯 Acceleration phase splits (0→10, 0→20… km/h)
- 🎓 Technique scoring (0–100)

### Session Management
- 📅 Unlimited session uploads
- 🔄 Session comparison tools
- 📉 Consistency scoring with coefficient of variation (CV)
- 📊 Statistical trend analysis
- 🏆 UCI age category tracking

### Advanced Features
- 🎡 Pitch & wheelie detection
- 🔍 200Hz orientation data analysis
- 📱 Live dashboard with real-time updates
- 🎚️ Adaptive complexity levels
- 🔮 Future: Sprint & cadence modes, leaderboards, coach multi-rider view

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: SvelteKit 2.57+ with Svelte 5.55+
- **Language**: TypeScript 6.0+
- **Styling**: Tailwind CSS 4.2 with Typography & Forms plugins
- **UI Components**: Flowbite Svelte 1.33+
- **Charts**: Chart.js 4.5+

### Backend & Infrastructure
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Hosting**: Vercel (configured with `@sveltejs/adapter-vercel`)
- **Package Manager**: pnpm (workspace configuration)

### Development Tools
- ESLint 10+ with Svelte plugin
- Prettier 3.8+ (Svelte & Tailwind plugins)
- svelte-check for type safety
- Vite 8.0+ build tooling

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (recommended) or npm/yarn
- **Supabase Account**: For database and authentication
- **Git**: For version control

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/jnspro-analytics.git
cd jnspro-analytics
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your-supabase-project-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Additional environment variables
VITE_API_ENDPOINT=your-api-endpoint
```

> **Note**: Never commit `.env.local` to version control. The file is already included in `.gitignore`.

### 4. Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` (if available)
3. Configure Row Level Security (RLS) policies for your tables

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

---

## 💻 Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Type checking
pnpm check

# Type checking in watch mode
pnpm check:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

### Project Structure

```
jnspro-analytics/
├── src/
│   ├── lib/              # Shared libraries and utilities
│   │   └── supabaseClient.ts
│   ├── routes/           # SvelteKit routes
│   │   ├── (protected)/  # Protected routes (require auth)
│   │   │   └── sessions/
│   │   ├── auth/         # Authentication pages
│   │   ├── +page.svelte  # Landing page
│   │   ├── +layout.svelte
│   │   ├── about/
│   │   ├── contact/
│   │   ├── privacy/
│   │   └── terms/
│   └── app.html          # HTML template
├── static/               # Static assets
│   ├── jnspro_logo.png
│   └── bmx-hero.png
├── supabase/            # Database configuration
├── docs/                # Documentation
├── .env.local           # Environment variables (create this)
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

Run `pnpm format` before committing to ensure consistent code style.

### Adding New Routes

SvelteKit uses file-based routing. Create new routes in `src/routes/`:

```
src/routes/
├── your-route/
│   └── +page.svelte     # Route component
```

Protected routes should be placed in `src/routes/(protected)/`.

---

## 🏗️ Building for Production

### Build the Application

```bash
pnpm build
```

This creates an optimized production build in the `build/` directory.

### Preview Production Build

```bash
pnpm preview
```

---

## 🚢 Deployment

### Vercel (Recommended)

The project is pre-configured for Vercel deployment using `@sveltejs/adapter-vercel`.

#### Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Deploy via Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Configure environment variables
4. Deploy

#### Environment Variables on Vercel

Add these in your Vercel project settings:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Alternative Platforms

To deploy on other platforms, change the adapter in `svelte.config.js`:

```javascript
// For Node.js servers
import adapter from '@sveltejs/adapter-node';

// For static hosting
import adapter from '@sveltejs/adapter-static';

// For Cloudflare Pages
import adapter from '@sveltejs/adapter-cloudflare';
```

See [SvelteKit adapters documentation](https://svelte.dev/docs/kit/adapters) for more options.

---

## 📊 Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with feature showcase |
| `/auth/sign-in` | User authentication |
| `/auth/sign-up` | User registration |
| `/sessions` | Protected: Session management and analytics |
| `/about` | About the platform |
| `/contact` | Contact information |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

---

## 🔒 Authentication

The application uses Supabase Authentication with email/password sign-in. Authentication state is managed via:

- Server-side session handling with `@supabase/ssr`
- Protected routes in `(protected)` route group
- Row Level Security (RLS) policies in Supabase

---

## 🎨 Theming

The application uses a custom dark theme with amber accent colors:

- **Primary Color**: `#f5a623` (Amber)
- **Background**: `#080707` (Near Black)
- **Text**: `#f0ece4` (Off White)
- **Secondary**: `#9a8f7a` (Muted Brown)

Customize colors in the Svelte components' `<style>` sections or add Tailwind custom colors in `tailwind.config.ts`.

---

## 📚 Documentation

Additional documentation can be found in:

- `HCI_EVALUATION.md` - Human-Computer Interaction evaluation
- `PRODUCTION_READY.md` - Production readiness checklist
- `NAVBAR_UPDATE_INSTRUCTIONS.md` - Navbar modification guide
- `THEME_POC_README.md` - Theme proof of concept

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

Use clear, descriptive commit messages:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature suggestion?

1. Check existing [Issues](https://github.com/your-org/jnspro-analytics/issues)
2. Create a new issue with detailed information
3. Use appropriate labels (bug, enhancement, etc.)

---

## 📄 License

This project is proprietary software by **JNS Pro Systems**. All rights reserved.

For licensing inquiries, please contact: [contact@jnsprosystems.com](mailto:contact@jnsprosystems.com)

---

## 🙏 Acknowledgments

- **SvelteKit Team** - Amazing framework
- **Supabase** - Powerful backend platform
- **Tailwind CSS** - Utility-first CSS framework
- **BMX Community** - Inspiration and feedback

---

## 📞 Support

For support, email [support@jnsprosystems.com](mailto:support@jnsprosystems.com) or visit our [contact page](/contact).

---

<div align="center">

**Built with ❤️ by JNS Pro Systems**

Making lab-grade BMX gate start analytics accessible to every rider and coach.

[Website](https://appgatepro.com) • [Twitter](https://twitter.com/jnsprosystems) • [Instagram](https://instagram.com/jnsprosystems)

</div>
