# Drafts Executor: Architecture & Integration

## 1. Make the Executor a First-Class Citizen

## ES Modules for Local Custom Libraries

## Alternative Legacy / UMD-ish Approach
If you have older code (or a code snippet you can’t easily rewrite), you might use a namespace-based .d.ts + a global script that attaches itself to `globalThis`. For instance:

- **`MyLegacyLib.d.ts`**:
	```ts
	declare namespace MyLegacyLib {
	function greetLegacy(name: string): void;
	class OldStylePerson {
		// ...
	}
	}
	export as namespace MyLegacyLib;
	export = MyLegacyLib;

	•	MyLegacyLib.js:

(function (root) {
	function greetLegacy(name) { ... }
	class OldStylePerson { ... }
	root.MyLegacyLib = { greetLegacy, OldStylePerson };
}(globalThis));



Then, when you load MyLegacyLib.js (e.g. require("custom-libs/MyLegacyLib.js") in Drafts), you end up with a global MyLegacyLib object. Using it in code might look like:

MyLegacyLib.greetLegacy("someone");
let oldP = new MyLegacyLib.OldStylePerson("someone else");

Caveat: This is not recommended for new code, but it can be useful if you must integrate older patterns or third-party UMD libraries.
If you prefer standard ES modules for your custom `.ts` + `.d.ts` libraries, define them like so:

- **`MyCoolLib.d.ts`**:
	```ts
	export function greet(name: string): void;
	export class Person {
	constructor(name: string);
	sayHello(): string;
	}

	•	MyCoolLib.ts:

export function greet(name: string): void {
	console.log("Hello from MyCoolLib, " + name);
}
export class Person {
	// ...
}


	•	Then import using named exports:

import { greet, Person } from "../custom-libs/MyCoolLib";
greet("Evan");
const me = new Person("Evan");



This avoids the “UMD global vs. module” warnings and keeps everything aligned with modern ES module usage.

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