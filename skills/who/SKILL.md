---
name: who
description: Use when the user asks who understands a file, directory or zone of this repository, who they could ask about some code, or whether anyone at all still understands it (bus factor), with the evidence behind each estimate.
argument-hint: <path>
---

# Who understands this code?

The user's argument: `$ARGUMENTS`

## Running the engine

Claude Code shows `Base directory for this skill: <path>` when this skill loads. Call that path `<base>` and run every engine command as `node "<base>/../../dist/umap.js" <cmd>` from the user's repository. If no base directory was shown, use `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>` instead.

## Steps

1. If no path was given, ask which file or directory they mean. A zone id from the map works too.
2. Run `node "<base>/../../dist/umap.js" who <path>`.
3. Show the output verbatim in a code block. It lists who understands the zone (or "nobody"), the evidence behind each level, and anyone inactive separately.
4. Add at most one plain sentence after it, such as: if nobody understands the zone, `/understanding-map:learn <path>` is a 5-minute way to change that.

If the engine says no zone was found, say so and suggest `/understanding-map:map` to see the zone ids.

## Rules

- Levels are **estimates** from git history and sessions. Call them that.
- Do not add to, rank or interpret what the output says about any person. Never mention or guess how much of a person's code agents wrote, and never say who failed anything (failures are never recorded in shared data).
