# Drafts Executor: Architecture & Integration

## 1. Make the Executor a First-Class Citizen

Now that we've introduced `Executor.ts`, we also have a helper method `queueJsonAction()` which writes ephemeral JSON directly to the active draft (or sets fallback data) and queues the “Drafts Action Executor” automatically. This makes ephemeral JSON-based calls simpler and standard across all actions. For example, in `ManageDraftWithPromptExecutor.ts` we replaced manual sets of `ExecutorData` with a single `queueJsonAction()` call.

We already have two key scripts:

- **`DraftActionExecutor`** (handles ephemeral JSON => finds `draftAction` => queues an action)
- **`BatchProcessAction`** (parses ephemeral or fallback JSON => possibly re-queues again)

Currently, these scripts let us:
- Call Drafts externally with JSON (ephemeral approach).
- Or store fallback JSON in `ExecutorData`.
- Or default to prompting the user if no JSON is found.

**Goal**: Turn this into a “first-class” solution widely re-used across actions.
**Strategy**:
1. Maintain or unify the “Executor” logic in a single script (like our existing `DraftActionExecutor.ts`).
2. Possibly create utility methods or classes if we want friendlier function calls, e.g. `app.extendedQueueJSON(...)`.
3. Rely on built-in `app.queueAction(...)` for the final step—**we are simply augmenting the path to get the desired action name & optional ephemeral data**.

## 2. Incorporate Drafts’ Type Definitions

Drafts provides official TypeScript definitions in the [Drafts GitHub repo](https://github.com/agiletortoise/drafts-script-reference). You can reference them so that you don’t have to define `App`, `Draft`, `Prompt`, etc. yourself. In your `tsconfig.json`, you can do something like:

```json
{
	"compilerOptions": {
	"module": "ESNext",
	"target": "ESNext",
	"moduleResolution": "node",
	"lib": ["ESNext", "DOM"],
	"typeRoots": [
		"./node_modules/@types",   // if installed via e.g. npm
		"./my-drafts-types"        // or the folder containing the official .d.ts
	],
	...
	},
	"include": [
	"./my-drafts-types/*.d.ts",
	"./src/**/*.ts"
	]
}

Then drop the .d.ts files from Drafts (such as App.d.ts, Draft.d.ts, etc.) into that my-drafts-types directory so your TypeScript build can see and use them. Now your code can refer to declare var app: App;, etc. without having to re-declare them in your own definitions.

3. Approach That Fits Our Proposed Direction
	•	Use DraftActionExecutor as the universal entry point for ephemeral JSON.
	•	Optionally define a new “Batch” or “Multi-Executor” method if you want advanced chaining.
	•	Import the official .d.ts files for full type coverage.
	•	Continue removing “export” statements with your removeExportsPlugin, since Drafts can’t handle them in the final script.

Potential Layout:
	1.	src/Executor.ts
	•	Contains runDraftsActionExecutor()
	•	Possibly exports a small utility function e.g. queueJsonAction(jsonData: any) that internally sets ephemeral content, etc.
	2.	src/BatchProcessAction.ts
	•	Illustrates a standard usage of ephemeral or fallback data.
	3.	tsconfig.json includes the official Drafts *.d.ts.

This “execution” design is already quite close to what you have: ephemeral JSON => parse => queue => done. By incorporating the official types, your code is recognized by TypeScript with minimal duplication.

Final: Because you already have a working ephemeral system, this approach simply organizes it better, merges official type definitions, and ensures everything is typed. That makes the Executor pattern truly “first-class” for your entire repo.
