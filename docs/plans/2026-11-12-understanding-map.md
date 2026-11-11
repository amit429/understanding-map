# Understanding Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code plugin that maps which zones of a repository no human understands, ranks the dangerous ones, and pays the debt down with verified 5-minute learning sessions and a post-agent handoff check.

**Architecture:** A deterministic TypeScript engine (git history, zoning, import graph, scoring) is bundled into one file, `dist/umap.js`, and shipped inside the plugin. Hooks and skills call it as a CLI. Claude is used only inside the `learn` and `handoff` skills, for the tour, the questions, answer-key checking and grading. All state lives in `.understanding/` in the user's repository; team mode shares it by committing parts of that folder.

**Tech Stack:** TypeScript 5, Node ≥18, esbuild (bundle), vitest (tests), picomatch (globs), d3-hierarchy (treemap layout). No native dependencies.

**Spec:** `docs/specs/2026-11-12-understanding-map-design.md`. Read it alongside this plan; section numbers below (§) refer to it.

## Global Constraints

- Node ≥18. The only runtime dependencies are `picomatch` and `d3-hierarchy`, bundled into `dist/umap.js`. No native modules, no tree-sitter.
- `dist/umap.js` is committed, so users have no install step.
- **The map path makes no LLM calls.** Only the `learn` and `handoff` skills use Claude.
- Thresholds (spec values): understanding threshold `60`; Fading floor `30`; active window `90` days; decay half-life `180` days; handoff `minLines` `50`; zone split above `3000` lines of code; zone merge below `150`.
- History window: `730` days (builder's call; the spec doesn't set one; configurable as `historyDays`).
- Identity: `git config user.email`, stored in shared files only as a **handle** (the part before the @, or `config.handles[email]`).
- Shared files contain **only** pass events (`events/<handle>.jsonl`) and anonymous agent totals (`agent-share/<machine-id>.jsonl`, keys exactly `zone`, `agentLines`, `week`). Partials, misses, edit logs and flags stay in `.understanding/local/`.
- The plugin **never runs `git commit`** or any other command that writes to git.
- Hooks never block and never throw. They always exit 0, and never output a `decision` field.
- Slash commands: `/understanding-map:setup`, `:map`, `:learn`, `:handoff`, `:who`.
- The HTML report is self-contained and loads nothing over the network.
- Every score shown to a user carries its evidence and is labelled an estimate.

## Review Focus

1. **Not a git repo, an empty repo, or a shallow clone.** Expect a clear one-line message and exit code 2, never a stack trace. Tested in Task 2 (empty repo) and Task 8 (not a repo).
2. **Paths with spaces or non-ASCII characters, and renamed files in history.** History should follow the new path. Tested in Task 2.
3. **Lockfiles, minified bundles, generated and binary files.** They must not inflate line counts or become danger zones. Tested in Task 3.
4. **Hook input that is malformed, points outside the repo, or arrives before setup.** Expect a silent exit 0 with nothing written. Tested in Task 12.
5. **A zone name or file path containing `</script>` or HTML.** The report must not break or inject markup. Tested in Task 9.

---

### Task 1: Scaffold, shared types, config

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore` (`node_modules/`), `.claude-plugin/plugin.json`
- Create: `src/types.ts`, `src/config.ts`, `src/identity.ts`
- Test: `test/config.test.ts`

**Interfaces:**
- Produces, in `src/types.ts` (every later task imports these):
```ts
export type ZoneState = 'owned' | 'fragile' | 'fading' | 'dark' | 'unknown';
export type Flag = 'hard-to-verify' | 'unreviewed-agent-code';
export interface Config {
  mode: 'solo' | 'team'; zones: Record<string, string[]>; critical: string[]; exclude: string[];
  threshold: number; fadingFloor: number; activeDays: number; halfLifeDays: number; historyDays: number;
  handoff: { enabled: boolean; minLines: number }; handles: Record<string, string>;
}
export interface FileEntry { path: string; loc: number; hash: string }
export interface Zone { id: string; files: string[]; loc: number; fingerprint: Record<string, string> }
export interface FileChange { path: string; added: number; deleted: number }
export interface Commit { sha: string; email: string; date: Date; message: string; agentTrailer: boolean; files: FileChange[] }
export interface EditLogEntry { file: string; ranges: Array<[number, number]>; lines: number; session: string; ts: string }
export interface PassEvent { zone: string; level: number; fingerprint: Record<string, string>; date: string; kind: 'session' | 'handoff' }
export interface AgentShareEntry { zone: string; agentLines: number; week: string }
export interface Evidence { kind: 'human-commits' | 'agent-share' | 'pass' | 'partial' | 'review' | 'decay-change' | 'decay-time' | 'inactive' | 'flag'; text: string }
export interface PersonLevel { handle: string; level: number; active: boolean; evidence: Evidence[] }
export interface Criticality { score: number; fanIn: number; churn90: number; loc: number; fixes90: number; tagged: boolean }
export interface ZoneResult { zone: Zone; state: ZoneState; people: PersonLevel[]; agentShare: number; criticality: Criticality; darkness: number; danger: number; reason: string; flags: Flag[] }
export interface MapResult { mode: Config['mode']; generatedAt: string; me: string; zones: ZoneResult[]; top: ZoneResult[]; unclearCritical: ZoneResult[]; counts: Record<ZoneState, number> }
```
- Produces: `DEFAULT_CONFIG: Config`; `loadConfig(root: string): Config`; `isSetUp(root: string): boolean`; `umDir(root: string): string`; `class ConfigError extends Error { field: string }`; `handleFor(email: string, config: Config): string`.

- [ ] **Step 1:** Run `git init` in `understanding-map/`. Write `package.json` (`"type": "module"`, scripts `test`, `build`, `typecheck`; dependencies `picomatch` and `d3-hierarchy`; devDependencies `typescript`, `esbuild`, `vitest`, `@types/node`, `@types/picomatch`, `@types/d3-hierarchy`; `"engines": {"node": ">=18"}`). Write `tsconfig.json` (strict, ES2022, moduleResolution bundler). Write `.claude-plugin/plugin.json` with `name: "understanding-map"`, `version: "0.1.0"`, `description`. Run `npm install`.
- [ ] **Step 2: Write the failing tests** in `test/config.test.ts`:
  - `loadConfig` on a directory with no `.understanding/config.json` returns `DEFAULT_CONFIG`. Assert `mode === 'solo'`, `threshold === 60`, `fadingFloor === 30`, `activeDays === 90`, `halfLifeDays === 180`, `historyDays === 730`, `handoff` equals `{enabled: true, minLines: 50}`.
  - A partial config file `{"mode":"team","handoff":{"minLines":80}}` deep-merges: `mode === 'team'`, `handoff.minLines === 80`, `handoff.enabled === true`.
  - `{"threshold":"high"}` throws `ConfigError` with `field === 'threshold'`.
  - `handleFor('Priya.S@corp.io', DEFAULT_CONFIG) === 'priya.s'`; `handleFor('a b@x.y', cfg) === 'a-b'`; `config.handles` overrides the default.
- [ ] **Step 3:** Run `npx vitest run test/config.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 4:** Implement `src/types.ts`, `src/config.ts` and `src/identity.ts` with the signatures above. A handle is the local part, lowercased, with characters outside `[a-z0-9._-]` replaced by `-`.
- [ ] **Step 5:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 6:** Commit, including the spec and this plan: `git add -A && git commit -m "chore: scaffold understanding-map plugin with types and config"`.

