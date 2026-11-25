# skillet-rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/wisnugeraha/skillet-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/wisnugeraha/skillet-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Skillet Rush is an original short-order diner cooking game: timed tickets pin to
the order rail, ingredients come off the counter, the knife meter on the prep
block and the golden window on the flat-top decide quality, and the plate at
the service pass pays out. Lunch rushes double the score. Pure static files —
canvas 2D, ES modules, WebAudio-synthesized foley, no build step, no network.

## Play

```sh
node serve.ts        # or any static server over game/
# open game/index.html in a desktop browser
# click an ingredient, then its station; SPACE strikes the knife / lifts the pan
# in the golden window; ENTER serves the plate at the pass.
```

## Hand-in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` + `game/styles.css` — page shell
- `game/src/config.js` — tuning, ingredient table, recipe book
- `game/src/art.js` — all painting (kitchen, food, tickets, pans)
- `game/src/audio.js` — WebAudio foley, synthesized
- `game/src/orders.js` — order book, rush scheduling, plate matching
- `game/src/stations.js` — prep block knife meter and flat-top pan timing
- `game/src/hud.js` — status strip, plate, serve button, score popups
- `game/src/main.js` — world, input, frame loop, shot stages
- `main.ts` + `vendor/makefun-game.ts` — hand-in program and the kit dossier library

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137) with hermes-agent.</sub>
