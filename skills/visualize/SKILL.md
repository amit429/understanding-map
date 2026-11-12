---
name: visualize
description: Use when the user wants to see how a part of this repository works as a picture or animation, wants a visual walkthrough of a zone (what it does for the product and how it works inside), or asks to visualise a zone, folder or file after or before a learning session.
argument-hint: "[zone or path]"
---

# Visualise a zone

Build a short 2D animation of one zone from the real code: first one real user action travelling through the product until this zone does its job, then the zone's main steps in order, each tied to a `file:line`. You read the code and write a storyboard; a checker verifies every claim; the engine draws the page. Never write HTML or CSS yourself.

Watching never counts as understanding. **Never record anything**: no `record`, no passes. The only engine writes are the visual files under `.understanding/local/visuals/` and, when the zone is too unclear, the "hard to verify" mark.

The user's argument (may be empty): `$ARGUMENTS`

## Running the engine

Claude Code shows `Base directory for this skill: <path>` when this skill loads. Call that path `<base>` and run every engine command as `node "<base>/../../dist/umap.js" <cmd>` from the user's repository. If no base directory was shown, use `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>` instead.

Always put zone ids and paths in double quotes, because some contain shell characters: for example `context "(root)"`, `visualize "lib#2"`, `--zone "(root)"`.

## 1. Pick the zone