---

### Task 2: Git reader

**Files:**
- Create: `src/git.ts`, `test/helpers/repo.ts`
- Test: `test/git.test.ts`

**Interfaces:**
- Produces:
  - `git(root: string, args: string[]): string`: uses `execFileSync` with `maxBuffer` 512 MB and throws `GitError` on non-zero exit.
  - `repoRootOf(cwd: string): string | null`
  - `listTrackedFiles(root: string): string[]`: uses `ls-files -z`.
  - `readHistory(root: string, sinceDays: number, now?: Date): Commit[]`: no merge commits, renames followed to the new path, binary files counted as 0, newest first.
  - `isAgentTrailer(message: string): boolean`
  - `currentEmail(root: string): string`
  - `defaultBranchRef(root: string): string | null`
  - `showAtRef(root: string, ref: string, path: string): string | null`
  - `listAtRef(root: string, ref: string, dir: string): string[]`
  - `commitsWithNotes(root: string, notesRef: string): Set<string>`
- Produces, in `test/helpers/repo.ts`: `makeRepo(commits: Array<{ files: Record<string, string | null>; email?: string; date?: string; message?: string }>): string`. It creates a temporary repo. A value of `null` deletes the file. It sets `GIT_AUTHOR_*` and `GIT_COMMITTER_*` names, emails and dates, and returns the repo path.

- [ ] **Step 1: Write the failing tests:**
  - `readHistory` on a 3-commit repo returns 3 commits newest-first, with the right `email`, `date` and per-file `added` counts.
  - A rename (`git mv a.ts lib/b.ts` plus an edit) reports the change under `lib/b.ts`.
  - The path `src/my file é.ts` round-trips exactly (Review Focus 2).
  - A binary file has `added === 0`.
  - Commits older than `sinceDays` are excluded.
  - A freshly initialised repo with no commits returns `[]` without throwing (Review Focus 1).
  - `isAgentTrailer`: true for `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and for `co-authored-by: GitHub Copilot <...>`; false for `Co-Authored-By: Sam <sam@x.io>`.
  - `defaultBranchRef` returns `null` when there is no remote.
- [ ] **Step 2:** Run `npx vitest run test/git.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `src/git.ts`. Run history with `git log --no-merges -M -z --numstat --since=<ISO date> --format=%x1e%H%x1f%ae%x1f%aI%x1f%B%x1f`. Parse the `-z` numstat rename form (`added\tdeleted\t\0old\0new\0`). Agent trailer regex: `/^co-authored-by:.*\b(claude|anthropic|copilot|cursor|codex|devin|aider|gemini|openai|windsurf|cline|jules)\b/im`. `defaultBranchRef` tries `git symbolic-ref refs/remotes/origin/HEAD`, then `origin/main`, then `origin/master`. `commitsWithNotes` parses `git notes --ref=<ref> list`, using its second column, and returns an empty set if the ref is missing.
- [ ] **Step 4:** Run `npx vitest run test/git.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: git history reader`.

---

### Task 3: Files and zones

**Files:**
- Create: `src/zones.ts`
- Test: `test/zones.test.ts`

**Interfaces:**
- Consumes: `Config`, `FileEntry`, `Zone` (Task 1); `listTrackedFiles` (Task 2).
- Produces:
  - `DEFAULT_EXCLUDES: string[]`
  - `readFileEntries(root: string, paths: string[], exclude: string[]): FileEntry[]`
  - `buildZones(files: FileEntry[], config: Config): Zone[]`
  - `zoneIndex(zones: Zone[]): Map<string, string>` (path → zone id)
  - `writeZoneCache(root: string, zones: Zone[]): void`
  - `readZoneCache(root: string): Record<string, string> | null`. The cache lives at `.understanding/local/zones-cache.json`.

