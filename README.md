# Understanding Map

**Find the code nobody on your team understands any more, and learn it back in five minutes at a time.**

A Claude Code plugin for the age of AI-written code. It maps which parts of your repository no human could confidently explain, debug or change. It ranks them by how much damage they could do, and turns them back into understood code through short, verified learning sessions.

Example `/understanding-map:map` output (illustrative):

```
Understanding Map — 44 zones (solo mode)
Owned 3 · Fading 6 · Dark 31 · Unknown 4

Where understanding matters most:
 1. lib/router — Dark · 33 files import it · 6 fixes in the last 90 days
 2. lib/reply  — Dark · 28 files import it · 8 fixes in the last 90 days
 3. lib/hooks  — Fading · 45 files import it · 7 fixes in the last 90 days
 …
Report: .understanding/report.html
Next: /understanding-map:learn
```

## Why

Agents now write much of the code that gets merged, often faster than anyone reads it. The gap between the code you have and the code anyone understands is **comprehension debt**. Git blame no longer measures it: when an agent commits under your name, you look like the expert on code you may never have read.

Understanding Map works in a loop: **see the map → learn a zone → the map updates.**

---

## Install

**Requirements:** Claude Code, Node.js 18+, git. The engine ships prebuilt, so there is nothing else to install.

In Claude Code:

```
/plugin marketplace add amit429/understanding-map
/plugin install understanding-map@understanding-map
```

Or from a terminal:

```bash
claude plugin marketplace add amit429/understanding-map
```

```bash
claude plugin install understanding-map@understanding-map
```

To try a local checkout without installing:

```bash
claude --plugin-dir /path/to/understanding-map
```

## Quick start (2 minutes)

Open Claude Code inside any git repository and run:

| Step | Command | What happens |
|---|---|---|
| 1 | `/understanding-map:setup` | Choose **solo** (private, nothing shared) or **team** (share progress through git), and optionally name your critical paths. |
| 2 | `/understanding-map:map` | Scans git history and the code, then prints the top 10 danger zones and writes `.understanding/report.html`. Open it in a browser for the treemap. |
| 3 | `/understanding-map:learn` | A 5-minute session on the most dangerous zone: a short tour, then 2–3 questions you answer in your own words. Pass, and the zone turns from Dark to Owned. |

After that, keep working as usual. When an agent changes 50+ lines, you'll see a one-line nudge:

```
Agents changed ~180 lines in 3 zones since your last check. Run /understanding-map:handoff for a 60-second check.
```

It never blocks and is always skippable.

## Commands

| Command | Use it to |
|---|---|
| `/understanding-map:setup` | Pick solo or team mode and critical paths. Re-run any time to switch. |
| `/understanding-map:map` | See the map, the danger ranking and the HTML report. |
| `/understanding-map:learn [zone or path]` | Run a 5-minute learning session. With no argument it picks the top danger zone; `/understanding-map:learn src/payments` targets one. |
| `/understanding-map:handoff` | Run a 60-second check on what agents changed since your last check. |
| `/understanding-map:who <path>` | See who understands the zone containing a file, and the evidence. |
| `/understanding-map:visualize [zone or path]` | Watch a short animation of one zone: what it does for the product, then how it works inside, every step tied to a real `file:line`. |

You can also just ask, for example "which parts of this repo does nobody understand?" or "teach me the auth code". The matching skill loads on its own.

## Reading the map

Each **zone** is a group of files, by default one folder. Very large folders are split into numbered chunks such as `lib#1`, and tiny folders merge into their parent.

| State | Meaning |
|---|---|
| 🟢 **Owned** | At least one active person (2+ in team mode) understands it, at level 60 or above. |
| 🟠 **Fragile** | Exactly one person understands it. Team mode only: this is your bus-factor risk. |
| 🟡 **Fading** | Someone understood it once, but time or changes have worn that down. |
| 🔴 **Dark** | Nobody understands it, usually because agents wrote it or the people who knew it have left. |
| ⚪ **Unknown** | Not enough evidence either way. This is not a bad sign. |

The **danger rank** combines how dark a zone is with how critical it is: how many files import it, how often it changes, how many recent fixes touched it, its size, and whether you tagged it critical.

**Every level is an estimate, shown with its evidence**, for example "about 80% of this zone was written by agents; last human edit 7 months ago". Treat the map as a place to start a conversation, not a verdict. The report has a "How estimates work" section with the exact weights.

## How learning sessions stay honest

