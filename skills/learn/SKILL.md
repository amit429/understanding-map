---
name: learn
description: Use when the user wants to understand a part of this repository they did not write or have forgotten (often AI-written code), wants a short guided tour of a zone with a few questions to check their understanding, or wants to move a zone on the Understanding Map from Dark or Fading to understood.
argument-hint: "[zone or path]"
---

# Learning session

A 5-minute teaching session, not an exam: a short tour of one zone, then 2–3 questions the user answers in their own words. Be warm, brief and plain. Everything you say about the code must come from the code you read. Never invent behaviour, names or reasons.

The user's argument (may be empty): `$ARGUMENTS`

## Running the engine

Claude Code shows `Base directory for this skill: <path>` when this skill loads. Call that path `<base>` and run every engine command as `node "<base>/../../dist/umap.js" <cmd>` from the user's repository. If no base directory was shown, use `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>` instead.

Always put zone ids and paths in double quotes, because some contain shell characters: for example `--zones "(root)"`, `zone "(root)"`, `--zone "(root)"`.

## 1. Pick

First run `node "<base>/../../dist/umap.js" status --json`. If it reports `"setUp": false`, ask the setup skill's two questions (`/understanding-map:setup`) and run setup, then continue.

- With an argument: `node "<base>/../../dist/umap.js" zone "<argument>" --json`. It prints the zone: `zone.id`, `zone.files`, `state`, `reason`.
- Without one: `node "<base>/../../dist/umap.js" pick --json`. It prints `{"zone": …, "why": …}`. If `zone` is `null`, show `why`, say they can name any zone or path, and stop.

Tell the user in one line which zone and why, using the engine's `reason` or `why` (for example "payments — Dark · 14 files import it · tagged critical"). Do not list people or their evidence. Mention they can say "stop" at any time.

## 2. Tour (about 2 minutes of reading)

Read the zone's files (start with the most imported or largest; skim the rest). Then write a short tour:

- **What it is for:** two or three sentences.
- **Main flow:** the path a typical call or request takes, step by step, each step with a `file:line` reference.
- **2–3 key decisions** and their likely reasons. Say "likely" when the code does not state the reason.
- **Gotchas:** the things that would bite someone changing this code.

Aim for roughly 300–400 words. Short paragraphs or bullets, no walls of code; quote at most a few lines where it really helps.

## 3. Draft questions (never shown before they are checked)

Draft three questions, each with an answer key and the `file:line` references that prove it:

- **q1 Predict:** "Given this input, what happens and where?"
- **q2 Break:** "If this changed, what would fail, and why?" or "Here is a modified snippet; what's wrong with it?"
- **q3 Locate:** "Where would you change the code to make this new thing happen?"

Each question must have one defensible answer that the code shows, answerable after the tour without trivia (no exact line numbers, no variable-name recall). Never show an answer key to the user before they answer.

## 4. Check with answer-key-checker (mandatory)

Dispatch the `answer-key-checker` subagent (listed as `understanding-map:answer-key-checker`) with each question's id, type, question text, answer key and `file:line` references, plus the repository root. Send only those; do not send the tour. It returns `[{id, confirmed, reason}]`. A question counts as confirmed only when the checker returns it with an explicit `"confirmed": true`; anything else (a missing id, malformed or non-JSON output, or an error) counts as unconfirmed. You can show the tour and dispatch the checker in the same reply, so the check runs while the user reads.

- Regenerate each unconfirmed question **once**, using the checker's reason, and send only the new ones back to the checker.
- If at least 2 questions are confirmed, continue with the confirmed ones only (2 or 3).
- If fewer than 2 are confirmed after that one regeneration: tell the user this zone is too unclear to quiz on yet, so the tour is the session today. Run `node "<base>/../../dist/umap.js" unverifiable --zone "<zone id>"` (the map will show it as "hard to verify") and record nothing else. Stop.

Never show an unconfirmed question.

## 5. Ask, one at a time

Before the first question, ask the user to answer in their own words without AI help or searching. It is on their honour; the point is learning, not proctoring. "I'm not sure" is a fine answer.

For each confirmed question: ask it, wait for the answer, then grade it against the confirmed key:

- **pass:** the essential point is right, in any wording.
- **partial:** on the right track but missing or blurring a key part.
- **miss:** wrong, or "I don't know".

Give the grade and a short explanation that cites the code (`file:line`), then move to the next question. Be encouraging on misses: the explanation is the teaching.

## 6. Record

Run `node "<base>/../../dist/umap.js" record --kind session --zones "<zone id>" --grades <g1>,<g2>[,<g3>]` with the grades in question order (`pass`, `partial` or `miss`).

The first line it prints is always `Result: pass`, `Result: partial` or `Result: miss`. Branch on that line:

- **`Result: pass` or `Result: partial`:** the lines after it are either changes, `zone: Before → After (level a → b)`, or `No change on the map.`. Show each change as `zone: Before → After` (for example "payments: Dark → Owned") and call the new level an estimate. If it says `No change on the map.`, say the result is recorded and the zone's estimate was already at or above that level, so the map looks the same.
- **`Result: miss`:** nothing changed on the map. Suggest trying this zone again in 3 or more days, with different questions.

A pass also clears the zone's "hard to verify" and "unreviewed agent code" marks.

You may end with one optional line: "Want to see it? /understanding-map:visualize <zone id>".

## Stopping

If the user stops, skips or changes topic at any point, stop there and record nothing: no `record`, no `unverifiable`. No guilt, no nagging. Aim to finish the whole session in under 5 minutes.
