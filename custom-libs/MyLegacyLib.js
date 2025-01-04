/**
 * MyLegacyLib.js
 *
 * This runtime code places "MyLegacyLib" onto the global scope.
 * If you import it (like a script), you'll get a global "MyLegacyLib" object you can call.
 *
 * USAGE (in Drafts, if you just require this file):
 *   require("custom-scripts/drafts-actions.js");
 *   MyLegacyLib.greetLegacy("Evan");
 *   const me = new MyLegacyLib.OldStylePerson("Evan");
 *   alert(me.sayHelloLegacy());
 */

// We'll attach it to the global object. For Node, we might do "globalThis" or "global" etc.
// For Drafts web environment, "this" might do. We'll use globalThis for best practice.

(function (root) {
  // define our objects
  function greetLegacy(name) {
    console.log("[MyLegacyLib] Hello from legacy greet, " + name);
  }

  class OldStylePerson {
    constructor(name) {
      this.name = name;
    }
    sayHelloLegacy() {
      return "[MyLegacyLib:Legacy] Hi, I'm " + this.name;
    }
  }

  // attach them to an object
  const MyLegacyLib = {
    greetLegacy,
    OldStylePerson,
  };

  // place it on root
  root.MyLegacyLib = MyLegacyLib;
})(globalThis);