- **Grounded:** the tour and questions come only from the code, with `file:line` references.
- **Verified:** a separate read-only checker agent re-derives every answer key from the source before you see the question. If fewer than two questions can be confirmed, you get the tour only and the zone is marked "hard to verify". The plugin never quizzes you on something it can't back up.
- **Fair:** each answer is graded pass, partial or miss with an explanation. Two or more passes and no misses counts as a pass. A partial never lowers your level.
- **Low pressure:** stop at any time and nothing is recorded.

## Solo and team mode

Everything lives in `.understanding/` at the root of your repo.

**Solo:** all of `.understanding/` is ignored by git and never leaves your machine.

**Team:** commit these with your normal commits; the plugin itself never commits:

```
.understanding/config.json
.understanding/.gitignore
.understanding/events/        ← passed sessions only
.understanding/agent-share/   ← anonymous per-zone totals
```

Setup adds `merge=union` rules to `.gitattributes`, so these append-only files merge without conflicts. Anyone on the default branch sees the merged team view: which zones only one person understands, which nobody does, and who to ask.

## Privacy

- **No surveillance.** No leaderboards, and no list of who failed. You can see *who understands a zone*, never *who failed* one.
- **Failed attempts never leave your machine.** Only passes are shared.
- **AI use is never pinned on a person.** Agent-written code is shared only as anonymous zone totals (zone, line count, ISO week), with no author, no commit and no time, under a random machine id.
- **No emails in shared files.** People appear by handle, the part of the email before the @.
- **No network by default.** The map, the hooks and the report make no network calls. The optional GitHub review signal is off unless you turn it on.
- **No AI calls for the map.** It's computed deterministically from git and your code. Claude tokens are spent only on learning sessions and handoff checks.

## Configuration

`.understanding/config.json`. Every key is optional.

```jsonc
{
  "mode": "solo",                         // or "team"
  "critical": ["src/payments/**"],        // tagged critical, ranks higher
  "exclude": ["generated/**"],            // extra paths to ignore
  "zones": { "billing": ["src/billing/**", "lib/stripe*.ts"] },  // custom zones
  "threshold": 60,                        // level counted as "understands"
  "fadingFloor": 30,                      // below this, Dark rather than Fading
  "activeDays": 90,                       // team: inactive after this many days
  "halfLifeDays": 180,                    // understanding halves over this many days
  "historyDays": 730,                     // how much git history to read
  "handoff": { "enabled": true, "minLines": 50 },
  "handles": { "priya@corp.io": "priya", "priya-gh": "priya" },
  "githubReviews": false                  // opt-in PR review signal (needs gh)
}
```

**Optional PR review signal.** Set `"githubReviews": true` and have the GitHub CLI (`gh`) logged in. `map` then counts substantive review comments (20+ characters) from the last 50 merged PRs as a small raise in understanding, within a 20-second budget, cached for 24 hours. A reviewer counts only if their GitHub login matches a known handle or is mapped in `handles`. `UMAP_NO_GH=1` turns it off for one run.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Understanding Map needs a git repository" | Run it inside a git repo with at least one commit. |
| "No tracked files yet" | Commit some code, then run `map` again. |
| Everything shows Dark | That's expected on code you didn't write. In solo mode the map measures *your* understanding. Run `/understanding-map:learn`. |
| No handoff nudge | Run `setup` first. The nudge appears only after 50+ agent-changed lines (`handoff.minLines`). |
| Hooks do nothing | Make sure `node` (18+) is on your PATH. The hooks stay silent without it. |
| Zone names like `lib#2` | The folder was larger than 3,000 lines and was split. Name it with `zones` in config. |

## How it works

The plugin has two halves:

- **A deterministic engine.** About 2,600 lines of TypeScript bundled into `dist/umap.js`. It does the git analysis, zoning, scoring and storage, and makes no model calls.
- **Model-driven playbooks.** Five skills and one checker agent handle explaining, asking and grading.

Two hooks record agent edits and show the handoff nudge. For a full walkthrough of how a Claude Code plugin is put together, using this one as the example, read **[docs/how-it-works.md](docs/how-it-works.md)**. The design spec is in [docs/specs/](docs/specs/).

## Development

```bash
npm install
```

```bash
npm test
```

```bash
npm run build
```

```bash
claude plugin validate .
```

Run `npm run build` after changing `src/`, and commit the rebuilt `dist/umap.js`. The opt-in performance test (`UMAP_E2E=1 npm test`) clones fastify and checks that `map` finishes under 2 minutes; it takes about 0.2 s.

## License

[MIT](LICENSE)
