feature: stage-nudge
origin: http://127.0.0.1:4174
entry: roster Ava, then letter P meet → choose → listen
viewport: 1280x800
pin: rsabc-shell-v39-mute-dots (no bump)
NUDGES: Not quite! | Try again! | Almost! | Keep going!

Failing (before fix, SW still had v34 captions)
- Choose miss Letter I. Bubble "Try another one!". Clip lucy-nudge-3.mp3 (Almost!).
- Listen miss "Not this sound". Bubble "Not that one — try another orb!". Clip lucy-nudge-1.mp3 (Not quite!).

Passing (after stage.js edit, Grown-Ups Device Get update, Reload to finish)
- Choose miss Letter A. Bubble "Almost!". Clip lucy-nudge-3.mp3. match true.
- Listen miss "Not this sound". Bubble "Not quite!". Clip lucy-nudge-1.mp3. match true.

Re-verify 2026-09-13 (working tree still uncommitted, SW already on this edit)
- Origin http://127.0.0.1:4174 doctor OK. Pin rsabc-shell-v39-mute-dots.
- Smoke reset=1&classroom=1&kid=k01&play=P. classroom=0 still lands on Who is playing? because roster is first.
- Choose miss Letter I. Bubble "Try again!". Clip lucy-nudge-2.mp3. match true. Not "Try another one!".
- Listen miss "Not this sound". Bubble "Try again!". Clip lucy-nudge-2.mp3. match true. Not "Not that one — try another orb!".
- Proof 05-choose-try-again.png / .aria.yml, 06-listen-try-again.png / .aria.yml.
