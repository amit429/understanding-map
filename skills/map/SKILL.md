---
name: map
description: Use when the user wants to know which parts of this repository nobody understands well enough to explain, debug or safely change, where comprehension debt from AI-written code is worst, or wants the Understanding Map summary and HTML report.
---

# Show the Understanding Map

The map is computed by a deterministic scanner from git history, the plugin's own records and the code structure. It makes no LLM calls, so do not add analysis of your own on top of it.

## Running the engine

Claude Code shows `Base directory for this skill: <path>` when this skill loads. Call that path `<base>` and run every engine command as `node "<base>/../../dist/umap.js" <cmd>` from the user's repository. If no base directory was shown, use `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>` instead.

## Steps

1. **Check setup.** Run `node "<base>/../../dist/umap.js" status --json`. If `setUp` is `false`, follow the setup skill (`/understanding-map:setup`) first: ask solo or team, optionally critical paths, run setup. Then come back here.

2. **Build the map.** Run `node "<base>/../../dist/umap.js" map`. A first run on a large repository can take a couple of minutes, so give the command a generous timeout (5 minutes).

3. **Show the summary verbatim.** Put the command's output in a code block exactly as printed. Do not reorder, trim or reword it, and do not add scores of your own.

4. **Point to the report.** The output ends with `Report: <path>`. Tell the user they can open that file in a browser for the treemap, the ranked table and the evidence behind each zone. It loads nothing over the network.

5. **Suggest the next step.** `/understanding-map:learn` takes about 5 minutes and starts with the top danger zone. Or `/understanding-map:learn <zone>` for a specific one, and `/understanding-map:who <path>` to see who understands a zone and why.

## Rules

- Every level and state is an **estimate**. Say "estimate", never "score" as a fact.
- Do not comment on individual people, and never mention or guess how much of any person's code agents wrote. Agent-written share is only ever a zone total.
- Unknown zones mean "not enough evidence", not "bad". Do not describe them as dark.
- If the command fails, show its one-line error and stop.
