# The portable layer

SlapMania is a game, but several of its systems are deliberately written to know
nothing about slapping. This file is the contract: what is portable, what is
not, and exactly what porting costs.

The rule everywhere below is the same — **a portable module takes plain data
through a named seam and never imports the game.** Where a module must touch
SlapMania, that code is isolated into a named adapter of a few lines, so the
port is "write a new adapter", not "edit the module".

---

## Layer map

| Layer | File | Portable? | Depends on |
|---|---|---|---|
| Spatial navigation | `js/navigate.js` | **Yes** | nothing |
| Actor locomotion | `js/actor.js` | **Yes** | nothing |
| Offline film renderer | `tools/cinema.js` | **Yes** | three.js only |
| Soundtrack synthesis | `tools/score.js` | **Yes** | WebAudio only |
| Frame sink | `tools/framesink.py` | **Yes** | nothing |
| Character rigs | `js/player.js`, `js/opponent.js` | No | game |
| World construction | `js/scene.js` | Partly (data-driven themes) | three.js, game |
| Physics world | `js/ragdoll.js` | Partly | cannon-es |
| Rules / state machine | `js/main.js` | **No — the monolith** | everything |

---

## The three contracts

### 1. Navigation — `createNav(source)`

```js
createNav({
  statics: () => [ {kind:'box', x, z, ry, hx, hz} | {kind:'cyl', x, z, r} ],
  actors:  () => [ {x, z, r?} ],
  bounds:  { minX, maxX, minZ, maxZ },
  actorRadius: 0.3,
})
```

Returns `{ rebuild, obstacles, resolve, moveAndSlide, steer, clear }`. Everything
is 2D in XZ: characters are discs, the world is discs and rotated boxes.

Any engine that can describe its map that way gets collision, move-and-slide and
obstacle-avoiding steering for free. `adaptStage()` at the bottom of the file is
the SlapMania binding — six lines.

**Known limit:** this is *local* avoidance. It handles a fairground (actors
walking between scattered destinations) comfortably — measured 14 actors,
28 waypoints in 30s, never overlapping. It degrades on pathological symmetric
cases (12 actors crossing through one point simultaneously: 4 of 12 complete,
still with zero overlaps). Corridors that can trap an actor, or genuine crowd
crush, want a navmesh and RVO — add them behind this same `steer()` signature.

### 2. Actors — `createActor(rig, opts)` / `createCast()`

```js
rig = {
  place(x, z, heading),   // required
  walk(t, amt),           // optional stride cycle
  stand(),                // optional
}
```

An actor is anything that occupies ground and can be told to go somewhere.
Ships with three adapters: `playerRig` (SlapMania's Player), `objectRig` (any
three.js Object3D), `dataRig` (no renderer at all — used for headless tests).

The important seam is `cast.blockers`: feed it to `createNav({actors})` and every
actor steers around every other actor without any of them knowing the others
exist. That one wiring is what turns a walk cycle into a crowd.

### 3. Film rendering — `createCinema(host)`

```js
createCinema({
  renderer, scene, camera,        // any three.js trio
  step(events, seconds, onStep),  // drive the sim; onStep(simMs, i) per frame
  setup(shot),                    // optional per-shot staging
  sink: 'http://127.0.0.1:8998',
})
```

Owns camera placement, frame capture, overlay compositing, slow-motion windows,
contact-sheet probes and a resumable shot driver. A storyboard is then just data
plus camera functions — see `tools/movie.js` (trailer) and `tools/vlog.js`
(walk-and-talk) sharing one renderer.

---

## Porting checklist

To take this stack to another project:

1. Copy `js/navigate.js`, `js/actor.js`, `tools/cinema.js`, `tools/score.js`,
   `tools/framesink.py`. **Do not edit them.**
2. Write a nav source: how does your world describe its collision? (boxes and
   circles on a plane — usually a few lines over an existing collider list)
3. Write rig adapters for anything that walks.
4. Write a cinema host: your renderer trio plus a `step()` that advances your
   sim deterministically with rendering suppressed.

That is the whole cost. Steps 2–4 are each under ten lines in this project.

---

## What is *not* portable yet, and why

`js/main.js` is ~2,900 lines holding the state machine, camera director, input,
milestones, campaign glue, replay, shop and analytics in one scope. Nothing can
be lifted out of it because everything in it reads module-level singletons —
there is exactly one `player` and one `opponent`.

The extractions that would matter, in order of value:

1. **Camera rig.** `updateCamera()` is a 200-line if/else over game states.
   `cinema.js` already proves the better shape: a shot is `{position fn, look fn,
   lens, blend}`. Promoting that would let gameplay cameras, replays, cutscenes
   and trailers speak one language — and it is the precondition for a roaming
   third-person camera.
2. **Context, not state.** HUD visibility is currently inferred from the match
   state machine, which is why walking around shows "STEP 1: HOLD [S]". Elements
   should declare which context they belong to (`match | roam | cine | replay`).
   `body.cine` and `body.replaycam` are crude versions of this already.
3. **Rules as a module.** Power, grading and the reward ladder are pure functions
   of the chain state and would move out cleanly. That is the seam that makes
   this "an engine plus a game" rather than one program.

## Direction

The hub (walk the fairground between matches) needs 1 and 2, and already has its
locomotion layer. The RPG direction needs 3 as well: at that point a different
game is a different rules module over the same navigation, actors, camera and
film stack.
