# How to Import and Use External or Custom Libraries in Drafts

This guide walks you through some common scenarios for integrating external code (e.g., npm packages or your own custom TypeScript libraries) into Drafts.

## 1. Prerequisites

- **Bun** for bundling and dependency management
- A `tsconfig.json` with appropriate `"include"` entries for your source files and `"typeRoots"` for your `.d.ts` definitions
- The `scripts/build.js` script that runs `Bun.build`, uses your `removeExportsPlugin`, and writes out `drafts-actions.js`
- A general understanding of how Drafts loads code:
	1. You run `bun run build` or `bun watch` to compile/bundle your code into `drafts-actions.js`.
	2. You have a Drafts action script that does `require("custom-scripts/drafts-actions.js");` and calls your function(s).

## 2. Installing a Node Module from npm

For libraries available on npm, such as **lodash**:
1. **Install** them in your project using Bun or npm. For example:
	```bash
	bun add lodash @types/lodash

or with npm:

npm install lodash @types/lodash

	2.	Import them in your TypeScript code. For instance:

import _ from "lodash";

export function exampleUsingLodash() {
	const array = [1, 2, 3, 4];
	const shuffled = _.shuffle(array);
	console.log("Shuffled array:", shuffled);
}

	•	If you have type definitions installed (@types/lodash), the IDE/TS compiler recognizes the _ import.

	3.	Export that function so it’s included in your final bundle. For instance, in src/ExampleUsingLodash.ts, export it:

export function exampleUsingLodash() {
	// ... code ...
}


	4.	Ensure that function is re-exported from src/index.ts:

export { exampleUsingLodash } from "./ExampleUsingLodash";

	•	Place the export lines in or near the top or among your other exports so it does not get truncated by removeExportsPlugin.

	5.	Use it in a Drafts action:

require("custom-scripts/drafts-actions.js");
exampleUsingLodash();

Drafts will run that function, picking it up from your final drafts-actions.js.

3. Creating Your Own Local Custom Library

3.1. Type Definitions

Sometimes you have a custom .ts or .js library plus a corresponding .d.ts file. Suppose you create custom-libs/MyCoolLib.ts (the actual code) and custom-libs/MyCoolLib.d.ts (the type definitions). Example:

custom-libs/MyCoolLib.ts

export function greet(name: string): void {
	console.log("Hello, " + name);
}

export class Person {
	name: string;
	constructor(name: string) {
	this.name = name;
	}
	sayHello(): string {
	return "Hi, I'm " + this.name;
	}
}

custom-libs/MyCoolLib.d.ts

declare namespace MyCoolLib {
	function greet(name: string): void;

	class Person {
	constructor(name: string);
	sayHello(): string;
	}
}

// We can export as a namespace or ES modules. For instance:
export as namespace MyCoolLib;
export = MyCoolLib;

(If you are using strict ES modules, you might define it differently. The above is for a namespace usage approach.)

3.2. Using the Custom Library

In one of your TypeScript files, e.g. src/ExampleUsingMyCoolLib.ts:

// If you're using your library in pure ES module form, you might do:
import * as MyCoolLib from "../custom-libs/MyCoolLib";
import { log } from "./helpers-utils";

export function exampleUsingMyCoolLib() {
	// usage:
	MyCoolLib.greet("Evan");

	const me = new MyCoolLib.Person("Evan");
	log("Person says: " + me.sayHello());
}

(Adjust the import style to match how you declared your library. For example, if your library is an ES module, you might do a default or named export instead. If it’s a namespace export, you might do a /// <reference path="..." /> or declare global approach.)

3.3. Re-export from index.ts

So the final bundle includes this code, add a line in src/index.ts:

export { exampleUsingMyCoolLib } from "./ExampleUsingMyCoolLib";

Again, ensure it’s not after your final export { ... } or any extraneous code that your removeExportsPlugin might truncate.

3.4. Use in a Drafts Action

require("custom-scripts/drafts-actions.js");
exampleUsingMyCoolLib();

If you see an error about “Cannot find variable: exampleUsingMyCoolLib,” verify that you spelled the function name the same as your export, and that the removeExportsPlugin isn’t removing it.

4. Avoiding the removeExportsPlugin Truncation

Key: The removeExportsPlugin scans your compiled JS for the last occurrence of export, then truncates everything after it to avoid Drafts complaining about leftover exports. Therefore:
	•	Place your exports or functions above the last export to ensure your code is not truncated.
	•	Alternatively, consider searching for ways to patch the plugin to remove only the export statement lines but not the rest. But the simplest approach is to keep all your code/exports before that last export.

5. Running the Bundling Step

When you run bun run build (or bun watch), it will:
	1.	Compile your TypeScript using the settings in tsconfig.json.
	2.	Bundle everything into index.js.
	3.	Apply the removeExportsPlugin, removing leftover ES export lines from the final code so that Drafts can handle it.
	4.	Write out drafts-actions.js.

Check the logs to see if your function(s) appear before the final truncated portion.

6. Testing in Drafts
	1.	Create or open a Draft in the editor.
	2.	Create a Drafts action with a “Script” step that includes:

require("custom-scripts/drafts-actions.js");
exampleUsingLodash();
// Or any other function you exported


	3.	Run the action. Check the Drafts log or console to confirm success.

7. Troubleshooting
	1.	ReferenceError: “Cannot find variable: MyFunction”
	•	Check your function name in src/index.ts is spelled identically to your real function.
	•	Make sure the removeExportsPlugin didn’t truncate your code by accident (put your export lines earlier).
	•	Verify in drafts-actions.js that the code is there.
	2.	Import Errors: “Could not resolve …”
	•	Double-check the relative path to your custom-libs or external modules.
	•	Confirm the file actually exists at that path.
	3.	TypeScript: “… is not a module”
	•	Possibly your .d.ts is using a different style of module declaration. You might need export = MyCoolLib; or declare module syntax.
	4.	Case Sensitivity: “exampleUsingLodash” vs “ExampleUsingLodash”
	•	JavaScript is case-sensitive; always match the exact name.

8. Summary

You now have a complete pipeline to:
	•	Install or create external code.
	•	Reference official or custom type definitions.
	•	Import and re-export them from TypeScript.
	•	Bundle the entire result into Drafts in a single drafts-actions.js file.

As a final step, keep your local documentation updated so you know exactly how to repeat these steps whenever you add new dependencies or new custom libraries.