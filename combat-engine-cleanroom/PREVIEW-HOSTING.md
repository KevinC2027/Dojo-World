# Mobile 3D preview — Cloudflare Pages setup (no Replit)

The preview is built as a static WebGL page:
- index.html
- src/engine.mjs

No npm install, build command, or third-party JavaScript hosting is required. The preview imports the clean-room 60 Hz engine from its own sibling module.

## Free hosting, private GitHub repository

1. Sign into Cloudflare and choose **Workers & Pages → Create application → Pages → Connect to Git**.
2. Connect GitHub and grant access to `KevinC2027/Dojo-World` only.
3. Select the repository and choose production branch **cleanroom/mobile-preview-release**.
4. Build command: **leave blank**.
5. Build output directory: **combat-engine-cleanroom**.
6. Start deployment. Cloudflare will assign a `pages.dev` URL. Test in iPhone Safari using that exact URL.

The GitHub repository remains private, but note that a public browser preview necessarily serves client-side JavaScript to its visitors. Do not put secrets in the browser engine.

### Important: avoid free-plan build exhaustion

Cloudflare Pages Free currently provides up to 500 builds per month, less than the approximately 720 hourly commits possible in a 30-day month. Keep automated deployment tied to the release branch, not the hourly development branch. If Cloudflare offers preview branch deploy controls, configure them so pushes to `cleanroom/combat-engine-v1` do not trigger deployments. Promote tested builds from the development branch to the separate release branch at a controlled cadence.

## Visual acceptance criteria

- Blue and Red are visible immediately on first load, or a fallback illustration appears with a concrete error message.
- WebGL draws real 3D volume geometry, not GIF/video.
- Blue and Red move under the clean-room engine's existing collision and hit logic.
- A tap on PALM, STRAIGHT or FRONT KICK takes over Blue; Red remains AI-controlled.
- Arrow movement, guarding, auto-fight, camera drag, and restart respond on touch.
- KO and contact events show without visible health bars.
- The preview does not imply photorealistic animation: these are simple procedural 3D mannequins.

## Verification status

Source and tests are versioned on `cleanroom/combat-engine-v1`. Static browser module tests are included in `test/preview.test.mjs`. Actual mobile Safari acceptance testing and deployment must still be performed against a hosted URL; do not mark those complete before verification.
