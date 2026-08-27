# GoalTree — Build Instructions

## Technology Stack

- **Framework:** React Native (Expo SDK 54)
- **Navigation:** Expo Router (tab-based)
- **Language:** TypeScript
- **Local Storage:** AsyncStorage (offline, no backend)
- **Fonts:** Inter (Google Fonts via expo-google-fonts)
- **Icons:** Lucide React Native
- **Charts/Visualization:** react-native-svg

## Project Structure

```
goaltree/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout (providers + fonts)
│   ├── +not-found.tsx            # 404 screen
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Goals list (home)
│   │   ├── today.tsx             # Today screen
│   │   ├── progress.tsx          # Progress/stats screen
│   │   └── settings.tsx          # Settings screen
│   ├── goal/[id].tsx             # Goal tree screen
│   └── node/[id].tsx             # Node details screen
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── EmptyState.tsx
│   │   ├── GoalCard.tsx
│   │   ├── NodeForm.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TreeNode.tsx
│   ├── data/                     # Data layer
│   │   ├── categories.ts
│   │   ├── sampleData.ts
│   │   ├── storage.ts            # AsyncStorage persistence
│   │   ├── store.tsx             # React Context store
│   │   ├── treeLogic.ts          # Recursive tree + progress logic
│   │   └── types.ts
│   ├── theme/
│   │   └── ThemeContext.tsx      # Light/dark theme
│   └── utils/
│       └── date.ts               # Date formatting helpers
├── hooks/
│   └── useFrameworkReady.ts
├── assets/images/
├── app.json
├── package.json
└── tsconfig.json
```

## Building the APK

### Prerequisites

1. Install [Node.js](https://nodejs.org/) (v18 or later)
2. Install the Expo CLI: `npm install -g eas-cli`
3. Create a free Expo account at https://expo.dev

### Option A: Build APK with EAS (Recommended)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Log in to Expo:
   ```bash
   eas login
   ```

3. Configure EAS (first time only):
   ```bash
   eas build:configure
   ```

4. Build the APK:
   ```bash
   eas build --platform android --profile preview
   ```

   If you don't have a `eas.json` yet, create one in the project root:

   ```json
   {
     "cli": {
       "version": ">= 3.0.0"
     },
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

5. **Where the APK is generated:** EAS builds in the cloud. When the build finishes, the terminal will display a download URL. The APK file will be available at that URL (e.g., `https://expo.dev/artifacts/eas/.../goaltree.apk`).

### Option B: Build APK locally with Expo

1. Install dependencies:
   ```bash
   npm install
   ```

2. Prebuild native Android project:
   ```bash
   npx expo prebuild --platform android
   ```

3. Build the APK from the `android` directory:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Where the APK is generated:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## Installing the APK on Android

1. Transfer the `.apk` file to your Android device (via USB, email, or cloud storage).
2. On your device, open **Settings > Security** and enable **"Install unknown apps"** for your file manager or browser.
3. Open the `.apk` file using your file manager.
4. Tap **Install** when prompted.
5. Once installed, open **GoalTree** from your app drawer.

## Running in Development

```bash
npm install
npm run dev
```

This starts the Expo dev server. Scan the QR code with the Expo Go app (available on Google Play) to run the app on your physical device, or press `a` to open it in an Android emulator.

## Features

- Create goals and break them into milestones, tasks, and subtasks
- Arbitrary nesting depth (not limited to 4 levels)
- Automatic progress propagation up the tree
- Expand/collapse tree branches
- Today screen with overdue, due-today, and in-progress tasks
- Progress statistics with streak tracking
- Search across all nodes
- Filter by All, Active, Completed, Overdue, Due today
- Export/import data as JSON
- Light/dark/system theme
- Works fully offline — no account, no backend, no internet required
