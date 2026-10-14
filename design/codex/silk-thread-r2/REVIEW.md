# Round 2 review

Four independent vanilla HTML/CSS/JS plates. Open `index.html` for the comparison gallery, or a plate’s `index.html` directly from disk.

- 40 screenshots: every route at 1180×820 and 390×844.
- All screenshot compositions visually inspected as paired tablet/phone contact sheets.
- Automated layout audit: no document overflow, visible control below 60×60px, or primary screen content crossing the bottom navigation.
- File URL browser run: no HTTP requests and no JavaScript errors.
- All four flows checked: no-choice nudge, wrong-picture reset, select then submit success, PIN 1234, editable round size, independent voice switch and Escape to home.
- Reduced-motion check: Lucy’s idle animation disabled, transitions and particle effects removed.
- Videos use Playwright recordVideo on file URLs, then ffmpeg H.264 / yuv420p / faststart.

These are exploration plates. They demonstrate one /s/ picture lesson rather than the production app’s entire letter engine. Tool-reference choices and Stitch inspirations are documented in each plate’s README.
