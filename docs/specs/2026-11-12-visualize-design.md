# Visualize: Design

*Understanding Map v0.2 feature, written 2026-11-12. It builds on the v1 spec in [2026-11-12-understanding-map-design.md](2026-11-12-understanding-map-design.md). Section numbers written "v1 §n" refer to that spec.*

## 1. Intent

The v1 learning session is text: a tour, then questions. For many people, words alone are not enough to understand a part of the code they didn't write. They need to **see** what that part does for the product and how it fits into the flow.

`/understanding-map:visualize [zone or path]` builds a short, looping **2D workflow animation** of one zone from the real codebase. It answers two questions, in this order:

1. **What does this do for the product?** One real user action (for example "User clicks Pay") travels through the product. The zone lights up when it does its job. *(Storyboard style A, which the user chose.)*
2. **How does it work inside?** The camera zooms into the zone, and its main steps light up in order, each tied to a real file and line. *(Storyboard style C, which the user chose.)*

It comes **after** `/understanding-map:learn` in the flow. It is for people who finished a session, or who want a picture before trying one, on any zone they don't understand. Watching **never** changes anyone's understanding level. Only passing a learn session does that.

## 2. What the user sees

Running `/understanding-map:visualize`, or `/understanding-map:visualize src/payments`:

1. Claude says which zone it's visualising and why, in one line, using the engine's reason. With no argument it uses the zone of the user's last learn session; failing that, the top danger zone.
2. About 1–2 minutes later Claude replies: `Animation ready: .understanding/local/visuals/src-payments.html — open it in your browser.` It also gives a three-line text summary of the journey and the steps, so the user still gets something if they never open the file.
3. The page plays a 60–90 second, four-scene animation (the storyboard the user approved):

| Scene | Time | Content |
|---|---|---|
| 1 · Why this matters | ~10 s | The zone name, its state badge (Dark / Fading / …), its reason line, and "N files depend on it". |
| 2 · Product journey | ~20–30 s | A row of 3–6 boxes, from a user trigger through the zones it passes to an outcome. A dot carries the action box to box. The target zone glows when the dot reaches it, and a caption under it says the zone's role in one line. |
| 3 · Inside the zone | ~25–40 s | The camera zooms into the target box. 3–7 steps appear and light up in order, each labelled with a short phrase and a `file:line` chip. |
| 4 · Back out and gotcha | ~10 s | Zooms back to the journey row, shows one "watch out" note with its `file:line`, then ends with "Lock it in: /understanding-map:learn <zone>". |

**Player controls:** play/pause, previous/next scene, restart, and 1× / 1.5× speed. The scene captions can be read without playing. The page respects `prefers-reduced-motion`: it shows the scenes as static frames, stepped manually.

**Look:** the same visual language as `report.html`. It uses the same state colours and CSS tokens, light and dark themes, system fonts, and flat 2D boxes, arrows and dots. It loads nothing over the network.

## 3. Goals

1. **True to the code.** Every box, arrow, step and `file:line` comes from the code and is verified before it is drawn (§6). A flow that doesn't exist is never shown.
2. **Opens instantly.** It's one self-contained HTML file: no network, no render step, no new dependencies.
3. **Neat and consistent.** The engine does layout and animation deterministically from a validated storyboard, so every visual looks equally clean. The model never writes HTML or CSS.
4. **Bounded cost.** The model reads one zone and the neighbouring files it needs, and nothing repo-wide. Target: under 2 minutes and well under 100k tokens per visual.
5. **Reused when unchanged.** If the zone's code hasn't changed since the last visual, the saved one is reopened at no cost.

## 4. Non-goals (this version)

- MP4 or GIF export. Planned next, using the installed HyperFrames plugin on the same page; see §11.
- Voice-over, music, 3D, or styles beyond A+C.
- Whole-repository or multi-zone films.
- Editing a visual by hand. Regenerate it instead.
- Animating code that doesn't exist yet, such as PR or diff previews.

## 5. Anti-goals (failure even if it works)

- **Showing a false flow.** That teaches the wrong thing, which is worse than nothing. Unverified items are dropped, never drawn (§6).
- **Treating watching as understanding.** Visualize never writes pass events or raises any level.
- **Breaking the privacy rules (v1 §5).** Visuals contain no people, levels or agent-share figures. They are local files, never committed.
- **Slowness or token burn.** No repo-wide reads, and no regeneration when nothing changed.
- **Model-written HTML.** It drifts in quality and can't be checked. The engine draws everything.

## 6. How it works

The split is the same as the rest of the plugin (see `docs/how-it-works.md`): **the engine owns data, validation, layout and drawing; the model reads code and writes a storyboard; a checker verifies it.**

### 6.1 Context (engine, new command)

`umap.js context "<zone or path>" --json` returns:

