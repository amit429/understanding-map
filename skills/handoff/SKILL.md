---
name: handoff
description: Use when the user wants a quick 60-second check that they understand what an AI agent just changed in this repository, after the Understanding Map nudge ("Agents changed ~N lines… run /understanding-map:handoff"), or wants to skip or clear that check.
---

# Handoff check

A 60-second check on what agents changed since the last check: a plain summary, then 2 questions. Skipping is always fine; say so without any guilt.

## Running the engine

Claude Code shows `Base directory for this skill: <path>` when this skill loads. Call that path `<base>` and run every engine command as `node "<base>/../../dist/umap.js" <cmd>` from the user's repository. If no base directory was shown, use `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>` instead.

Always put zone ids and paths in double quotes, because some contain shell characters: for example `--zone "(root)"`.

## 1. What changed

Run `node "<base>/../../dist/umap.js" handoff-set --json`. It prints `{"totalLines": …, "zones": [{"zone", "lines", "files"}], "edits": [{"file", "ranges", …}]}`.

If `zones` is empty, say there is nothing to check (no agent changes since the last check) and stop.

## 2. Summarise, then offer

Read the changed files around the edited line ranges. In 3–5 plain sentences, say what changed and why it matters: which zones, what behaviour is new or different. Only say what the code shows. Then offer the check, for example:

> Want a 60-second check (2 questions)? Or say "skip". That's fine too.

If they skip, go to **Skip** below.

## 3. Draft and check two questions

Draft two questions about the changed code, each with an answer key and `file:line` references:

- **q1 Predict:** "Given this input, what happens now, and where?"
- **q2 Break:** "If this changed, what would fail, and why?"

Never show an answer key before the user answers. Dispatch the `answer-key-checker` subagent (listed as `understanding-map:answer-key-checker`) with each question's id, type, text, answer key and references, plus the repository root. It returns `[{id, confirmed, reason}]`. A question counts as confirmed only when the checker returns it with an explicit `"confirmed": true`; anything else (a missing id, malformed or non-JSON output, or an error) counts as unconfirmed. Regenerate each unconfirmed question **once** and check only the new ones.

If fewer than 2 are confirmed after that, tell the user these changes are too unclear to quiz on yet, so the summary is the check today. For each zone in the set, run `node "<base>/../../dist/umap.js" unverifiable --zone "<zone id>"`, and record nothing else. The changes stay in the not-yet-checked set; the user can clear it with a skip if they prefer. Stop.

## 4. Ask, one at a time

Ask the user to answer in their own words without AI help; it is on their honour. Ask each question, wait for the answer, and grade it against the confirmed key as **pass** (essential point right, any wording), **partial** (on the right track, missing a key part) or **miss** (wrong or "not sure"). Give a one- or two-sentence explanation that cites `file:line`.

## 5. Record

Run `node "<base>/../../dist/umap.js" record --kind handoff --grades <g1>,<g2>`. The first line it prints is always `Result: pass`, `Result: partial` or `Result: miss`; the lines after it are either changes, `zone: Before → After (level a → b)`, or `No change on the map.`. Branch on the `Result:` line:

- **`Result: pass`:** show each change as `zone: Before → After` and call the levels estimates. A pass also clears any "unreviewed agent code" mark on the touched zones. If it says `No change on the map.`, say the check passed and those zones were already at or above that level.
- **`Result: partial`:** say the check is done and nothing changed on the map.
- **`Result: miss`:** say the check is done, nothing was raised on the map, and the touched zones are marked as unreviewed agent code; passing a later handoff check or a `/understanding-map:learn` session on that zone clears the mark.

Whatever the result, the not-yet-checked set is now cleared.

## Skip

If the user skips or stops at any point before recording, run `node "<base>/../../dist/umap.js" handoff-skip`. Tell them, in one line, that the check is cleared and those edits are marked as unreviewed agent code on the map; passing a later handoff check or a `/understanding-map:learn` session on that zone clears the mark.

## Rules

- Keep it to about 60 seconds of the user's time.
- Never mention or guess how much of any person's code agents wrote, and never present a level as a fact.
