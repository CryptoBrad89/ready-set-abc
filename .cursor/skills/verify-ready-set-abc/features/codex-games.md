# Play with Lucy

Home has three Codex games under **Play with Lucy**. They are not the four-beat letter round, Picnic Day, Rhymes, or Coloring. Grown-Ups stays PIN 1234 on the classroom shell. The games keep their own grown-up gate.

## Sub-features

- `adventures` opens Lucy's little adventures from Home.
- `letter-post` opens Lucy's Letter Post, A to Z, with Air mail, Candy post, and Dark.
- `moonboat` opens Lucy's Moonboat, A to Z, with Dark, Cloud day, and Plum dusk.
- `adventure-links` on the adventure page also open Letter Post and Moonboat.

## How to get to it (user POV)

- On Ava Home, choose **Lucy's little adventures**, **Lucy's Letter Post**, or **Lucy's Moonboat**.
- From the adventure page footer, choose **Lucy’s Letter Post** or **Lucy’s Moonboat**.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` reports `http://127.0.0.1:4173` and shell `rsabc-shell-v46-lucy-clips`.
- Viewport is landscape 1280×800.
- Ava is playing. Navigate to the URL from `verify-rsabc smoke 'reset=1&kid=k01'`.

- **Home.** Heading `Welcome back, Ava!`. Section `Play with Lucy`. Links `Lucy's little adventures`, `Lucy's Letter Post`, and `Lucy's Moonboat`.
- **Adventures.** Choose `Lucy's little adventures`. The page title is `Ready Set ABC · Lucy’s little adventures`. A control named `Let’s play` is on the page. Footer links `Lucy’s Letter Post` and `Lucy’s Moonboat`.
- **Letter Post.** Choose `Lucy's Letter Post`. Heading contains `Letter Post`. A letter control `Play letter S` is on the page. The theme select lists `Air mail`, `Candy post`, and `Dark`.
- **Moonboat.** Choose `Lucy's Moonboat`. Heading contains `Moonboat`. A letter control `Play letter S` is on the page. The theme select lists `Dark`, `Cloud day`, and `Plum dusk`.

## Gotchas

- These pages are full navigations to `play/`. They are not `#/letter` rounds. Do not expect `body[data-screen]=meet`.
- Portrait under 900px wide is still blocked on the classroom shell. Open the games from landscape Home.
- Do not regenerate audio or redraw Lucy while proving this. The clips and portraits are the shipped files.
- The classroom Grown-Ups PIN is still `1234`. The adventure game's own gate starts at `2468`.