- the zone: `id`, `files`, `state`, `reason`, `loc`, `fanIn`;
- **inbound:** up to 8 importing zones. For each: zone id, the importing files (up to 5) and the import lines;
- **outbound:** up to 8 zones this zone imports, with the same detail;
- **entryHints:** files in the inbound chain that look like entry points. These come from path and name heuristics: `routes`, `controllers`, `handlers`, `pages`, `app`, `api`, `cli`, `main`, `index`, `server`, `cmd`, plus framework markers such as `app.get(`, `router.`, `@Controller`, `export default function` in `pages/` or `app/`;
- `fingerprint`: the zone's current file hashes (for caching, §6.5).

It is all deterministic and reuses the v1 import graph (`imports.ts`). This bounds what the model reads.

### 6.2 Storyboard (model, following the visualize skill)

The model reads the zone's files and only the neighbouring files `context` points to. It then writes a storyboard JSON with this schema:

```json
{
  "zone": "src/payments",
  "trigger": { "label": "User clicks Pay", "ref": "web/pages/checkout.tsx:41" },
  "journey": [
    { "label": "checkout page",   "zone": "web/pages",   "ref": "web/pages/checkout.tsx:41" },
    { "label": "checkout API",    "zone": "src/api",     "ref": "src/api/checkout.ts:12" },
    { "label": "payments",        "zone": "src/payments","ref": "src/payments/charge.ts:22", "target": true,
      "role": "charges the card, retries on timeout, records the result" },
    { "label": "receipt email",   "zone": "src/email",   "ref": "src/email/receipt.ts:8" }
  ],
  "outcome": { "label": "Receipt sent" },
  "steps": [
    { "label": "build the charge",   "ref": "src/payments/charge.ts:22" },
    { "label": "send to Stripe",     "ref": "src/payments/stripe.ts:48" },
    { "label": "retry on timeout",   "ref": "src/payments/stripe.ts:61" },
    { "label": "write ledger entry", "ref": "src/payments/ledger.ts:15" }
  ],
  "gotcha": { "label": "Refunds of 0 skip the ledger", "ref": "src/payments/ledger.ts:40" }
}
```

**Limits:**
- labels at most 40 characters, `role` at most 90;
- `journey` has 2–6 stops including exactly one `target: true` whose `zone` is the visualised zone;
- `steps` has 3–7 entries;
- `gotcha` is optional;
- every `ref` is `path:line` inside the repository, and every step `ref` is inside the target zone.

If the zone has no real product trigger (a pure library, build tooling, tests), the model sets `"trigger": null`. The journey then starts from its most-important caller ("called by the router when…"). If there are no callers either, there is no journey: the visual is scenes 1, 3 and 4.

### 6.3 Verify (checker subagent)

The existing `answer-key-checker` agent is generalised. Its prompt gains a second input kind, "storyboard claims". Its tools stay Read, Grep and Glob. The skill sends one claim per item:
- each journey hop as "A calls or leads to B", with both refs;
- the target's role;
- each step's label at its ref, and that the steps happen in that order;
- the gotcha.

The checker returns `[{id, confirmed, reason}]`. As in v1, only an explicit `"confirmed": true` counts.

**Rules:**
- **Steps:** unconfirmed steps are regenerated once. If fewer than 3 steps are confirmed after that, there is **no visual**. Tell the user the zone is too unclear to draw yet, run `unverifiable --zone`, and stop.
- **Journey:** an unconfirmed hop is regenerated once. If the journey still has an unconfirmed hop, the journey scene is dropped (scenes 1, 3, 4 only), and Claude says so in one line.
- **Gotcha:** an unconfirmed gotcha is dropped.
- Unconfirmed items are never drawn.

### 6.4 Render (engine, new command)

`umap.js visualize "<zone>" --storyboard <file.json>`:

1. **Validates** the storyboard against the schema and limits (§6.2). Every `ref` file must exist in the repo and its line must be within the file. Step refs must be inside the zone's files. Any violation means exit 2 with a one-line message naming the field, so the skill can fix it and retry once.
2. **Lays out** the scenes deterministically: fixed slots for 2–6 journey boxes (two rows when the screen is narrow), a vertical step list, and arrow paths between boxes.
3. **Writes** `.understanding/local/visuals/<zone-slug>.html`, a self-contained page. It inlines the CSS and a small player script driving CSS animations and transitions on a timeline, plus the storyboard as escaped JSON. There is no network and no external code, and it renders correctly at desktop and 375 px widths in light and dark themes.
4. **Saves** the verified storyboard next to it as `<zone-slug>.json` with the zone fingerprint and date.
5. **Prints** the path. With `--json` it prints `{path, scenes:[…], cached:false}`.

All text from the storyboard is HTML-escaped. The same injection tests as the report apply (v1 Review Focus 5).

### 6.5 Cache

