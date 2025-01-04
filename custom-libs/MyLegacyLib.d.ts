/**
 * MyLegacyLib is an alternative demonstration of a "UMD-ish" or "namespace-based" .d.ts approach.
 * This style is less recommended for modern ES usage, but can still be used if needed.
 */

// We declare a global namespace "MyLegacyLib"
declare namespace MyLegacyLib {
  function greetLegacy(name: string): void;

  class OldStylePerson {
    constructor(name: string);
    sayHelloLegacy(): string;
  }
}

// Then we export it as a namespace (not recommended for new code)
export as namespace MyLegacyLib;
export = MyLegacyLib;
