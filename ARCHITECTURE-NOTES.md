# Architecture Notes: Executor vs. Actions

## Overview
In this repository, our **DraftActionExecutor** plays a specialized role:
- It **parses** ephemeral or fallback JSON to figure out which action should be queued.
- It **queues** that action on the correct draft.
- It **trashes** ephemeral drafts after processing.

Meanwhile, your **user-defined actions** (like `MyActionName` or `ManageDraftWithPrompt`) handle:
- Business logic and user interactions (prompting, setting tags, archiving drafts, etc.)
- Possibly reloading the draft in the editor to show changes.

## Who Should Handle Editor/Workspace Reloads?
It depends on your workflow design:

1. **Minimal Executor**
   - **Executor** stays simple and does not do user interaction or editor reloads.
   - **Actions** (like `MyActionName`) handle user prompts, reloading the editor, or modifying the workspace.
   - This approach keeps the Executor’s logic “clean” and focused on ephemeral/fallback JSON.

2. **Full Orchestration in Executor**
   - The **Executor** might handle loading the correct workspace, reloading the editor, or performing additional post-processing steps.
   - Your user actions become simpler “pure logic modules” that rely on the Executor to do environment setup and teardown.
   - This can centralize orchestration in one place (the Executor) but can complicate the Executor logic if you have many diverse actions.

3. **Hybrid Approach**
   - Some minimal environment checks in the Executor (like ensuring a certain workspace is active) but letting each action do final reloading of the draft if needed.
   - Possibly the Executor sets a “thisWorkspaceNeedsToBeActive” tag or modifies some ephemeral data that an action can read to know which environment to re-load.

## Recommendation
Most people opt for a **Minimal Executor** pattern:
1. **Executor**: Minimal ephemeral JSON logic – parse, queue the real action, optionally trash ephemeral draft.
2. **User Action**: All user interaction, editor reloading, tagging, or workspace modifications.

This avoids conflating ephemeral logic (which is universal to every queued action) with your domain-specific logic (which is unique to each action). It also avoids complicated branching in the Executor, so the same Executor can be reused across many different use cases. If you truly want a single script that orchestrates everything, a “ManageDraftWithPromptExecutor” approach can be used. But in typical Drafts usage, each action is free to do final steps, including reloading the editor or presenting prompts.
