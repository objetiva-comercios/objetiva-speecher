#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/Android/Sdk/platform-tools:$PATH"

cd ~/proyectos/objetiva-speecher/mobile-app && \
  npm run build && \
  npx cap sync android && \
  cd android && \
  ./gradlew assembleDebug && \
  cd .. && \
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk
