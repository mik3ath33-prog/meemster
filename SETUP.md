# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - The `.env.local` file is already created with your InstantDB app ID
   - Verify the `NEXT_PUBLIC_INSTANT_APP_ID` is set correctly

3. Deploy InstantDB schema:
```bash
npx instant-cli@latest login
npx instant-cli@latest push
```

This will deploy your database schema and permissions to InstantDB.

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

Build the app:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Deployment

This Next.js app can be deployed to:
- **Vercel** (recommended): Connect your GitHub repo and deploy automatically
- **Netlify**: Connect your repo and set build command to `npm run build`
- **Any Node.js hosting**: Run `npm run build` and `npm start`

Make sure to set the `NEXT_PUBLIC_INSTANT_APP_ID` environment variable in your hosting platform.

## Features

- **Meme Creation**: Create memes with templates or upload your own images
- **Text Layers**: Add multiple text layers with custom fonts, sizes, and colors
- **Post Memes**: Upload memes to InstantDB Storage and share them
- **Feed**: Browse all memes with real-time updates
- **Upvoting**: Upvote your favorite memes
- **Authentication**: Sign in with magic codes or continue as guest

## Troubleshooting

### Templates not loading
- Ensure `templates.js` is in the `public/` directory
- Check browser console for errors

### InstantDB connection issues
- Verify your app ID in `.env.local`
- Run `npx instant-cli@latest push` to ensure schema is deployed
- Check InstantDB dashboard for connection status

### Image upload fails
- Check InstantDB Storage is enabled for your app
- Verify file size limits (InstantDB has storage limits)