- [ ] **Step 1: Write the failing tests:**
  - `package-lock.json`, `yarn.lock`, `app.min.js`, `dist/x.js`, a file containing a NUL byte, and a file over 1 MB are all excluded (Review Focus 3).
  - `loc` counts non-empty lines.
  - `hash` is stable for identical content and differs when content changes.
  - Zoning:
    - A directory with 4,000 lines split across subdirectories `a/` and `b/` yields zones `dir/a` and `dir/b`.
    - A flat directory of 7,000 lines yields `dir#1`, `dir#2` and `dir#3`, each ≤ 3,000 lines, with files ordered alphabetically.
    - A 100-line directory `src/tiny` merges into `src`.
    - Root-level files go to zone `(root)`.
    - An override `{"payments": ["src/pay/**", "src/billing/stripe*.ts"]}` claims those files before directory zoning.
  - Each zone's `fingerprint` maps every one of its files to that file's hash.
- [ ] **Step 2:** Run `npx vitest run test/zones.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the functions. `DEFAULT_EXCLUDES` = `**/node_modules/**`, `**/dist/**`, `**/build/**`, `**/vendor/**`, `**/*.min.*`, `**/*.map`, `**/*.snap`, `**/*.lock`, `**/package-lock.json`, `**/pnpm-lock.yaml`, `**/go.sum`, `.understanding/**`, plus `config.exclude`. Match globs with picomatch (`dot: true`). Zoning algorithm:
  1. Assign override zones.
  2. Group the remaining files by directory.
  3. Recursively split any directory whose subtree exceeds 3,000 lines. When a split leaves direct files behind, those become zone `<dir>`. A flat directory over the limit is chunked into `<dir>#n`.
  4. Fold any zone under 150 lines into its parent directory's zone. Repeat until stable.
- [ ] **Step 4:** Run `npx vitest run test/zones.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: file reading and zoning`.

---

### Task 4: Imports and fan-in

**Files:**
- Create: `src/imports.ts`
- Test: `test/imports.test.ts`

**Interfaces:**
- Consumes: `FileEntry`, `Zone`, `Commit`.
- Produces:
  - `type Lang = 'ts' | 'py' | 'go' | 'java' | 'rs' | 'rb' | 'php' | 'cs'` (js and kt map to ts and java)
  - `languageOf(path: string): Lang | null`
  - `extractImports(lang: Lang, source: string): string[]`
  - `resolveImport(from: string, spec: string, lang: Lang, files: Set<string>): string | null`
  - `fanInByZone(root: string, files: FileEntry[], zones: Zone[], commits: Commit[]): Record<string, number>`

- [ ] **Step 1: Write the failing tests:**
  - **TypeScript/JavaScript:** `import x from './util'`, `export * from "../lib"` and `require('./a.js')` are all extracted. `./util` resolves to `src/util.ts` or `src/util/index.ts`.
  - **Python:** `from .models import User` resolves relative to the package; `import app.db` resolves to `app/db.py` or `app/db/__init__.py`.
  - **Go:** `import "github.com/x/proj/internal/store"` resolves to the directory `internal/store` by matching the trailing path segments.
  - **Fan-in:** if zone `core` is imported by 3 files in zone `api` and 1 file in `core`, then `fanIn.core === 3`; same-zone imports don't count.
  - **Fallback:** zone `scripts` has only `.sh` files, and 4 files from other zones change together with it in ≥3 commits, so `fanIn.scripts === 4`.
- [ ] **Step 2:** Run `npx vitest run test/imports.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement with one regex set per language. Namespace-based languages (Go, Java, C#, Rust `crate::`/`mod`) resolve by suffix-matching path segments against directories. Fan-in counts distinct importing files that sit in other zones. Zones with no supported-language files use the co-change fallback (≥3 shared commits).
- [ ] **Step 4:** Run `npx vitest run test/imports.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: import graph and fan-in`.

---

### Task 5: Agent attribution, edit log and agent share

**Files:**
- Create: `src/editlog.ts`, `src/attribution.ts`
- Test: `test/attribution.test.ts`, `test/fixtures/session.jsonl`

**Interfaces:**
- Consumes: `Commit`, `EditLogEntry`, `AgentShareEntry`, `Zone`; `listAtRef` and `showAtRef` (Task 2).
- Produces, in `src/editlog.ts`:
  - `appendEdit(root: string, e: EditLogEntry): void`
  - `readEdits(root: string): EditLogEntry[]`
  - `uncheckedEdits(root: string): EditLogEntry[]`
  - `markChecked(root: string, upToTs: string): void`
  - `getNudgedLines(root: string): number`
  - `setNudgedLines(root: string, n: number): void`
  
  Files: `local/edits.jsonl` and `local/handoff.json` (`{checkedUpTo, nudgedLines}`). `markChecked` also resets `nudgedLines` to 0.
- Produces, in `src/attribution.ts`:
  - `agentLinesByCommit(commits: Commit[], edits: EditLogEntry[], notedShas: Set<string>): Map<string, Map<string, number>>` (sha → path → agent lines)
  - `backfillSessionEdits(root: string, homeDir: string): EditLogEntry[]`
  - `isoWeek(d: Date): string` (e.g. `2026-W46`)
  - `machineId(root: string): string`
  - `syncAgentShare(root: string, zones: Zone[], commits: Commit[], agentLines: Map<string, Map<string, number>>): void`
  - `readAgentShares(root: string, defaultRef: string | null): AgentShareEntry[]`

- [ ] **Step 1: Write the failing tests:**
  - A commit with an agent trailer, or one listed in `notedShas`, has every added line counted as agent lines.
  - A commit without a trailer gets agent lines for file `f` when an edit-log entry for `f` falls after the previous commit touching `f` and at or before this commit. The count is `min(added, sum of entry.lines)`.
  - `backfillSessionEdits` reads `test/fixtures/session.jsonl`, placed under `<home>/.claude/projects/<root with "/" replaced by "-">/`. It returns entries only for `Edit`/`Write`/`MultiEdit` tool uses whose `file_path` is inside the repo root, converted to repo-relative paths.
  - `isoWeek(new Date('2026-11-12')) === '2026-W46'`.
  - `machineId` is 8 hex characters, stable across calls, and stored in `local/machine-id`.
  - `syncAgentShare` called twice with no new data appends nothing the second time. When new agent lines arrive in the same zone and week, it appends only the delta.
  - **Privacy:** every JSON line in `agent-share/*.jsonl` has exactly the keys `["agentLines","week","zone"]`.
  - `readAgentShares` returns the union of the working-tree file and the same file at a ref, deduplicated by exact line.
- [ ] **Step 2:** Run `npx vitest run test/attribution.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. `syncAgentShare` remembers what it has already written in `local/agent-share-written.json` (zone + week → total) and appends only positive deltas. Session-log parsing skips any line it can't parse.
- [ ] **Step 4:** Run `npx vitest run test/attribution.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: agent attribution, edit log, anonymous agent share`.

---

### Task 6: Events store

**Files:**
- Create: `src/events.ts`
- Test: `test/events.test.ts`

**Interfaces:**
- Consumes: `PassEvent`, `Flag`; `listAtRef` and `showAtRef` (Task 2).
- Produces:
  - `appendPass(root: string, handle: string, ev: PassEvent): void` (writes to `events/<handle>.jsonl`)
  - `readPasses(root: string, defaultRef: string | null): Map<string, PassEvent[]>`
  - `appendLocalPartial(root: string, ev: PassEvent): void`
  - `readLocalPartials(root: string): PassEvent[]` (`local/partials.jsonl`)
  - `appendAttempt(root: string, a: { zone: string; kind: 'session' | 'handoff'; result: 'partial' | 'miss'; date: string; retryAfter?: string }): void`
  - `addFlag(root: string, zone: string, flag: Flag): void`
  - `readFlags(root: string): Record<string, Flag[]>` (`local/flags.json`)

- [ ] **Step 1: Write the failing tests:**
  - `appendPass` then `readPasses` round-trips.
  - Events present both in the working tree and at the ref are merged and deduplicated.
  - Branch case: the same handle appends on two branches, which then merge using the `merge=union` attribute set up in Task 10 (set it directly in this test). `readPasses` returns both events.
  - **Privacy:** after `appendAttempt` and `appendLocalPartial`, nothing new has appeared under `events/`.
  - `addFlag` is idempotent.
- [ ] **Step 2:** Run `npx vitest run test/events.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the functions.
- [ ] **Step 4:** Run `npx vitest run test/events.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: pass events and local attempt store`.

---

### Task 7: Scoring, states and ranking

**Files:**
- Create: `src/weights.ts`, `src/scoring.ts`
- Test: `test/scoring.test.ts`

**Interfaces:**
- Consumes: all types from Task 1.
- Produces:
```ts
export interface ScoreInputs {
  config: Config; now: Date; me: string; handleOf: (email: string) => string;
  zones: Zone[]; commits: Commit[];
  agentLines: Map<string, Map<string, number>>;   // local knowledge (Task 5)
  sharedAgentShare: Record<string, number>;        // zone → 0..1, team mode only (pipeline computes it)
  passes: Map<string, PassEvent[]>; localPartials: PassEvent[];
  fanIn: Record<string, number>; reviews: Record<string, Record<string, number>>; flags: Record<string, Flag[]>;
}
export function scoreMap(inp: ScoreInputs): MapResult;
export function personLevels(zone: Zone, inp: ScoreInputs): PersonLevel[];
export function zoneState(people: PersonLevel[], agentShare: number, hasEvidence: boolean, inp: ScoreInputs): ZoneState;
```
- Produces, in `src/weights.ts` (the one place to tune numbers, §7.1): `HUMAN_BASE = 30`, `HUMAN_SHARE_MULT = 80`, `HUMAN_SHARE_MAX = 40`, `AGENT_PENALTY = 40`, `REVIEW_PER = 5`, `REVIEW_MAX = 10`, `DARKNESS = { dark: 1, fading: 0.6, fragile: 0.4, owned: 0.1, unknown: 0 }`, `CRIT = { fanIn: 0.35, churn: 0.25, loc: 0.15, fixes: 0.25, tagged: 1 }`, `FIX_RE = /\b(fix|bug|hotfix|revert|incident)\b/i`, `DARK_AGENT_SHARE = 0.5`.

**Algorithm.** The spec leaves the weights to the builder, but tests need values, so they are pinned here:
- **History level** for person *p* in zone *z*, when *p* has at least one commit touching *z* in the window:
  - Inputs: `lines` = lines *p* added in *z*; `agentFrac` = *p*'s agent lines ÷ *p*'s added lines (local knowledge) when *p* is `me` or the mode is solo, otherwise `sharedAgentShare[z] ?? 0`.
  - `raw = HUMAN_BASE + min(HUMAN_SHARE_MAX, HUMAN_SHARE_MULT × lines / z.loc) − AGENT_PENALTY × agentFrac`.
  - Then `raw × max(0, 1 − othersAddedAfterP / z.loc) × 0.5^(daysSinceP'sLastCommitInZ / halfLifeDays)`.
  - Then add `min(REVIEW_MAX, REVIEW_PER × reviews[z][p])`.
- **Pass level:** take the latest pass for *z*, from the events, or from `localPartials` when *p* is `me`. Its level × (share of `z.loc` whose current file hash equals the event's fingerprint) × `0.5^(days / halfLifeDays)`.
- **Final level:** `clamp(0, 100, max(history, pass))`. Every factor that changes the level adds an `Evidence` entry with a plain-words `text`.
- **Active:** *p* has any commit in the repository, or a pass, within `activeDays`.
- **Zone agent share:** `max(local agent lines in z ÷ lines added in z within the window, sharedAgentShare[z] ?? 0)`.
- **States in team mode:**
  - count active people with level ≥ `threshold`: 2 or more = owned, exactly 1 = fragile;
  - else if any active person has level ≥ `fadingFloor` → fading;
  - else if agent share ≥ 0.5, or people exist but none is active → dark;
  - else unknown.
- **States in solo mode** (only `me` counts): `me` ≥ `threshold` → owned; ≥ `fadingFloor` → fading; any evidence → dark; none → unknown.
- **Criticality:** percentile rank among zones of `fanIn`, `churn90` (commits touching the zone in the last 90 days), `loc` and `fixes90` (`FIX_RE` commits in the last 90 days), weighted by `CRIT`, plus 1 if any file matches `config.critical`.
- **Ranking:** `danger = DARKNESS[state] × criticality.score`.
  - `top` = up to 10 zones with `danger > 0`, highest first.
  - `unclearCritical` = up to 3 unknown zones with criticality ≥ 0.5, highest criticality first.
  - `reason` joins the non-zero parts: `Dark · 14 files import it · 3 fixes in the last 90 days · tagged critical`.

- [ ] **Step 1: Write the failing tests.** Each builds `ScoreInputs` by hand:
  1. **Solo, all agent-written.** `me` added 500 lines in a 500-line zone, all of them agent lines, with a recent commit → level 30, state `dark`.
  2. **Solo, human-written, recent.** `me`, 500 of 500 lines, committed yesterday → level ≈ 70 (±1), state `owned`.
  3. **Solo, human-written, 200 days ago.** `me` still active elsewhere → level ≈ 32 (±1), state `fading`.
  4. **Team, two active people.** Both above 60 → `owned`. Only one → `fragile`.
  5. **Team, inactive people only.** Their last activity was 120 days ago → `dark`, with evidence kind `inactive`.
  6. **Team, shared agent share.** `sharedAgentShare = 0.8` lowers a teammate's level from 70 to 38 (±1). Evidence kind `agent-share` says "about 80% of this zone was written by agents" and names nobody.
  7. **Pass with unchanged fingerprint.** Level 80, `owned` in solo mode. If half the zone's lines now have new hashes → 40.
  8. **Local partial.** A partial of 50 applies only to `me`, never to other handles.
  9. **Unknown.** An unknown zone with criticality 0.9 is absent from `top` and present in `unclearCritical`.
  10. **Tagged critical.** A zone matching `config.critical` outranks an otherwise identical untagged zone.
  11. **Reason string.** A zone with fanIn 14 and 3 fixes → `reason === 'Dark · 14 files import it · 3 fixes in the last 90 days'`.
- [ ] **Step 2:** Run `npx vitest run test/scoring.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `weights.ts` and `scoring.ts` as specified, as pure functions with no I/O.
- [ ] **Step 4:** Run `npx vitest run test/scoring.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: understanding scores, zone states, danger ranking`.

---

### Task 8: Map pipeline, terminal output, CLI core

**Files:**
- Create: `src/pipeline.ts`, `src/terminal.ts`, `src/cli.ts`
- Test: `test/pipeline.test.ts`, `test/cli.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces:
  - `buildMap(root: string, opts?: { now?: Date; reviews?: Record<string, Record<string, number>> }): MapResult`. It loads the config, files and zones; reads history and notes from `refs/notes/ai`; reads edits (plus backfilled edits when solo); computes agent lines, and in team mode the shared share (Σ agentLines for the zone within the window's weeks ÷ lines added in the zone, capped at 1); reads passes, partials, fan-in and flags; then calls `scoreMap`. In team mode it also calls `syncAgentShare`. It always calls `writeZoneCache`.
  - `formatSummary(m: MapResult, reportPath: string | null): string`
  - `formatWho(z: ZoneResult, mode: Config['mode']): string`
  - In `src/cli.ts`: `commands: Record<string, (args: string[]) => Promise<number>>` and `main(argv: string[]): Promise<number>`. This task registers `status`, `map`, `zone`, `who` and `pick`. Later tasks add entries to the same table.
- CLI contract (`--json` prints exactly one JSON object to stdout):
  - `status --json` → `{setUp, mode, root}`
  - `map [--json] [--no-report]`
  - `zone <id|path> --json` → `ZoneResult`
  - `who <path>`
  - `pick --json` → `{zone: ZoneResult, why: string} | {zone: null, why}`. Picks `top[0]`, else `unclearCritical[0]`.

- [ ] **Step 1: Write the failing tests:**
  - On a fixture repo with 3 zones (one agent-trailer-heavy, one human-written recently, one untouched for 800 days), `buildMap` gives states `dark`, `owned` and `unknown` in solo mode. `zones-cache.json` exists afterwards.
  - `formatSummary` contains the counts line (`Owned 1 · Fading 0 · Dark 1 · Unknown 1`), a numbered top list with reasons, the line `Scores are estimates from git history and sessions`, and the next command `/understanding-map:learn`.
  - `main(['map'])` run in a non-git directory prints `Understanding Map needs a git repository` to stderr and returns 2 (Review Focus 1).
  - `zone src/api/user.ts --json` resolves a file path to its zone.
  - `who` for a dark zone prints `nobody (Dark)` and the evidence lines.
  - In team mode, `who` lists inactive people under a separate `left / inactive` heading and does not count them toward the state (§6).
- [ ] **Step 2:** Run `npx vitest run test/pipeline.test.ts test/cli.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the functions. In this task `map` prints the summary with `reportPath = null`; Task 9 wires in the report.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: map pipeline and CLI`.

---

### Task 9: HTML report

**Files:**
- Create: `src/report.ts`, `src/report-template.html`
- Modify: `src/cli.ts` (the `map` command writes the report and passes its path to `formatSummary`)
- Test: `test/report.test.ts`

**Interfaces:**
- Consumes: `MapResult`.
- Produces: `renderReport(m: MapResult): string` and `writeReport(root: string, html: string): string`, which writes `.understanding/report.html` and returns the path.

- [ ] **Step 1: Write the failing tests:**
  - The output contains every zone id and a copyable `/understanding-map:learn <zone id>` command for each zone.
  - It contains the text `Scores are estimates`.
  - The embedded data for each zone includes its evidence. In team mode it also includes the handles of active people at or above the threshold, which is what the detail panel shows as "who understands it" (§7.5). It never includes any person's agent-written share.
  - It has no `src=` or `href=` attribute starting with `http`, and no `@import` (self-contained).
  - A zone id of `</script><b>x` is escaped in both the markup and the embedded JSON, so the document parses with exactly one `<b>`-free data script (Review Focus 5).
  - It defines CSS custom properties under `:root` and a `prefers-color-scheme: dark` override.
- [ ] **Step 2:** Run `npx vitest run test/report.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Compute the treemap in Node with `d3-hierarchy` (`treemap().tile(treemapSquarify)`, sized by `loc`, nested by path segments). Output absolutely positioned `div`s in percentages, coloured by state: owned green, fragile amber, fading light amber, dark red, unknown grey. Below the treemap: the ranked table, then a detail panel driven by a small inline script that reads `<script type="application/json" id="data">`. Escape `<` as `<` in that JSON. The visual design beyond this is the builder's call (§14).
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: self-contained HTML report`.

---

### Task 10: Setup

**Files:**
- Create: `src/setup.ts`
- Modify: `src/cli.ts` (register `setup`)
- Test: `test/setup.test.ts`

**Interfaces:**
- Consumes: `Config`, `machineId`.
- Produces: `runSetup(root: string, opts: { mode: 'solo' | 'team'; critical: string[] }): { configPath: string; gitignoreLines: string[]; gitattributesLines: string[] }`. CLI: `setup --mode solo|team [--critical "<glob>,<glob>"]`.

- [ ] **Step 1: Write the failing tests:**
  - **Solo** adds `.understanding/` to `.gitignore`.
  - **Team** adds `.understanding/local/` and `.understanding/report.html` to `.gitignore`, and adds `.understanding/events/*.jsonl merge=union` and `.understanding/agent-share/*.jsonl merge=union` to `.gitattributes`.
  - Running setup twice adds no duplicate lines.
  - `config.json` holds `mode` and `critical`.
  - A machine id exists afterwards.
  - Setup runs no git write commands: `git status --porcelain` shows only untracked or modified files, and no commits were added.
- [ ] **Step 2:** Run `npx vitest run test/setup.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the function.
- [ ] **Step 4:** Run `npx vitest run test/setup.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: setup command`.

---

### Task 11: Recording results and the handoff set

**Files:**
- Create: `src/record.ts`
- Modify: `src/cli.ts` (register `record`, `unverifiable`, `handoff-set`, `handoff-skip`)
- Test: `test/record.test.ts`

**Interfaces:**
- Consumes: `buildMap`, events functions (Task 6), editlog functions (Task 5), `zoneIndex` and `readZoneCache` (Task 3), `handleFor` and `currentEmail`.
- Produces:
  - `type Grade = 'pass' | 'partial' | 'miss'`
  - `gradeSession(grades: Grade[]): Grade`
  - `recordResult(root: string, r: { kind: 'session' | 'handoff'; zones: string[]; grades: Grade[]; now?: Date }): { result: Grade; changes: Array<{ zone: string; before: ZoneState; after: ZoneState; levelBefore: number; levelAfter: number }> }`
  - `handoffSet(root: string): { totalLines: number; zones: Array<{ zone: string; lines: number; files: string[] }>; edits: EditLogEntry[] }`
  - `skipHandoff(root: string, now?: Date): void`
  - `markUnverifiable(root: string, zone: string): void`
- CLI:
  - `record --kind session --zones <id> --grades pass,partial,pass --json`
  - `record --kind handoff --grades pass,pass --json` (zones come from the handoff set)
  - `unverifiable --zone <id>`
  - `handoff-set --json`
  - `handoff-skip`

- [ ] **Step 1: Write the failing tests:**
  - `gradeSession` (§8.1 rule: pass = 1, partial = 0.5, miss = 0; pass needs an average ≥ 0.67 and no miss; partial needs an average ≥ 0.34; anything lower is a miss):

    | Grades | Result |
    |---|---|
    | `[pass,pass,partial]` | pass |
    | `[pass,pass,miss]` | partial |
    | `[pass,partial,miss]` | partial |
    | `[pass,pass]` | pass |
    | `[pass,miss]` | partial |
    | `[partial,partial]` | partial |
    | `[miss,miss,pass]` | miss |

  - A session pass appends a `PassEvent` with `level === max(current, 80)` and `fingerprint` equal to the zone's current fingerprint. `changes[0]` reports `before: 'dark'` and `after: 'owned'` (solo).
  - A session partial writes **only** `local/partials.jsonl` (level `max(current, 50)`), never `events/`. Its effect never lowers a level of 70.
  - A session miss writes an attempt whose `retryAfter` is 3 days after `now`, and changes nothing else.
  - A handoff pass appends a pass with `kind: 'handoff'` and level `max(current, 65)` for every touched zone, then empties the handoff set.
  - A handoff miss, or `skipHandoff`, empties the set and adds the flag `unreviewed-agent-code` to the touched zones.
  - `markUnverifiable` adds `hard-to-verify`.
- [ ] **Step 2:** Run `npx vitest run test/record.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. `recordResult` calls `buildMap` before and after to report the changes. The handoff set comes from `uncheckedEdits`, grouped by zone using the zone cache, falling back to the file's directory.
- [ ] **Step 4:** Run `npx vitest run test/record.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: record session and handoff results`.

---

### Task 12: Hooks

**Files:**
- Create: `src/hooks.ts`, `hooks/hooks.json`
- Modify: `src/cli.ts` (register `hook`, which reads stdin)
- Test: `test/hooks.test.ts`

**Interfaces:**
- Consumes: `repoRootOf`, `isSetUp`, `loadConfig`, editlog functions, `readZoneCache`.
- Produces:
  - `onPostToolUse(input: unknown): void`
  - `onStop(input: unknown): string | null`. It returns the JSON text to print, `{"systemMessage": "..."}`, or `null`.
  - CLI: `hook post-tool-use` and `hook stop`. Both always exit 0.
  - `hooks/hooks.json`:
```json
{ "hooks": {
  "PostToolUse": [{ "matcher": "Edit|Write|MultiEdit|NotebookEdit",
    "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/dist/umap.js\" hook post-tool-use" }] }],
  "Stop": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/dist/umap.js\" hook stop" }] }]
} }
```

- [ ] **Step 1: Write the failing tests:**
  - An `Edit` input (`{session_id, cwd, tool_name: 'Edit', tool_input: {file_path}, tool_response: {structuredPatch: [{newStart: 10, newLines: 4}]}}`) inside a set-up repo appends `{file, ranges: [[10, 13]], lines: 4}`.
  - A `Write` input with no patch counts the lines of `content`.
  - Ignored with nothing written, never throwing (Review Focus 4): a file outside the repo root; a repo that isn't set up; malformed input (`null`, `"x"`, a missing `tool_input`).
  - `onStop` with 30 unchecked lines → `null`. After a further 30 (60 in total) → a message containing `~60 lines` and `/understanding-map:handoff`. Called again with no new edits → `null`. After a further 50 → a message again.
  - `onStop` with `handoff.enabled = false` → `null`.
  - No return value ever contains the string `"decision"`.
  - `onPostToolUse` takes < 50 ms in-process on a log of 10,000 lines (append-only, never reads the whole log).
- [ ] **Step 2:** Run `npx vitest run test/hooks.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Wrap both handlers in try/catch so they swallow every error. The nudge text follows §9: `Agents changed ~N lines in K zones since your last check. Run /understanding-map:handoff for a 60-second check.`
- [ ] **Step 4:** Run `npx vitest run test/hooks.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: edit-log and handoff-nudge hooks`.

---

### Task 13: Skills, checker agent, README

**Files:**
- Create: `skills/setup/SKILL.md`, `skills/map/SKILL.md`, `skills/learn/SKILL.md`, `skills/handoff/SKILL.md`, `skills/who/SKILL.md`, `agents/answer-key-checker.md`, `README.md`
- Test: `test/plugin.test.ts`

**Interfaces:**
- Consumes: the CLI contract from Tasks 8, 10 and 11. Skills call `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>`.
- Produces: user-facing commands named in Global Constraints.

**Required content of each file.** Wording is the builder's call (§14); these rules are not:
- **setup:**
  - Ask solo or team in one plain question, explaining that team means `config.json`, `events/` and `agent-share/` get committed with normal commits and only passes and anonymous zone totals are shared.
  - Optionally ask for critical paths.
  - Run `setup --mode ... --critical ...`, then say what changed.
- **map:**
  - Run `status --json`. If not set up, follow the setup skill first.
  - Run `map`, show its summary verbatim, give the report path, and suggest `/understanding-map:learn`.
- **learn** (§8):
  1. **Pick:** use `zone <arg> --json` if an argument was given, otherwise `pick --json`. Say why the zone was picked.
  2. **Tour:** read the zone's files. Cover purpose, main flow with `file:line` references, 2–3 decisions and gotchas, in about 2 minutes of reading.
  3. **Draft questions:** draft Predict, Break and Locate questions, each with an answer key and `file:line` references. Never show a key to the user before they answer.
  4. **Check:** dispatch `answer-key-checker` with the questions and keys. Regenerate unconfirmed questions once. If fewer than 2 are confirmed, give the tour only, run `unverifiable --zone <id>`, and record nothing.
  5. **Ask:** ask the user to answer without AI help. Ask questions one at a time and grade each as pass, partial or miss, with a code-citing explanation.
  6. **Record:** run `record --kind session --zones <id> --grades ...` and show each change as `zone: Before → After`.
  7. If the user stops at any point, record nothing. Aim for under 5 minutes.
- **handoff** (§9):
  1. Run `handoff-set --json`. If it is empty, say there is nothing to check.
  2. Otherwise summarise the changes in plain words and ask 2 questions (Predict, Break), verified through `answer-key-checker` with the same rule as learn.
  3. Then run `record --kind handoff --grades ...`.
  4. If the user skips, run `handoff-skip`.
- **who:** run `who <path>` and show the output.
- **answer-key-checker:** frontmatter `tools: Read, Grep, Glob`. Its input is questions with answer keys and `file:line` references. It must read the cited code itself and not trust the drafts. Its output is a JSON array `[{id, confirmed: boolean, reason}]`.
- **README:** what it does, install, the five commands, solo vs team, the privacy guarantees from §5, and that scores are estimates.

- [ ] **Step 1: Write the failing tests** in `test/plugin.test.ts`:
  - `plugin.json` parses and has `name`, `version` and `description`.
  - Every `skills/*/SKILL.md` has frontmatter `name` and `description`.
  - Every `umap.js <cmd>` mentioned in a skill is a key of `commands` in `src/cli.ts`.
  - `agents/answer-key-checker.md` lists exactly the tools `Read, Grep, Glob`.
  - The learn skill text contains `answer-key-checker`, `unverifiable` and `record --kind session`.
  - `hooks/hooks.json` matches Task 12.
- [ ] **Step 2:** Run `npx vitest run test/plugin.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Write the skills, the agent and the README.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: skills, answer-key checker agent, README`.

---

### Task 14: Optional PR review signal

**Files:**
- Create: `src/reviews.ts`
- Modify: `src/cli.ts` (`map` passes the review counts to `buildMap` when available)
- Test: `test/reviews.test.ts`

**Interfaces:**
- Consumes: `Zone`, `zoneIndex`, `Config.handles` (here mapping a GitHub login to a handle).
- Produces:
  - `ghAvailable(root: string): boolean` (`gh auth status` exits 0 within 5 s)
  - `reviewCounts(root: string, zones: Zone[], config: Config, run?: (args: string[]) => string): Record<string, Record<string, number>>`

- [ ] **Step 1: Write the failing tests,** using an injected `run` stub that returns canned `gh api` JSON:
  - A PR approved with zero comments contributes 0.
  - A reviewer with 2 substantive review comments (body ≥ 20 characters) on `src/pay/x.ts` gives `counts.payments.<handle> === 2`.
  - The login is mapped through `config.handles`, falling back to the login itself.
  - When `run` throws or times out, the result is `{}` and `map` still works.
- [ ] **Step 2:** Run `npx vitest run test/reviews.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Fetch the last 50 merged PRs (`gh api repos/{owner}/{repo}/pulls?state=closed&per_page=50`), then each PR's `/comments`. Allow 20 s in total. Cache the result for 24 h in `local/reviews-cache.json`.
- [ ] **Step 4:** Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: optional PR review signal`.

---

### Task 15: Bundle, performance check, smoke test

**Files:**
- Create: `scripts/build.mjs`, `dist/umap.js` (generated and committed), `test/e2e.test.ts`

**Interfaces:**
- Consumes: `main` from `src/cli.ts`.
- Produces: `dist/umap.js`. It is runnable as `node dist/umap.js <cmd>` and has no runtime `require` of anything outside Node built-ins.

- [ ] **Step 1:** Write `scripts/build.mjs`: esbuild, `platform: 'node'`, `target: 'node18'`, `bundle: true`, `format: 'cjs'`, and the report template inlined as a text loader. Add `"build": "node scripts/build.mjs"`.
- [ ] **Step 2: Write `test/e2e.test.ts`:**
  - **Bundle check:** after `npm run build`, run `node dist/umap.js map --json --no-report` on a fixture repo. Expect valid JSON and exit 0.
  - **Bundle check:** `grep` the bundle for `require("` of non-built-in modules. Expect none.
  - **Performance (opt-in with `UMAP_E2E=1`):** clone `https://github.com/fastify/fastify` (or any public repo of 80–150k lines) into a temporary directory. `map --no-report` must finish in under 120 s (§3 goal 1). Print the line count and the elapsed time.
- [ ] **Step 3:** Run `npm run build && npx vitest run` (expected PASS), then `UMAP_E2E=1 npx vitest run test/e2e.test.ts` (expected PASS, under 120 s).
- [ ] **Step 4: Manual smoke test.** In a scratch git repo, run `claude --plugin-dir <path-to>/understanding-map` and go through:
  1. `/understanding-map:setup` (solo);
  2. `/understanding-map:map` (the report opens);
  3. `/understanding-map:learn` (all 3 questions; the map changes);
  4. ask the agent to edit 60 or more lines (the nudge appears once);
  5. `/understanding-map:handoff`;
  6. `/understanding-map:who <file>`.
  
  Note anything that diverges from the spec.
- [ ] **Step 5:** Commit: `build: bundle dist/umap.js and add e2e checks`.
