# Glance Money - The Simplest Expense Tracker

A mobile-first Progressive Web Application built with Next.js 16, designed to be the simplest expense tracker in the world with visual financial status indicators.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive design
- ⚡ **PWA Ready**: Install as a native app with offline capabilities
- 🎨 **Dynamic Theming**: Visual financial status with green/red theming
- 🌐 **Internationalization**: Support for Thai and English languages
- 📊 **Real-time Sync**: Data synchronization across all devices
- 🎯 **Goal Tracking**: Set and track financial goals with progress visualization

## Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with mobile-first responsive design
- **UI Components**: Shadcn UI with Radix UI primitives
- **Icons**: Lucide React
- **PWA**: Custom service worker with manifest
- **Database**: Supabase PostgreSQL (to be configured)
- **Authentication**: Supabase Auth (to be configured)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── layout/            # Layout components
│   ├── dashboard/         # Dashboard components
│   ├── transactions/      # Transaction management
│   ├── goals/             # Goals management
│   └── settings/          # Settings components
└── lib/
    ├── types/             # TypeScript type definitions
    ├── hooks/             # Custom React hooks
    ├── utils/             # Utility functions
    └── constants.ts       # Application constants
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## PWA Features

The application includes:
- Web App Manifest (`/manifest.json`)
- Service Worker (`/sw.js`) for offline caching
- Mobile-optimized viewport settings
- Apple Web App meta tags
- Installable on mobile devices

## Mobile-First Design

The application uses Tailwind CSS with mobile-first responsive design:
- Base styles target mobile (320px+)
- `md:` prefix for tablet/desktop (768px+)
- `lg:` prefix for large desktop (1024px+)
- Minimum 44px touch targets for accessibility

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Component Development

All UI components are built using Shadcn UI and follow the mobile-first design principles. Components are organized by feature area and include proper TypeScript types.

## License

MIT License - see LICENSE file for details