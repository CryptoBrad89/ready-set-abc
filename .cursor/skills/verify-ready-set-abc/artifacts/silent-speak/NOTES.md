feature: silent-speak
entry: leftover 1 celebrate/bonus; leftover 5 remaining clip-less audio.speak
origin: http://127.0.0.1:4174
pin: rsabc-shell-v39-mute-dots
viewport: 1280×800 landscape

## Leftover 1 (celebrate + leftover bonus)

Before (wrapped audio.speak on 4174)
- Payoff Hooray cheer: Nice job! clip cheer-4 → audio/lucy-cheer-4.mp3
- Celebrate 400ms cheer: Woohoo! clip cheer-5 → audio/lucy-cheer-5.mp3
- Celebrate 1100ms: "3 stars! Pp is for Pig." clip null silent true. No Audio()
- Leftover bonus Listen: "Find every Pp! Tap all 3 — big P and little p." clip null silent true
- Leftover bonus Skip leave: "That's alright! Here come your stars, Pp." clip null silent true

After (Grown-Ups Device Set up this device, then same P path)
- Payoff Hooray cheer: Nice job! clip cheer-4 → audio/lucy-cheer-4.mp3
- Celebrate 400ms cheer: You got it! clip cheer-2 → audio/lucy-cheer-2.mp3
- silentStars false. silentCalls []. No "N stars!" speak
- Leftover bonus Listen + Skip: leftoverSpeak []
- Trophy still on screen (Pp is for Peach). Skip live. Next Play Letter S

## Leftover 5 (remaining clip-less audio.speak)

Before (Marcus Home after PLAY unlock, wrap on 4174, `?v=silent-remain`)
- Talk with Lucy: "Hi Marcus! Let's find words that start with P!" clip null silent true
- Say Lucy: "Lucy!" clip null silent true. Bubble still Lucy!
- Roster Lucy paws: "Tap your face. I will wait right here!" clip null silent true
- Tap Marcus: "Hi Marcus!" clip null silent true

After (Device Set up this device → Reload to finish → `?v=silent-remain2` → location.reload so evaluated modules match the cache)
- Talk with Lucy + Say Lucy: speak log []. Bubble Lucy! then hello line. 04-say-lucy-after.png
- Roster paw + Ava: speak log []. Screen went #/home. Ava is playing
- Start letter match → Listen: speak log []. Lucy bubble "Find the little letter!". 05-match-listen-after.png

Direct `audio.speak` without a clip is gone from screens. Mapped speak remains in audio.js (name / phoneme / word / cheer / nudge). lucy.say still speaks when voice is true.

_flow.mjs 6 FAIL then ALL-OK. node _check.mjs ALL-OK.
stage.js choose/listen nudge leftover left uncommitted and unedited.

## Leftover 6 (lucy.say default voice)

Before (Ava case match on 4174, wrap, tap prompt with no card)
- "Pick a card first!" clip null silent true. Bubble Pick a card first!

After (PRECACHE, then `?v=voice-def#/home` so evaluated lucy.js matches cache)
- lucy.say.toString() has `voice = false`
- Same empty prompt tap. Bubble Pick a card first!. Speak log []. 06-pick-first-after.png

_flow.mjs 1 FAIL (`voice = false` default) then ALL-OK. node _check.mjs ALL-OK.
Celebrate paw/treat, pouch wear, trail stray inherit the default. Mapped cheer/nudge/phoneme still go through audio.*.
stage.js leftover left uncommitted and unedited.
