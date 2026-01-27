# The Sundrop Garden

An immersive artist website featuring tour dates, music, visual galleries, and fan connection forms.

## Features

- **Interactive Globe Map**: D3.js-powered tour date visualization
- **Real Spotify Integration**: Fetch artist profiles and albums from Spotify API
- **AI-Generated Content**: Gemini AI generates poetic tour descriptions
- **Admin Portal**: Manage tour dates with env-based authentication
- **Real-time Updates**: Convex database for live data synchronization
- **Beautiful Design**: Custom "Sundrop" theme with gold, green, and dark tones

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Convex
- **UI**: shadcn/ui components + Tailwind CSS 4
- **Visualizations**: D3.js + TopoJSON
- **APIs**: Spotify Web API, Google Gemini API, YouTube Data API v3
- **Fonts**: Playfair Display (serif), Nunito Sans

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Spotify Developer Account
- Google AI Studio Account (for Gemini AI)
- YouTube Data API v3 Key (for Light page)
- Convex Account

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd the-sun-drop-garden
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables in `.env.local`:
   - Get Spotify credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Get Gemini API key from [Google AI Studio](https://ai.google.dev)
   - Get YouTube API key from [Google Cloud Console](https://console.cloud.google.com/) (enable YouTube Data API v3)
   - Set your admin password for the admin panel
   - (Optional) Set `RESEND_API_KEY` for email forwarding functionality (Resend integration coming soon)

5. Set up Convex:
   ```bash
   npx convex dev
   ```

   This will:
   - Create a new Convex project (if needed)
   - Generate your `NEXT_PUBLIC_CONVEX_URL`
   - Deploy your schema and functions

6. Add the Convex URL to `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

7. Run the development server:
   ```bash
   bun dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── app/
│   ├── api/              # Next.js API routes
│   │   ├── spotify/      # Spotify API endpoints
│   │   ├── gemini/       # Gemini AI endpoints
│   │   └── youtube/      # YouTube Data API endpoints
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Main application
├── components/
│   ├── AdminPanel.tsx    # Tour administration
│   ├── TourMap.tsx       # D3.js globe visualization
│   ├── ConvexClientProvider.tsx
│   └── ui/               # shadcn components
├── convex/
│   ├── schema.ts         # Database schema
│   ├── tourDates.ts      # Tour CRUD operations
│   └── forms.ts          # Form submissions
└── lib/
    ├── types.ts          # TypeScript types
    └── utils.ts          # Utility functions
```

## Configuration

### Spotify API

1. Create an app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Copy the Client ID and Client Secret
3. Add them to `.env.local`

The default artist is "((( O )))" with ID `7ky8m0sLXzkLqR7wsjfC6P`. To change this, modify the `artistId` parameter in `/app/api/spotify/artist/route.ts` and `/app/api/spotify/albums/route.ts`.

### Gemini AI

1. Get an API key from [Google AI Studio](https://ai.google.dev)
2. Add it to `.env.local` as `GEMINI_API_KEY`

### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Add it to `.env.local` as `YOUTUBE_API_KEY`

The Light page displays the latest videos and subscriber count from the `@TheSundropGarden` YouTube channel.

### Admin Access

The admin panel is protected by a simple password check. Set `NEXT_PRIVATE_ADMIN_SECRET` in `.env.local` to your desired password.

### Email Forwarding (Resend)

To enable email forwarding for form inquiries, set `RESEND_API_KEY` in `.env.local` with your Resend API key. The admin panel's Connect tab allows you to configure forwarding email addresses. Resend integration will be implemented in a future update.

## Usage

### Accessing Views

- **HOME**: Landing page with album promotion
- **TOUR**: Interactive tour dates with globe visualization
- **LIGHT**: YouTube channel display with latest videos and subscriber count
- **SOUND**: Spotify artist profile and albums
- **CONNECT**: Email list signup and inquiry forms
- **ADMIN**: Tour management (password protected)

### Managing Tour Dates

1. Navigate to the ADMIN view
2. Enter your admin password (from `NEXT_PRIVATE_ADMIN_SECRET`)
3. Use the city search to find locations
4. Click "Generate Description with AI" to create poetic tour descriptions
5. Submit to add the tour date

## Code Quality

This project uses **Ultracite** for code quality enforcement:

```bash
# Check code
bun x ultracite check

# Fix issues
bun x ultracite fix
```

## License

MIT
