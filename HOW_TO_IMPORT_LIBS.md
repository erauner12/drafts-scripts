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
```
or with npm:
```bash
npm install lodash @types/lodash
```

2. Import them in your TypeScript code. For instance:
```ts
import _ from "lodash";

export function exampleUsingLodash() {
  const array = [1, 2, 3, 4];
  const shuffled = _.shuffle(array);
  console.log("Shuffled array:", shuffled);
}
```

3. Export that function so it’s included in your final bundle. For instance, in `src/ExampleUsingLodash.ts`:
```ts
export function exampleUsingLodash() {
  // ... code ...
}
```

4. Ensure that function is re-exported from `src/index.ts`:
```ts
export { exampleUsingLodash } from "./ExampleUsingLodash";
```

5. Use it in a Drafts action:
```js
require("custom-scripts/drafts-actions.js");
exampleUsingLodash();
```

Drafts will run that function, picking it up from your final `drafts-actions.js`.

3. Creating Your Own Local Custom Library

3.1. Type Definitions

Sometimes you have a custom `.ts` or `.js` library plus a corresponding `.d.ts` file. Suppose you create `custom-libs/MyCoolLib.ts` (the actual code) and `custom-libs/MyCoolLib.d.ts` (the type definitions). Example:

`custom-libs/MyCoolLib.ts`
```ts
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

`custom-libs/MyCoolLib.d.ts`

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
```

(If you are using strict ES modules, you might define it differently. The above is for a namespace usage approach.)

3.2. Using the Custom Library

In one of your TypeScript files, e.g. `src/ExampleUsingMyCoolLib.ts`:

```js
// If you're using your library in pure ES module form, you might do:
import * as MyCoolLib from "../custom-libs/MyCoolLib";
import { log } from "./helpers-utils";

export function exampleUsingMyCoolLib() {
	// usage:
	MyCoolLib.greet("Evan");

	const me = new MyCoolLib.Person("Evan");
	log("Person says: " + me.sayHello());
}
```

(Adjust the import style to match how you declared your library. For example, if your library is an ES module, you might do a default or named export instead. If it’s a namespace export, you might do a /// <reference path="..." /> or declare global approach.)

3.3. Re-export from index.ts

So the final bundle includes this code, add a line in `src/index.ts`:

```
export { exampleUsingMyCoolLib } from "./ExampleUsingMyCoolLib";
```

Again, ensure it’s not after your final `export { ... }` or any extraneous code that your `removeExportsPlugin` might truncate.

3.4. Use in a Drafts Action

```
require("custom-scripts/drafts-actions.js");
exampleUsingMyCoolLib();
```

If you see an error about “Cannot find variable: exampleUsingMyCoolLib,” verify that you spelled the function name the same as your export, and that the `removeExportsPlugin` isn’t removing it.

4. Avoiding the removeExportsPlugin Truncation

Key: The `removeExportsPlugin` scans your compiled JS for the last occurrence of `export`, then truncates everything after it to avoid Drafts complaining about leftover exports. Therefore:
	•	Place your exports or functions above the last `export` to ensure your code is not truncated.
	•	Alternatively, consider searching for ways to patch the plugin to remove only the `export` statement lines but not the rest. But the simplest approach is to keep all your code/exports before that last `export`.

5. Running the Bundling Step

When you run `bun run build` (or `bun watch`), it will:
	1.	Compile your TypeScript using the settings in `tsconfig.json`.
	2.	Bundle everything into `index.js`.
	3.	Apply the `removeExportsPlugin`, removing leftover ES `export` lines from the final code so that Drafts can handle it.
	4.	Write out `drafts-actions.js`.

Check the logs to see if your function(s) appear before the final truncated portion.

6. Testing in Drafts
	1.	Create or open a Draft in the editor.
	2.	Create a Drafts action with a “Script” step that includes:

```js
require("custom-scripts/drafts-actions.js");
exampleUsingLodash();
// Or any other function you exported
```


	3.	Run the action. Check the Drafts log or console to confirm success.

7. Troubleshooting
	1.	ReferenceError: “Cannot find variable: MyFunction”
	•	Check your function name in `src/index.ts` is spelled identically to your real function.
	•	Make sure the `removeExportsPlugin` didn’t truncate your code by accident (put your export lines earlier).
	•	Verify in `drafts-actions.js` that the code is there.
	2.	Import Errors: “Could not resolve …”
	•	Double-check the relative path to your custom-libs or external modules.
	•	Confirm the file actually exists at that path.
	3.	TypeScript: “… is not a module”
	•	Possibly your `.d.ts` is using a different style of module declaration. You might need `export = MyCoolLib;` or `declare module` syntax.
	4.	Case Sensitivity: “exampleUsingLodash” vs “ExampleUsingLodash”
	•	JavaScript is case-sensitive; always match the exact name.

## 8. Example: Using Your Own ".d.ts" for a Custom Library

Often you’ll want to have both:
1. A **.d.ts** file with *type definitions* (which your IDE & TypeScript compiler use).
2. A **.ts** (or .js) file with the *actual implementation*.

### 8.1. Folder Structure

Suppose you have this:

```plaintext
custom-libs/
├── MyCoolLib.ts
└── MyCoolLib.d.ts
```

### 8.2. The `.d.ts` File

**`MyCoolLib.d.ts`** (just the declarations—no implementation):
```ts
/**
 * MyCoolLib is a fictional library that demonstrates how to declare custom type definitions
 * in a local .d.ts file.
 */

// Option A) Use a namespace-style declaration:
declare namespace MyCoolLib {
  function greet(name: string): void;

