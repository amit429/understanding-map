---
name: setup
description: Use when the user wants to set up Understanding Map in this repository, switch it between solo and team mode, or mark which paths are critical. Also runs on first use, before the first map or learning session.
---

# Set up Understanding Map

Two choices, then one command. Keep it short and plain.

## Running the engine

Claude Code shows `Base directory for this skill: <path>` when this skill loads. Call that path `<base>` and run every engine command as `node "<base>/../../dist/umap.js" <cmd>` from the user's repository. If no base directory was shown, use `node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" <cmd>` instead.

## Steps

1. **Check the current state.** Run `node "<base>/../../dist/umap.js" status --json`. It prints `{"setUp": …, "mode": …, "root": …}`. If it is already set up, tell the user the current mode and ask whether they want to change anything. If they don't, stop here.

2. **Ask solo or team, in one question.** For example:

   > Is this repository just for you, or shared with a team?
   >
   > - **Solo:** everything Understanding Map keeps stays on this machine. All of `.understanding/` is ignored by git.
   > - **Team:** you commit `.understanding/config.json`, `.understanding/.gitignore`, `.understanding/events/` and `.understanding/agent-share/` with your normal commits, so teammates see who understands what. Only passed sessions and anonymous per-zone totals of agent-written lines are shared. Failed or partial attempts, your edit log and any per-person agent share never leave your machine.

   Wait for the answer. Do not guess from the repository.

3. **Optionally ask for critical paths.** One question, clearly skippable:

   > Any paths that are especially critical, like payments or auth? Give globs such as `src/payments/**`, or say "none".

   Critical paths rank higher on the map. Everything else uses defaults.

4. **Run setup.**
   - With critical paths: `node "<base>/../../dist/umap.js" setup --mode <solo|team> --critical "<glob>,<glob>"`
   - Without (skipped or "none"): `node "<base>/../../dist/umap.js" setup --mode <solo|team>`. This keeps any critical paths already in the config.
   - To remove existing critical paths, only when the user asks: `node "<base>/../../dist/umap.js" setup --mode <solo|team> --critical ""`

5. **Say what changed.** Show the command's output, then sum it up in a sentence or two: the mode, the config file written, any `.gitattributes` merge rules added. In team mode, repeat once that the plugin never makes commits; the user commits those files with their normal work.

6. **Suggest the next step:** `/understanding-map:map` to see which parts of the repository nobody understands yet.

## Rules

- Ask the questions one at a time and keep the wording plain.
- Never run `git commit`, `git add` or anything else that writes to git.
- If the command fails (for example, not inside a git repository), show the error line and stop.
