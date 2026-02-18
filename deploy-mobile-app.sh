  cd ~/proyectos/objetiva/objetiva-speecher && \
    cd mobile-app && \
    npm run build && \
    npx cap sync android && \
    cd android && \
    ./gradlew assembleDebug && \
    cd ../.. && \
    adb install -r mobile-app/android/app/build/outputs/apk/debug/app-debug.apk
