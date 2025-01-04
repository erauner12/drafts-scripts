/**
 * runDraftsActionExecutor()
 *
 * This script is designed to parse the current draft content as JSON,
 * find a `draftAction` by name, queue that action to run, and finally
 * trash the current draft, treating it as ephemeral data storage.
 *
 * Example usage from outside of Drafts:
 *
 *   drafts://x-callback-url/create?text={"draftAction":"SomeActionName","params":{"key":"value"}}&action=Drafts%20Action%20Executor
 * Parses the current draft as JSON, finds a `draftAction` by name, queues that action,
 * then trashes the ephemeral draft.
 */

/**
 * For backwards compatibility, we re-export runDraftsActionExecutor
 * from the new Executor.ts module. If you prefer, you can remove this file
 * entirely and update references to point to "Executor.ts".
 */

import { runDraftsActionExecutor } from "./Executor";

export { runDraftsActionExecutor };
