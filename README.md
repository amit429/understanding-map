# Understanding Map

A Claude Code plugin that shows which parts of your repository no human understands well enough to explain, debug or safely change, and turns them back into understood code through 5-minute learning sessions.

## Why

Agents now write a large share of the code in many repositories, and it gets merged faster than anyone can understand it. That gap is **comprehension debt**. Git blame no longer measures it: when an agent commits under your name, you look like the expert on code you may never have read.

Understanding Map does two things together:

1. **Map.** It ranks the zones of your repository (groups of files, by default one per directory) by how little they are understood and how much damage they could do: Dark, Fading, Fragile, Owned or Unknown.
2. **Teach.** A short session walks you through one zone and asks a few questions about it. Pass, and the map updates.

A third piece stops new debt piling up: after an agent makes a large change, a one-line, non-blocking nudge offers a 60-second handoff check.

The map is computed by a deterministic scanner from git history, the plugin's own records and the code structure. It makes **no LLM calls**. Claude tokens are spent only when you run a learning session or handoff check, and only on one zone at a time.

## Install

Requirements: Node 18 or later, and git. The engine ships prebuilt in `dist/umap.js`, so there is no install step.

To try it locally:

```sh
claude --plugin-dir /path/to/understanding-map
```

Marketplace installation will follow.

## Commands

| Command | What it does |
|---|---|
| `/understanding-map:setup` | Choose solo or team mode and, optionally, which paths are critical. Also runs on first use. |
| `/understanding-map:map` | Scans the repository, prints a summary and the top 10 danger zones, and writes `.understanding/report.html`. |
| `/understanding-map:learn [zone or path]` | A 5-minute session: a tour of the zone, then 2–3 questions you answer in your own words. Defaults to the top danger zone. |
| `/understanding-map:handoff` | A 60-second check on what agents changed since your last check. Always skippable. |
| `/understanding-map:who <path>` | Who understands the zone containing this path, with the evidence, or "nobody". |

Every question is checked against the code by a separate answer-key checker before you see it. If fewer than two questions can be confirmed, you get the tour only, nothing is recorded, and the map marks the zone "hard to verify".

## Solo and team

Everything lives in `.understanding/` at the repository root.

- **Solo:** all of `.understanding/` is ignored by git and stays on your machine.
- **Team:** you commit `.understanding/config.json`, `.understanding/.gitignore`, `.understanding/events/` (passes only) and `.understanding/agent-share/` (anonymous per-zone totals) with your normal commits. Setup adds `merge=union` rules to `.gitattributes` so these append-only files merge cleanly. Everyone runs the same commands; a lead on the default branch sees everything that has been merged.

The plugin **never makes commits** and never writes to git.

## Privacy

- **No surveillance.** No leaderboards and no per-person scores across the team. You can see *who understands a zone* (the bus-factor view), never *who failed*.
- **Failed attempts are never shared.** Shared files hold only passed sessions and handoff checks. Partial and missed attempts, the agent-edit log and flags stay in `.understanding/local/`, which is always ignored by git.
- **Agent-written share is never pinned on a person.** It is shared only as anonymous zone totals (zone, line count and ISO week, with no author, commit id or exact time), written under a random machine id that is not derived from your identity. The plugin never shows how much of a given person's code agents wrote.
- **No emails in shared files.** People appear by handle (the part of the email before the @, or a name set in config).
- **No network by default.** The map, the hooks and the HTML report make no network calls. The one exception is the optional PR review signal below, which is off unless you turn it on.
- **No nagging.** Hooks never block and never force a quiz. The handoff nudge stays silent below 50 changed lines (`handoff.minLines`) and can be turned off with `handoff.enabled: false` in `.understanding/config.json`.

## Optional: PR review signal

Substantive pull request review comments can count as a small raise in understanding. This is **off by default**. To turn it on, add `"githubReviews": true` to `.understanding/config.json`. It needs the GitHub CLI (`gh`) installed and authenticated; set `UMAP_NO_GH=1` to switch it off for one run.

When it is on, `/understanding-map:map` uses `gh` to fetch the review comments of the last 50 merged pull requests of the repository's GitHub remote (within a 20-second budget) and caches the counts for 24 hours in `.understanding/local/`. Comments shorter than 20 characters and approvals without comments count for nothing. The other commands only read that cache.

Reviewers appear by GitHub login, so a review counts only when the login belongs to someone in the history: either their lowercased login equals their handle, or you map it in config. The `handles` setting maps both emails and GitHub logins to handles:

```json
{ "githubReviews": true, "handles": { "priya@corp.io": "priya", "priya-gh": "priya" } }
```

## Scores are estimates

Every level and state is an **estimate** from git history, agent-edit records and sessions, and is always shown with its evidence, for example "82% of lines written by agents; last human edit 7 months ago; nobody has passed a session here". Zones without enough evidence show as **Unknown**, not Dark. Treat the map as a starting point for a conversation, not a verdict.