Run `node "<base>/../../dist/umap.js" status --json` and keep its `root` (the repository's absolute path). If it reports `"setUp": false`, ask the setup skill's two questions (`/understanding-map:setup`) and run setup, then continue.

- With an argument: `node "<base>/../../dist/umap.js" context "<argument>" --json`.
- Without one: `node "<base>/../../dist/umap.js" context --json`. It uses the zone of the user's last learning session, then the top danger zone.

If it prints `"zone": null`, show its `why`, say they can name any zone or path, and stop. Otherwise it prints the zone (`id`, `files`, `state`, `reason`, `loc`, `fanIn`), `picked` (`by`, `note`), `inbound` and `outbound` neighbour zones (each with up to 5 `files` and the `imports` lines, with line numbers), `entryHints` and `fingerprint`.

Tell the user in one line which zone and why, using `picked.note` (for example "src/payments — Dark · 14 files import it"). If the note says the path spans several zones, say which zone was picked.

## 2. Reuse an unchanged visual

Unless the user asked for a fresh one ("regenerate", "new", "redo"), run `node "<base>/../../dist/umap.js" visualize "<zone id>" --cached --json`.

- `{"cached": true, "path": …, "rel": …}`: the code has not changed since the last visual. Read the saved storyboard next to it (the same path ending in `.json`, field `storyboard`) for the summary, then go straight to **7. Hand off**.
- `{"cached": false, "reason": …}`: build a new one.

## 3. Read, within bounds

Read the zone's files (the most imported or largest first; skim the rest). Then read only what `context` points to: the importing files in `inbound`, the imported files in `outbound`, and the `entryHints` files, enough to trace one real user action to this zone. Do not search the whole repository. Aim to finish reading in about a minute.

## 4. Write the storyboard

Write a storyboard with this shape (the example is illustrative):

```json
{
  "zone": "src/payments",
  "trigger": { "label": "User clicks Pay", "ref": "web/pages/checkout.tsx:41" },
  "journey": [
    { "label": "checkout page", "zone": "web/pages", "ref": "web/pages/checkout.tsx:41" },
    { "label": "checkout API", "zone": "src/api", "ref": "src/api/checkout.ts:12" },
    { "label": "payments", "zone": "src/payments", "ref": "src/payments/charge.ts:22", "target": true,
      "role": "charges the card, retries on timeout, records the result" },
    { "label": "receipt email", "zone": "src/email", "ref": "src/email/receipt.ts:8" }
  ],
  "outcome": { "label": "Receipt sent" },
  "steps": [
    { "label": "build the charge", "ref": "src/payments/charge.ts:22" },
    { "label": "send to Stripe", "ref": "src/payments/stripe.ts:48" },
    { "label": "retry on timeout", "ref": "src/payments/stripe.ts:61" }
  ],
  "gotcha": { "label": "Refunds of 0 skip the ledger", "ref": "src/payments/ledger.ts:40" }
}
```

Rules the engine enforces (it rejects anything else):

- `zone` is the zone id from `context`. Every `ref` is `path:line`, repository-relative, with a line inside the file, and the file is on the map (tracked and not excluded: never `.env`, `node_modules` or `.understanding/`).
- Labels: plain words, at most 40 characters. `role`: one line, at most 90 characters, only on the target stop.
- `journey`: 2–6 stops in the order the action travels, exactly one with `"target": true` whose `zone` is this zone. Every stop's `zone` is a real zone id (this zone, or one from `inbound` / `outbound`), and its `ref` is a file in that zone.
- `steps`: 3–7, in the order they happen, every `ref` inside this zone's files.
- `gotcha` is optional: the one thing most likely to bite someone changing this code.
- No real product trigger (a library, build tooling, tests)? Set `"trigger": null`; the journey then starts from the most important caller. No callers either? Leave `journey`, `trigger` and `outcome` out: the visual has three scenes.
- Never mention people, understanding levels or how much code agents wrote. The engine rejects `@mentions`, email addresses and anyone's handle.

## 5. Verify every claim with answer-key-checker (mandatory)

Dispatch the `answer-key-checker` subagent (listed as `understanding-map:answer-key-checker`) with the repository root and these **storyboard claims**, one per item, each with an `id`, a `kind`, the claim in one sentence and its `file:line` refs:

- `hop`: one per journey hop, "A calls or leads to B", with both refs (the trigger to the first stop, then each stop to the next).
- `role`: the target's role, with its ref.
- `step`: one per step, "this happens at this ref", with its ref.
- `order`: "the steps happen in this order", with every step ref.
- `outcome`: "the last stop leads to <outcome>", with the last stop's ref (only when there is an outcome).
- `gotcha`: the gotcha, with its ref.

It returns `[{id, confirmed, reason}]`. A claim counts as confirmed only when the checker returns it with an explicit `"confirmed": true`; anything else (a missing id, malformed or non-JSON output, or an error) counts as unconfirmed. Then:

- **Steps and order:** regenerate each unconfirmed step, and the order if it was unconfirmed, **once**, using the checker's reason, and send only the new claims back. If fewer than 3 steps are confirmed after that, or the order is still unconfirmed: there is **no visual**. Tell the user this zone is too unclear to draw yet, run `node "<base>/../../dist/umap.js" unverifiable --zone "<zone id>"`, and stop. Otherwise keep only the confirmed steps.
- **Journey:** regenerate an unconfirmed hop or role **once**. If any hop or the role is still unconfirmed, drop the journey (leave out `journey`, `trigger` and `outcome`) and say so in one line.
- **Outcome:** an unconfirmed outcome is dropped: write the storyboard without `outcome`.
- **Gotcha:** an unconfirmed gotcha is dropped.

Never draw an unconfirmed item.

## 6. Render

Write the verified storyboard with the Write tool to `<root>/.understanding/local/storyboard-draft.json` (an absolute path, using `root` from `status`; it is never committed), then run:

`node "<base>/../../dist/umap.js" visualize "<zone id>" --storyboard "<root>/.understanding/local/storyboard-draft.json" --json`

- Success prints `{"path", "rel", "scenes", "cached": false}`.
- Exit code 2 prints one line naming the field, for example `Invalid storyboard: steps[2].ref: line 90 is past the end of src/pay/charge.ts (61 lines)`. Fix only that field and run it again, **once**. If you change a `ref` or the meaning of an item, send that item back to the checker first. If it fails again, tell the user the visual could not be drawn, show the engine's line, and stop.

## 7. Hand off

Reply with:

1. `Animation ready: <rel> — open it in your browser.`
2. A three-line text summary, so the user gets something even if they never open it:
   - the journey (`trigger → stops → outcome`), or that there is no product journey;
   - what happens inside, the steps in a few words each;
   - the watch-out, or the zone's role when there is no gotcha.
3. One closing line: `To lock it in: /understanding-map:learn <zone id>`.

## Stopping

If the user stops or changes topic, stop there. Nothing is recorded either way.
