# Understanding Map: Design

*Claude Code plugin. Design written 2026-11-12.*

## 1. Intent

AI agents now write a large share of the code in many repositories, and teams merge it faster than anyone can understand it. Surveys from 2026 report that about 35% of AI-written code reaches production before the team fully understands it, and that review time has roughly doubled. This gap is called **comprehension debt**. It has a name and it's discussed widely, but no tool measures it. The usual way of measuring who knows what code, git-blame ownership, has broken: when an agent commits under one person's name, that person looks like an expert on code they may never have read.

Understanding Map does two things **together**. Neither is useful on its own:

1. **Map.** It shows which parts of a repository no human understands well enough to explain, debug or safely change. The worst parts are ranked first, by how much damage they could do.
2. **Teach.** It turns those parts back into understood code through short sessions (about 5 minutes) that walk a person through the code and then check that they really understand it. The map updates as people learn.

A third piece stops new debt piling up: a quick handoff check after an agent finishes a large change.

**The core loop:** see the map, learn a zone, the map updates.

## 2. Who it is for

Both of these users are in scope for v1:

- **Solo developer.** Owns a repository that agents largely wrote. Wants to know which parts they'd struggle with if something broke at 2am, and wants to win that understanding back quickly. Zero setup beyond installing the plugin.
- **Tech lead / team.** Wants an honest bus-factor view: which modules only one person understands, which nobody does, and which of those are critical. Team members pay down debt with the same sessions. The lead watches the debt shrink.

*Builder's note:* the solo path is the front door, because a single repo needs no team setup. The team view is the same data shared through git.

## 3. Goals

1. **Free, instant map.** The map is computed by a deterministic scanner from git history, the plugin's own records and the code structure, **with no LLM calls**. First run on a repository of about 100k lines finishes in under 2 minutes.
2. **Honest estimates.** Every score shows its evidence, for example "82% of lines written by agents; last human edit 7 months ago; nobody has passed a session here". Scores are labelled as estimates, never as facts.
3. **Ranked danger zones.** The ranking combines how little a zone is understood with how critical it is.
4. **Five-minute learning sessions.** A tour of the zone, then 3 questions the person answers in their own words. Answer keys are checked against the code before the person sees any question.
5. **Handoff check.** After an agent makes a large change, a non-blocking nudge offers a 60-second check of 2 questions on what just changed.
6. **Solo and team from the same design.** Team mode is just the data committed to the repository. No server, no account.
7. **Cost bounded regardless of repository size.** Claude tokens are spent only when someone is learning, and only on one zone at a time.

## 4. Non-goals (v1)

- A hosted server, SaaS dashboard, accounts or a GitHub App.
- Tracking at function or line level. v1 tracks **zones** (groups of files; see section 6).
- IDE extensions, and capturing agent edits from Cursor, Codex and other tools as they happen. Those agents still count when their commits carry co-author trailers or git-ai notes.
- A CI gate that blocks merges. Possible later.
- Explainer videos of danger zones. This is a planned later feature that ties in the earlier repo-to-video idea; not in v1.
- Languages beyond those listed in section 7.4 for dependency detection. Other languages still get a map, just without fan-in in their criticality score.

## 5. Anti-goals (failure even if it technically works)

- **Surveillance.** No leaderboards, no per-person scores across the team, and **failed attempts are never shared**. The shared data records only passes. A lead can see *who understands a zone* (that is the bus-factor value) but never *who failed*, and never *how much of a given person's code agents wrote*: agent-written share is shared only as anonymous zone totals. Someone determined could still infer it by cross-referencing git history; the plugin never shows it.
- **Teaching wrong things.** A question whose answer key is wrong is worse than no question. Every question and answer key is verified against the code by a separate checking agent before it is shown (section 8.3).
- **Nagging.** Hooks never block, never force a quiz, and stay silent below a threshold. Every prompt can be skipped. Nudges can be turned off in config.
- **False precision.** No score is shown without its evidence. Zones with no evidence show as **Unknown**, not as Dark.
- **Token burn.** No LLM pass over the whole repository, ever.

## 6. Core concepts

