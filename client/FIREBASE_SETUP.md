# 🔥 Firebase Setup Guide

This guide will help you set up Firebase for the Babylon.js Metaverse project.

## Prerequisites

- A Google account
- Node.js and npm installed
- The project cloned locally

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "metaverse-project")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Required Services

### Authentication
1. In the Firebase console, go to "Authentication"
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Anonymous" authentication
5. Optionally enable "Email/Password" for registered users

### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select your preferred location
5. Click "Done"

### Realtime Database
1. Go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode"
4. Select your preferred location
5. Click "Done"

### Storage
1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select your location
5. Click "Done"

## 3. Get Your Configuration

1. In the Firebase console, click the gear icon and select "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Enter an app nickname (e.g., "metaverse-client")
5. Check "Also set up Firebase Hosting" if you want hosting
6. Click "Register app"
7. Copy the configuration object

## 4. Configure Environment Variables

1. Create a `.env` file in the `client` directory
2. Add your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# App Configuration
VITE_USE_FIREBASE=true
```

## 5. Security Rules

### Firestore Rules
Go to Firestore > Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat messages are readable by authenticated users
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // World states
    match /worldStates/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Avatar data (public read, owner write)
    match /avatars/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Realtime Database Rules
Go to Realtime Database > Rules and update:

```json
{
  "rules": {
    "avatars": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

### Storage Rules
Go to Storage > Rules and update:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. Test the Setup

1. Start the development server: `npm run dev`
2. Add `?firebase` to the URL or set `VITE_USE_FIREBASE=true`
3. You should see the Firebase version load
4. Click "Sign In Anonymously" to test authentication
5. Try moving around and chatting to test real-time features

## 7. Optional: Firebase Emulator Suite

For local development, you can use Firebase emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init` (select Emulators)
4. Start emulators: `firebase emulators:start`
5. Set `VITE_USE_FIREBASE_PROD=false` in your `.env`

## Features Included

✅ **Authentication**: Anonymous and email/password signin
✅ **Real-time Avatar Positions**: Using Realtime Database
✅ **Chat System**: Using Firestore
✅ **User Presence**: Real-time user status
✅ **World State Persistence**: Save/load world data
✅ **File Uploads**: Avatar customization assets
✅ **Offline Support**: Graceful degradation

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your domain is authorized in Firebase Console > Authentication > Settings > Authorized domains

2. **Permission Denied**: Check your security rules and ensure authentication is working

3. **Environment Variables Not Loading**: Make sure your `.env` file is in the correct location and variables start with `VITE_`

4. **Emulator Connection Issues**: Ensure emulators are running and ports are not blocked

### Getting Help

- Check the browser console for error messages
- Verify Firebase configuration in the app settings
- Test with a simple Firebase connection first
- Check the Firebase Console for service status

## Production Deployment

1. Update security rules for production
2. Set `VITE_USE_FIREBASE_PROD=true`
3. Configure authorized domains
4. Enable proper authentication methods
5. Set up monitoring and analytics

## Next Steps

- Customize avatar appearance system
- Add proximity-based chat
- Implement room/world system
- Add voice chat integration
- Create admin dashboard
- Add performance monitoring