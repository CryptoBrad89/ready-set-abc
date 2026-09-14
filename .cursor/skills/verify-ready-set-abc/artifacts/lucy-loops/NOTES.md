# Lucy idle loops

Origin `http://127.0.0.1:4174`. Pin `rsabc-shell-v37-lucy-voice`. Smoke `classroom=0&bonus=off`. Viewport 1280×800. SW unregistered before the drive so `lucy.js` on disk loaded.

## Home

`body[data-screen]=home`. Corner Lucy `dataset.idle=blink`. `video.lucy-idle-loop` `currentSrc` `http://127.0.0.1:4174/art/lucy/idle-blink.mp4`, `readyState` 4, `paused` false, 480×502. `.lucy-well.has-loop` true. Photo opacity 0, video opacity 1. Shot `01-home-loop.png` caught the blink mid-close with Lottie sparkles on top.

## Meet

`body[data-screen]=meet`. Pose `teaching`. Same blink file still playing. `has-loop` true.

## Celebrate

`body[data-screen]=celebrate`. Pose `celebrating`. No `<video>` (createLucy skips the loop when the first pose is celebrating). Photo `art/lucy/lucy-celebrate.jpg`, opacity 1. Footer still `rsabc-shell-v37-lucy-voice`. Shot `02-celebrate.png`.

## Home again

After Home tab, a new Lucy remounted `idle-blink.mp4`, `paused` false, `has-loop` true.

## Tail (this pass)

Kling 3.0 std silent, 4.5 credits. Job `a97c6d6a-71c1-46b4-a65e-a4c3b9001e34`. Vendored `app/art/lucy/idle-tail.mp4` (116KB). `IDLE_LOOPS` is `['tail', 'wave', 'blink']`. SHELL count 96.

4174 died mid-drive. Relunched and `verify-rsabc doctor` OK on pid 62431. Home first paint `dataset.idle=tail`. `currentSrc` `http://127.0.0.1:4174/art/lucy/idle-tail.mp4`, `readyState` 4, `paused` false. Photo opacity 0, video opacity 1. Shot `03-home-tail.png`.