**Zone.** The unit of understanding: a set of files that belong together.
- Default: one zone per directory. Directories larger than about 3,000 lines of code are split by subdirectory, or into file groups if flat. Directories smaller than about 150 lines are merged into their parent.
- Users can override zones in config with glob patterns, e.g. `payments: ["src/payments/**", "src/billing/stripe*.ts"]`.
- Each zone has a stable id (a slug of its path or its config name) and a content fingerprint: a hash per file, used to detect change.

**Understanding level** (per person, per zone): an estimate from 0 to 100, with its evidence list.

**Zone state** (team view), using a threshold of 60:
- **Owned:** 2 or more active people at or above the threshold.
- **Fragile:** exactly 1.
- **Fading:** nobody active is at or above the threshold, but some active person has evidence of 30 or more, e.g. humans wrote it and their understanding has decayed. *(My call, added after review.)*
- **Dark:** nobody active has evidence of 30 or more, and there is evidence the code is agent-written or that every human who knew it has gone.
- **Unknown:** not enough evidence either way.

**Solo mode states** *(my call)*: a solo user can't reach "2 or more people", so in solo mode the states are **Owned** (you're at 60 or above), **Fading**, **Dark** and **Unknown**. Fragile is a team-only state.

**Darkness by state** for ranking *(my call; exact values are the builder's)*: Dark = 1.0, Fading = 0.6, Fragile = 0.4, Owned = 0.1. **Unknown zones are not ranked** in the top 10. Up to 3 critical Unknown zones are listed separately as "critical but unclear: run a session to find out".

**Active person:** has made a commit or passed a session in this repository within the last 90 days (configurable). Inactive people's understanding is shown separately as "left / inactive" and does not count toward Owned.

**Identity:** the person's `git config user.email`. In shared files it is stored as a handle (the part before the @, or a value set in config) to keep emails out of committed files.

## 7. The map

### 7.1 Signals behind each person's understanding level

| Signal | Source | Effect |
|---|---|---|
| Agent-written share | Plugin's own edit log (7.3), `Co-Authored-By` trailers naming known agents (Claude, Copilot, Cursor, Codex, Devin, Aider…), git-ai notes (`refs/notes/ai`) if present, Claude Code session logs on this machine (backfill, solo only) | Lowers the starting estimate for the committer |
| Human authorship | Lines from commits with no agent signal, by that person | Raises it |
| Human edits after agent code | Commits by the person that change agent-written lines | Raises it |
| Passed session | The plugin's session records | Strongest raise; sets the level directly |
| Passed handoff check | Plugin records | Moderate raise for the zones the change touched |
| Code changed since | Fraction of lines changed since the person's last evidence | Decay in proportion |
| Time | Days since last evidence; half-life 180 days (configurable) | Decay |
| PR review depth | Optional, via `gh` if available: approved with zero comments counts for little; substantive comments count | Small raise |

**Team mode and agent-written share** *(decided by the user: zone totals, no names)*: the local edit log stays private, but each machine also adds **anonymous zone totals** to a shared file (section 10): zone id, agent-written lines, and the ISO week, with **no author, no commit id and no exact time**. In the team view, a zone's shared agent-written share lowers the starting estimate of **everyone** whose commits touched that zone, in proportion. It is never pinned on one person. On your own machine, your local log still adjusts your own level precisely.

**The exact weights are the builder's call.** They must be simple, documented in the report, and tunable in one place. Each person's level carries a list of the evidence behind it.

### 7.2 Criticality

Each zone gets a criticality score from:
- **Fan-in:** how many other files import from it (7.4)
- **Churn:** commits touching it in the last 90 days
- **Size:** lines of code
- **Bug history:** commits touching it whose messages match fix/bug/hotfix/revert/incident
- **User-tagged critical paths:** set in config, as a strong boost

**Danger = darkness × criticality**, where darkness is 1 minus the best understanding level among active people, adjusted by state. The top 10 danger zones are listed first, each with a one-line reason, e.g. "Dark · 14 files import it · 3 fixes in the last 90 days · tagged critical".

### 7.3 Recording agent edits going forward

A `PostToolUse` hook on `Edit|Write|MultiEdit|NotebookEdit` appends to a local log: file, line ranges, session id, timestamp. This is the most reliable agent-authorship signal. The log is local (gitignored), and it is turned into per-zone agent shares when the map is computed. When those edits are committed, the map links them to the commit by file and time window. The builder chooses the matching method; heuristics are acceptable.

### 7.4 Dependency (fan-in) detection

Regex-based import detection for TypeScript/JavaScript, Python, Go, Java/Kotlin, Rust, Ruby, PHP and C#. Imports are resolved to files where it's cheap, otherwise to directories. No native dependencies and no tree-sitter in v1. If imports can't be resolved for a language, files that change together in commits stand in for dependencies.

### 7.5 Output

- **Terminal:** a short summary (counts of Owned / Fragile / Dark / Unknown), the top 10 danger zones with reasons, and the next suggested command.
- **HTML report:** `.understanding/report.html`, one self-contained file with no network calls. It shows a treemap of zones (sized by lines of code, coloured by state), a ranked table, and a detail panel per zone with evidence, who understands it (team mode), and a copyable `/understanding-map:learn <zone>` command. The report says plainly that scores are estimates. It works in light and dark mode.

## 8. Learning sessions

### 8.1 Flow (`/understanding-map:learn [zone|path]`)

1. **Pick:** the zone given, or the top danger zone. Show why it was picked.
2. **Tour (about 2 minutes of reading):** what the zone is for; the main flow through it, with `file:line` references; 2–3 key design decisions and their likely reasons; the gotchas. Short and grounded in the code.
3. **Check:** 3 questions, one at a time, answered in the person's own words:
   - **Predict:** "Given this input, what happens and where?"
   - **Break:** "If this changed, what would fail, and why?" or "Here is a modified snippet; what's wrong with it?"
   - **Locate:** "Where would you change the code to make this new thing happen?"
4. **Grade:** each answer is graded as pass, partial or miss against the verified answer key, with a short explanation that cites code. The person is asked not to use AI help, on an honour basis; the session is about learning, not proctoring.
5. **Record** *(my call, replaces an earlier rule that didn't work with 2 questions)*: each answer scores pass = 1, partial = 0.5, miss = 0, and the session result is the average:
   - **Pass:** average of 0.67 or more and no misses. Sets the level to `max(current, 80)`.
   - **Partial:** average of 0.34 or more. Sets the level to `max(current, 50)`. A partial **never lowers** an existing level.
   - **Miss:** below 0.34. Nothing changes, and a retry is suggested in 3+ days with different questions.
   
   This works for both 2 and 3 questions. Only Pass is written to the shared events file; Partial and Miss stay in `local/`. The map refreshes and shows the change ("payments: Dark → Fragile").

Target: under 5 minutes total. The person can stop at any time; a stopped session records nothing.

### 8.2 Agents

- **Tour and question writer** (main skill): reads the zone, writes the tour and 3 candidate questions with answer keys and `file:line` references.
- **Answer-key checker** (separate subagent, fresh context): independently reads the cited code and confirms each answer key. Any question that can't be confirmed is regenerated or dropped. Sessions never show an unconfirmed question.
- **Grader:** grades against the confirmed key. The builder decides whether this is the main agent or a subagent.

### 8.3 Accuracy rule

If, after one regeneration, fewer than 2 questions can be confirmed, the session tells the person the zone is too unclear to quiz on yet. It offers the tour only and records nothing. That itself is a finding: it's shown on the map as "hard to verify".

## 9. Handoff check

- **Scope** *(my call)*: the Stop hook fires at the end of every agent reply, not when the session closes. So the plugin keeps a **"not yet checked" set**: every agent edit logged since the last completed or skipped handoff, across sessions.
- **Nudge:** at the end of a reply, if the not-yet-checked set has grown by **50 lines or more** (configurable) **since the last nudge**, print one **non-blocking** line: "Agents changed ~180 lines in 3 zones since your last check. Run `/understanding-map:handoff` for a 60-second check." Then move the nudge marker forward, so the same lines never trigger a second nudge. Never use the blocking Stop decision.
- `/understanding-map:handoff`: covers the whole not-yet-checked set. It summarises what changed in plain words, then asks 2 questions (Predict and Break), verified as in section 8.3. Grading uses the rule in 8.1. **Pass** sets each touched zone to `max(current, 65)`; partial and miss change nothing. Afterwards, whatever the result, the set is cleared.
- **Skip:** the person can skip; the set is cleared too. Edits from a skipped or missed check are marked **"unreviewed agent code"** in the zone's evidence.
- Config: `handoff.enabled`, `handoff.minLines`.

## 10. Solo and team data

Everything lives in `.understanding/` at the repository root:

| Path | Shared? | Contents |
|---|---|---|
| `config.json` | Committed in team mode | Mode, zone overrides, critical paths, thresholds, handoff settings, handle mapping |
| `events/<handle>.jsonl` | Committed in team mode | Append-only **passes only**: zone id, level, content fingerprint, date, kind (session or handoff) |
| `agent-share/<machine-id>.jsonl` | Committed in team mode | Append-only anonymous agent-written totals per zone per ISO week (section 7.1). The machine id is random, generated once, and **not** derived from the person's identity |
| `local/` | Always gitignored | Edit log, failed and partial attempts, session transcripts, cache |
| `report.html` | Gitignored | Generated output |

- **One file per person, append-only.** Each person writes only to their own events file. Setup adds `.understanding/events/*.jsonl merge=union` and `.understanding/agent-share/*.jsonl merge=union` to `.gitattributes`, so the same person appending on two branches still merges cleanly.
- **Committing** *(my call)*: the plugin **never makes commits**. Changes to events files go in with the person's normal commits; setup tells them this once. The map reads events from the working tree **plus** the default branch (`origin/<default>` if it's present locally; no automatic fetch). A lead on the default branch sees everything that has been merged.
- **Setup** (`/understanding-map:setup`, which also runs on first use) asks two things: solo or team (team = commit `config.json` and `events/`; solo = gitignore all of `.understanding/`), and optionally which paths are critical. Everything else uses defaults.
- In team mode, the map combines everyone's events with git history. A lead needs nothing extra; the same commands show the team view.

## 11. Commands

| Command | Does |
|---|---|
| `/understanding-map:setup` | First-run choices (section 10) |
| `/understanding-map:map` | Scans, prints the summary and top 10 danger zones, writes the HTML report |
| `/understanding-map:learn [zone or path]` | Learning session (section 8) |
| `/understanding-map:handoff` | Quick check on recent agent changes (section 9) |
| `/understanding-map:who <path>` | Who understands the zone containing this path, with evidence; or "nobody (Dark)" |

## 12. How it is built (my calls)

- **Plugin layout:** a standard Claude Code plugin with a manifest, skills (one each for learn, handoff, map, setup and who), one checker subagent, and hooks (PostToolUse, Stop).
- **Scanner and engine:** TypeScript, bundled with esbuild into one JavaScript file **shipped inside the plugin**, so there's no install step. Runs on Node 18+, which Claude Code already requires. It talks to git through the `git` CLI. No native dependencies.
- **Hooks:** small and fast. The PostToolUse hook only appends one line to a log, with a target under 50ms. The Stop hook only reads the log and prints.
- **Skills call the engine** through the bundled CLI (`node ${CLAUDE_PLUGIN_ROOT}/dist/umap.js <cmd> --json`) for anything deterministic, such as zones, scores, ranking and records. Claude is used only for the tour, questions, checking and grading.
- **Report:** a static HTML template, with data inlined at generation time and treemap code bundled in.
- **Tests:** unit tests for zoning, signals, scoring, decay and ranking on fixture repositories built from scripted git histories. One end-to-end test runs the scanner against a real public repository and checks timing.

## 13. What success looks like

- On first run, a solo developer's top 5 danger zones ring true to them: they'd agree those are the parts they'd fear touching.
- After 3 sessions, the map visibly changes, and the person feels they actually learned something.
- A lead can answer "who understands X?" in one command.
- First map of a repository with about 100k lines takes under 2 minutes. A session takes under 5 minutes and well under 100k tokens.

## 14. Left to the builder

- Exact signal weights and the decay formula, within the rules in 7.1.
- The heuristic that matches logged agent edits to commits.
- Thresholds for splitting and merging zones, within the stated ballpark.
- The HTML report's visual design, within 7.5.
- Exact wording of tours, questions and terminal output.
- Whether grading runs in the main agent or a subagent.
- File names inside `local/`.
