/**
 * MyCoolLib is a fictional library that demonstrates how to declare custom type definitions
 * in a local .d.ts file. These might represent external JavaScript code you wrote or found.
 */

// If it's purely a type definition:
declare namespace MyCoolLib {
  // Example: a function
  function greet(name: string): void;

  // Example: a class
  class Person {
    constructor(name: string);
    sayHello(): string;
  }
}

// Let the compiler know to put these in the global namespace or allow named import:
export as namespace MyCoolLib;
export = MyCoolLib;