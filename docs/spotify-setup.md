# Spotify Integration Setup

This guide will help you set up Spotify integration for the Velox Game Mode feature.

## 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app details:
   - App name: "Velox Fitness"
   - App description: "AI-powered fitness app with rhythm-based workouts"
   - Website: (optional)
5. Accept the Terms of Service

## 2. Configure Your App

1. In your app dashboard, click "Edit Settings"
2. Add Redirect URIs:
   - For local development: `http://localhost:3000/auth/spotify/callback`
   - For production: `https://yourdomain.com/auth/spotify/callback`
3. Save the settings

### Required Scopes

Grant the following Spotify scopes to enable playback control and user profile access:

- `user-read-playback-state`
- `user-modify-playback-state`
- `user-read-currently-playing`
- `streaming`
- `app-remote-control`
- `user-read-email`
- `user-read-private`

## 3. Get Your Credentials

1. In your app dashboard, you'll see:
   - **Client ID**: Copy this value
   - **Client Secret**: You won't need this for the implicit grant flow

## 4. Configure Environment Variables

Add these to your `frontend/.env.local` file:

```env
# Spotify Integration
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
```

For production, update the redirect URI accordingly.

## 5. How the Game Mode Works

1. **Connect Spotify**: Users authenticate with their Spotify account
2. **Select Exercise**: Choose which exercise to perform
3. **Choose Music**: 
   - See currently playing track
   - Browse recommended workout tracks based on optimal BPM for the exercise
4. **Play Game**: 
   - 5-second countdown synced to the beat
   - Visual beat indicators help maintain rhythm
5. **Record Exercise**: Perform the exercise to the beat
6. **Get Score**: Combined score based on:
   - Form accuracy (from AI analysis)
   - Rhythm accuracy (how well you matched the BPM)

## Recommended BPM by Exercise

- **Squats**: 120 BPM
- **Deadlifts**: 100 BPM
- **Bench Press**: 110 BPM
- **Shoulder Press**: 115 BPM
- **Rows**: 125 BPM
- **Bicep Curls**: 130 BPM

## Troubleshooting

### "Not authenticated with Spotify"
- Make sure you've connected your Spotify account
- Token may have expired - reconnect Spotify

### No tracks showing up
- Ensure Spotify is playing or has recent history
- Check that the app has proper permissions

### Authentication redirect not working
- Verify the redirect URI matches exactly in both Spotify app settings and environment variables
- Include the protocol (http:// or https://)

## Privacy & Permissions

The app requests these Spotify permissions:
- Read currently playing track
- Read playback state
- Control playback (play, pause, seek, volume)
- Streaming via Web Playback SDK
- Access user email and profile

No data is stored permanently - only used for the current game session. 