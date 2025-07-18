# Metaverse Project

A real-time multiplayer 3D metaverse built with React, Babylon.js, and Supabase.

## Features

- 🌍 **3D World**: Interactive 3D environment with Babylon.js
- 👥 **Multiplayer**: Real-time avatar interactions using Supabase
- 💬 **Proximity Chat**: Chat with nearby players
- 🎮 **Mini-games**: Interactive games and activities
- ⚡ **Performance Optimized**: LOD system and performance monitoring
- 📱 **Mobile Friendly**: Responsive design for all devices

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **3D Engine**: Babylon.js
- **Backend**: Supabase (Database, Auth, Real-time)
- **Deployment**: Netlify
- **State Management**: Zustand

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mauricioplanchart/metaverse-project.git
   cd metaverse-project/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## Live Demo

🌐 **Live Site**: https://metaverse-project-client.netlify.app

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── components/          # React components
│   ├── BabylonSceneMultiplayer.tsx  # Main 3D scene
│   ├── Avatar3D.tsx                 # 3D avatar system
│   ├── ProximityChat.tsx            # Chat system
│   └── ...
├── lib/                # Utilities and services
│   ├── supabase.ts     # Supabase client
│   ├── realtimeService.ts  # Real-time features
│   └── ...
└── stores/             # State management
    └── useMetaverseStore.ts
```

## Deployment

The project is automatically deployed to Netlify on every push to the main branch.

**Last Deployment**: 2025-07-16 20:00 UTC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details. 