import { runManageDraftFlow } from "../Flows/ManageDraftFlow";

/**
 * runManageDraftWithPromptExecutor
 *
 * Thin shell to preserve backward compatibility. If you prefer,
 * references to this can switch to runManageDraftFlow directly.
 */
export function runManageDraftWithPromptExecutor(): void {
  runManageDraftFlow();
}