  class Person {
    constructor(name: string);
    sayHello(): string;
  }
}

// We can export as a namespace or common module approach:
export as namespace MyCoolLib;
export = MyCoolLib;
```

• Here, we define a `MyCoolLib` namespace with a `greet(...)` function and a `Person` class.  
• We also have `export as namespace MyCoolLib;` which indicates if someone does an import like:

```ts
import * as MyCoolLib from "../custom-libs/MyCoolLib";
```

the compiler knows those are inside that namespace.

### 8.3. The Implementation .ts File

**`MyCoolLib.ts`** (actual code):
```ts
export function greet(name: string): void {
  console.log("Hello, " + name);
}

export class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  sayHello(): string {
    return "Hi, I'm " + this name;
  }
}
```

• Notice we have the same function/class names as in the `.d.ts`.  
• Export them so the bundler picks them up as ES modules.

### 8.4. Telling TypeScript to Include Both

In your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "typeRoots": [
      "./drafts-type-individual",
      "./custom-libs"
    ],
    ...
  },
  "include": [
    "./drafts-type-individual/*.d.ts",
    "./custom-libs/*.d.ts",
    "./src/**/*.ts"
  ]
}
```

This means TypeScript will see both your `MyCoolLib.d.ts` definitions and your `MyCoolLib.ts` implementation code.

### 8.5. Usage

```ts
import * as MyCoolLib from "../custom-libs/MyCoolLib";
import { log } from "./helpers-utils";

export function exampleUsingMyCoolLib() {
  MyCoolLib.greet("Evan");

  const me = new MyCoolLib.Person("Evan");
  log("Person says: " + me sayHello());
}
```

Now your IDE/TS compiler can see the function signatures from `MyCoolLib.d.ts`. The runtime code is from `MyCoolLib.ts`.

Finally, re-export it from `src/index.ts` so it doesn’t get truncated:
```ts
export { exampleUsingMyCoolLib } from "./ExampleUsingMyCoolLib";
```

### 8.6. Verifying Inside Drafts

```js
require("custom-scripts/drafts-actions.js");
exampleUsingMyCoolLib();
```

When you run it, you should see:
Hello, Evan  
Person says: Hi, I'm Evan

### 8.7. Additional Notes
• If you see a complaint “Cannot find module ‘…/MyCoolLib.ts’,” ensure the path is correct.  
• If you want a single-file approach, you could merge the definitions & code into one file.  
• For old-school CommonJS exports, adapt your `.d.ts` accordingly.

## 9. Dealing with "UMD Global vs. Module" in .d.ts

TypeScript can define a library as a **namespace** (typical of older or global-based libraries) *or* an **ES module**. If your `.d.ts` declares `export as namespace MyCoolLib`, TypeScript sees it as something that can be used globally or via `import * as MyCoolLib`.

### Option A) Keep the Namespace

If you want to keep the “namespace + export as namespace” in your `.d.ts`:

**`MyCoolLib.d.ts`**:
```ts
declare namespace MyCoolLib {
  function greet(name: string): void;
  class Person {
    constructor(name: string);
    sayHello(): string;
  }
}
export as namespace MyCoolLib;
export = MyCoolLib;
```

Then, your `.ts` usage is typically:
```ts
import * as MyCoolLib from "../custom-libs/MyCoolLib";
import { log } from "./helpers-utils";

export function exampleUsingMyCoolLib() {
  MyCoolLib.greet("Evan");
  const me = new MyCoolLib.Person("Evan");
  log("Person says: " + me.sayHello());
}
```

Do not try `import { greet } from "../custom-libs/MyCoolLib"` in that scenario, because the `.d.ts` is describing a single “UMD/namespace” export. If you do so, you’ll see warnings like “MyCoolLib refers to a UMD global, but the current file is a module.”

### Option B) Convert to “Normal ES Module” Declarations

If you prefer standard ES module style—such as:
```ts
import { greet, Person } from "../custom-libs/MyCoolLib";
```
Then your `.d.ts` should define individual exports, for example:

```ts
// MyCoolLib.d.ts
export function greet(name: string): void;

export class Person {
  constructor(name: string);
  sayHello(): string;
}
```

(No `export as namespace` or `export = MyCoolLib;`.)

And your `.ts` file matches:

```ts
// MyCoolLib.ts
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
```

Now TypeScript sees a normal ES module:

```ts
import { greet, Person } from "../custom-libs/MyCoolLib";
greet("Evan");
const me = new Person("Evan");
```

No more “UMD global vs. module” clash.

#### Decide Which Style is Best
- If you have legacy `.d.ts` or a library that’s built as UMD, you might do Option A.  
- If your code is new and you want conventional ES modules, do Option B.  

Then, your imports become straightforward. Also, remember to keep your `tsconfig.json` pointing to the right directories:

```json
{
  "compilerOptions": {
    "typeRoots": [
      "./drafts-type-individual",
      "./custom-libs"
    ]
  },
  "include": [
    "./drafts-type-individual/*.d.ts",
    "./custom-libs/*.d.ts",
    "./src/**/*.ts"
  ]
}
```

## 10. Summary

By choosing Option A (namespace + `import * as MyCoolLib`) or Option B (ES modules + multiple named exports), you’ll eliminate the “UMD global vs. module” warnings and get a consistent TypeScript experience.

You now have a complete pipeline to:
	•	Install or create external code.
	•	Reference official or custom type definitions.
	•	Import and re-export them from TypeScript.
	•	Bundle the entire result into Drafts in a single `drafts-actions.js` file.

As a final step, keep your local documentation updated so you know exactly how to repeat these steps whenever you add new dependencies or new custom libraries.