Before doing anything else, the skill runs `umap.js visualize "<zone>" --cached --json`. If a saved storyboard exists and its fingerprint matches the zone's current files, the engine re-renders it, which is free and instant, and returns `{path, cached:true}`. The skill then just hands over the path. Otherwise it returns `{cached:false, reason}` and the skill builds a new one. If the user asks for a fresh visual ("regenerate"), the cache is skipped.

### 6.6 Hand-off

Claude gives the path, the three-line text summary, and one closing line pointing to `/understanding-map:learn "<zone>"`. Nothing is recorded, apart from writing the local visual files.

## 7. Integration with v1

- **Skills:** a new `skills/visualize/SKILL.md`. Learn's final message gains one optional line: "Want to see it? /understanding-map:visualize <zone>".
- **Report:** the detail panel in `report.html` gains a second copyable command, `/understanding-map:visualize <zone>`. If a cached visual exists for that zone, it also shows a relative link "Open animation" to `local/visuals/<slug>.html`.
- **Storage:** everything goes under `.understanding/local/`, which is already ignored by git in both modes, so it never needs committing and is never shared.
- **README and `docs/how-it-works.md`:** add the command, a screenshot-style description, and a sentence on how it works.
- **Version:** bump the plugin to 0.2.0 in `plugin.json` and `marketplace.json`. Rebuild and commit `dist/umap.js`.

## 8. Constraints

- No new runtime dependencies. The player is hand-written and inlined (on the order of 10 KB). It uses no CDN, no GSAP and no web fonts.
- Node ≥18; works offline; no LLM calls in the engine.
- Every v1 constraint still holds: privacy, hooks, no git writes, estimates labelled as estimates.

## 9. Success

- On a real repository (fastify, or this plugin itself), visualising the top danger zone produces a page that someone new to the code agrees is **accurate and easy to follow** after one watch. Every `file:line` chip in it is real.
- Generation takes under 2 minutes; reopening an unchanged zone takes under 1 second.
- The page looks equally clean for any zone: no overlapping boxes, no truncated labels, both themes, 375 px.

## 9a. Decisions settled after review (my calls)

1. **Layout is testable geometry, not eyeballing.** The renderer computes every box's position and size in code, estimating text width from character count at a fixed font size. Labels wrap to at most two lines and are **never** cut short or shown with "…". The 40-character limit is chosen so any label fits in two lines at the narrowest box width. Unit tests assert no overlaps and no overflow for 2–6 journey boxes and 3–7 steps, at a desktop width (1280 px) and 375 px. No new dev dependencies. During the build, a person also checks screenshots in a real browser.
2. **The cache covers every file the visual depends on.** The fingerprint is the hashes of the zone's files **plus** every file named by any `ref` (trigger, journey, gotcha). A change to any of them means a new visual.
3. **The saved file is just the verified storyboard and its fingerprint.** Scene 1 data (state badge, reason, number of dependent files) is read from the live map at render time, so a zone you just passed shows its new state even on a cached visual.
4. **"The zone of your last learn session"** is a new local file, `.understanding/local/last-learn.json` (`{zone, date}`). `record --kind session` writes it for any result. It is per person, never shared. `context` with no argument uses it, then falls back to the top danger zone, the same way `pick` does.
5. **Journey stops are real zones.** Each stop's `zone` must be a zone id in the current map, and its `ref` file must belong to that zone. Validation therefore builds the map, which is fast. The trigger's `ref` only has to exist. Boxes other than the target are drawn neutral, with no state colour; only the target shows its state.
6. **Import lines with line numbers.** `imports.ts` gains a new export, `importEdges(...)`, that returns resolved edges `{fromFile, line, toFile}`. Existing v1 functions and their tests stay unchanged. A path argument that spans several zones resolves to the zone holding the most files under that path, and Claude says which one it picked.
7. **One slug function.** `visualSlug(zoneId)` lowercases the id, turns every run of characters outside `[a-z0-9]` into `-`, trims dashes, and appends `-` plus the first 6 hex characters of the id's sha1, so `a/b` and `a-b` never collide and `(root)` becomes `root-<hash>`. The report and `visualize` share it. The report shows "Open animation" only when a cached visual exists and its fingerprint is still fresh.
8. **The player handles 3 or 4 scenes.** Without a journey, the controls, timings and scene count adapt. A journey without a product trigger starts with a "called by …" box drawn in the same style. These details are left to the builder.

## 10. Left to the builder

- Exact timings, easing and animation details within the scene table (§2).
- Layout geometry and visual polish, within §2's "Look".
- The exact `entryHints` heuristics list, beyond the minimum in §6.1.
- Wording of the skill's messages.
- Module split inside `src/` (suggested: `context.ts`, `storyboard.ts` for schema and validation, `visual.ts` + `visual-template.ts` for the renderer).

## 11. Next (not this version)

- **MP4/GIF export:** `--video` renders the same page into a shareable video using the HyperFrames plugin when it's installed. It would show a clear message when it isn't, and stay optional because it needs Chrome and ffmpeg.
- Optional narration, and a "whole flow" film across several zones.
