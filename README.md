# Action Scripts for Drafts

This repository contains a collection of action scripts for the [Drafts](https://getdrafts.com/) app.


## Repository Structure

All source code is written in Typescript files in the `src` directory.
The Typescript files are roughly organized into Drafts action groups.

It is good practice to dedicate a separate function to each Drafts action.
This has the advantage that only a single function call is required in the Drafts `Script` step.


### Bundling

Drafts expects a single Javascript file that contains all the code used in Drafts actions.
To bundle all Typescript files in the `src` directory into a single Javascript file (here `drafts-actions.js`), the project has moved from the [Rollup](https://rollupjs.org) bundler to using [Bun](https://bun.sh).
Bun not only simplifies the bundling process, but additionally replaces `npm` as a package manager and `node` as a runtime environment.

The bundling process is straightforward:

- All Drafts actions (functions in the `src/*.ts` Typescript files) are re-exported in the `src/index.ts` file.

- The `scripts/build.js` script uses `src/index.ts` as the entry point and bundles all Typescript files into a single Javascript file `drafts-actions.js`. The name of this output file is later used in the `Script` step of Drafts actions.

    ```js
    const ENTRYPOINT = "src/index.ts";
    const OUTPATH = "drafts-actions.js";

    const result = await Bun.build({
    entrypoints: [ENTRYPOINT],
    format: "esm",
    sourcemap: "none",
    });
    ```

- One additional cleanup step is required to make the bundled Javascript file compatible with Drafts.
The bundled Javascript file contains exports at the end, which is not supported by Drafts.
Therefore, the `scripts/build.js` script removes the exports section from the bundled Javascript file prior to writing the bundled output to `drafts-actions.js`.

- The bundling process is executed by running `bun scripts/build.js` from the command line, or, alternatively, `bun run build` as defined in the `scripts` section of the `package.json` file.
To run the bundling process in watch mode, use `bun watch`.


## Usage inside Drafts

### JSON-Based Ephemeral Draft Action

**New Note**: If you supply a `draftData` object, our script creates a brand-new Draft with that content (and optional flags/tags). The ephemeral JSON draft is trashed, but the new Draft persists, allowing the queued action to properly access the template tags and content.

**Motivation**: Often you want to call Drafts from an external app, pass it some structured data, and let Drafts run an action. Since the built-in URL scheme does not allow passing parameters beyond `text`, you can embed your parameters as JSON in the `text` field, have Drafts parse them, create a new Draft if desired, and then trash only the ephemeral JSON draft.

For example:
```json
{
  "draftAction": "MyActionName",
  "draftData": {
    "content": "Hello from JSON",
    "title": "My Title",
    "flagged": true
  },
  "params": {
    "someParameter": 123
  }
}

In this scenario, draftData describes the real Draft you want created. Meanwhile, params are stored as CustomParams on that new draft for your queued action. The ephemeral JSON draft is trashed to keep the workspace clean.

**Motivation**: Often you want to call Drafts from an external app, pass it some structured data, and let Drafts run an action. Since the built-in URL scheme does not allow passing parameters beyond `text`, you can embed your parameters as JSON in the `text` field, have Drafts parse them, and then trash the draft automatically.

**How to Set Up**:
1. Add the `runDraftsActionExecutor` function to a Drafts action step (via a "Script" step):
	```js
	require("custom-scripts/drafts-actions.js");
	runDraftsActionExecutor();

	2.	From your external app or automation, call:

drafts://x-callback-url/create?text={"draftAction":"NameOfAction","params":{"sampleKey":"sampleValue"}}&action=Drafts%20Action%20Executor

```
drafts://create?text=%7B%22draftAction%22%3A%22NameOfAction%22%2C%22params%22%3A%7B%22sampleKey%22%3A%22sampleValue%22%7D%7D&action=Drafts%20Action%20Executor
```

	•	The parameter text includes a JSON object with:
	•	draftAction : The name of the action to queue after parsing.
	•	params : (Optional) A freeform JSON object for custom script parameters, if needed.
	•	The action portion (Drafts%20Action%20Executor) should match the name of the Drafts action that contains the script above.

What Happens:
	1.	Drafts creates a new draft containing that JSON payload.
	2.	The newly created draft automatically runs the Drafts Action Executor action (because of the action parameter).
	3.	The script in Drafts Action Executor parses the draft’s content as JSON, queues the action named in draftAction, and then trashes the draft to keep it ephemeral.

Example:
If draftAction is MyTodoistSyncAction, the script will attempt:

let a = Action.find("MyTodoistSyncAction");
app.queueAction(a, draft);

and then trash the ephemeral draft.

This mechanism can be extended to pass any structured data you wish, potentially reading more advanced parameters in your queued script with additional logic.

User scripts can be connected to the Drafts app as follows:

1. Move the scripts directory inside the default Drafts Scripts directory - in my case `~/Library/Mobile Documents/iCloud~com~agiletortoise~Drafts5/Documents/Library/Scripts`
1. Choose the `Script` step inside a Drafts action and import the function for this action with `require()` from the bundled Javascript file. Provide the **relative path to the script file** with respect to the default Drafts scripts directory. Then call the function for this action.

### Example

The following example uses the `insertMarkdownLink()` function inside a Drafts action.
This user scripts repository is a child directory of the default Drafts Scripts directory with the name `custom-scripts`.
The bundled Javascript file is named `drafts-actions.js`.

Then, the code inside the action `Script` step is

```javascript
require("custom-scripts/drafts-actions.js")

insertMarkdownLink()
```


## Resources

- The idea to modularize scripts into separate files originates from [this forum discussion](https://forums.getdrafts.com/t/developing-outside-of-drafts).

- The `drafts-type-definitions.js` file is provided by Greg Pierce (the Drafts creator) and copied from [his GitHub repository](https://github.com/agiletortoise/drafts-script-reference/blob/main/docs/drafts-definitions.js).
