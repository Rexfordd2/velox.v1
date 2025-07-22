# Velox Fitness App

Velox is a cutting-edge fitness application that combines AI-powered form analysis with social features to help users perfect their workout technique and connect with fellow fitness enthusiasts.

## 🚀 Current Status

The MVP is feature complete with all core tabs functional, including:
- AI-powered exercise form analysis
- Real-time pose detection and feedback
- Social feed for sharing workouts
- Progress tracking
- Leaderboard system
- Music sync capabilities

## 🛠️ Technology Stack

### Frontend
- React Native (Mobile App)
- Next.js (Web App)
- TypeScript
- TailwindCSS
- tRPC for type-safe APIs

### Backend
- Node.js
- Supabase (Database & Auth)
- Python (AI Services)
- TensorFlow (Pose Detection)

### DevOps
- Docker
- Vercel (Deployment)
- GitHub Actions (CI/CD)

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker
- Supabase CLI

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/velox-fitness-app.git
cd velox-fitness-app
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install web app dependencies
cd apps/web
npm install

# Install mobile app dependencies
cd ../mobile
npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp .env.example .env
```

4. Start the development servers:

```bash
# Start web app
npm run dev:web

# Start mobile app
npm run dev:mobile

# Start AI services
docker-compose -f docker-compose.ai.yml up
```

## 🎯 Current Features

### Exercise Form Analysis
- Real-time pose detection
- Form quality scoring
- Personalized feedback
- Support for multiple exercises:
  - Deadlift
  - Bench Press
  - Barbell Row
  - And more...

### Social Features
- Activity feed
- Workout sharing
- Progress tracking
- Community leaderboard

### Music Integration
- BPM-based workout playlists
- Music sync capabilities
- Spotify integration

## 🐛 Known Issues

1. Form analysis occasionally has false positives in low-light conditions
2. Music sync may have latency on older devices
3. Real-time pose detection is CPU intensive

## 📝 Next Steps

1. Performance optimization for mobile devices
2. Enhanced error handling for edge cases
3. Expanded exercise library
4. Advanced analytics dashboard
5. Group workout features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Support

For support or collaboration inquiries, please open an issue in the repository. 