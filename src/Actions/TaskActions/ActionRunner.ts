/**
 * ActionRunner.ts
 * This script invokes TaskMenu_run() from TaskMenu.ts.
 *
 * Link this to a Drafts action step or run it directly to open the task menu.
 */

import { openTaskMenu } from "./TaskMenu";

export function ActionRunner_run(): void {
  openTaskMenu();
}
