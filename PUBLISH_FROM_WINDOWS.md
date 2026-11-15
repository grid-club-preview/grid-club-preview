# Grid Club v0.2: publish from Windows, play on iPhone

This **web app** does not require Xcode or a Mac. It is not a native `.ipa` or App Store submission yet. It contains Dot Connect, not Block Slide.

## Fastest test on Windows (no account)

Unzip this folder and double-click `index.html` in Chrome or Edge. Keep `game.js` and `puzzle.js` beside it. This tests gameplay, but Home Screen installation and offline caching require HTTPS hosting.

## Put it online using GitHub Pages (no programming needed)

1. On your Windows laptop, create a free account at https://github.com/ if you don't have one.
2. Use **New repository**, give it a name such as `grid-club-preview`, and set it to **Public**. GitHub Free requires a public repo for Pages. Do **not** add personal/private information: the site and code will be public.
3. Unzip the files in this package. On the repo webpage choose **Add file > Upload files**. Drag the following directly to the **root** of the repository: `index.html`, `game.js`, `puzzle.js`, `manifest.webmanifest`, `sw.js`, `.nojekyll` and the **icons** folder with its three PNGs. (GitHub's web uploader can accept the folder if dragged from Windows File Explorer.) Commit changes. If `.nojekyll` is hidden, it is optional for this basic package.
4. Go to **Settings > Pages > Build and deployment**. Set **Source** to **Deploy from a branch**, then select **main**, **/(root)**, and **Save**.
5. GitHub Pages will provide a URL like `https://YOURUSERNAME.github.io/grid-club-preview/`. It may take several minutes to go live. Open that URL on your iPhone in **Safari**.
6. Use Safari's **Share** menu > **Add to Home Screen**, enable **Open as Web App** (if offered), then **Add**. Launch **Grid Club** from its Home Screen icon.
7. To test offline: launch Grid Club once while online, wait for the page to load fully, then enable Airplane Mode and open the Home Screen icon again. Offline play should work after the initial cache has installed. If not, reconnect and open the site again once; browsers can defer caching.

## Updates

Upload updated files to the same repository. Change the `CACHE` value in `sw.js` each release (e.g. `gridclub-pwa-v0.3`) so the PWA can refresh its offline files. After uploading, load once online; later launches should use the new version.

## Privacy & limits

- GitHub Pages is publicly accessible, even if you share the link only with friends.
- The game currently stores only a daily-complete flag in that browser's local storage. There is no cross-device sync.
- New games, difficulty ratings and Apple App Store packaging remain future work.
- This beta has not been tested in Mobile Safari on an actual iPhone.

## App Store later, still without a Mac

The anticipated route is to add **Capacitor** to the web code, then build/sign an iOS app using a cloud macOS CI provider such as **Codemagic**. You will need an Apple Developer Program membership for signed App Store/TestFlight distribution. Test the signed app with TestFlight on your personal iPhone. Apple may reject apps that merely repackage a website or imitate another game too closely, so add high-quality native-feeling features and distinctive branding before submission.

Official sources:
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Add to iPhone Home Screen: https://support.apple.com/en-gb/guide/iphone/iph42ab2f3a7/ios
- Capacitor iOS setup: https://capacitorjs.com/docs/getting-started/environment-setup
- Apple App Review: https://developer.apple.com/app-store/review/guidelines/
