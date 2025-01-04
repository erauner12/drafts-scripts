/**
 * MyCoolLib is a fictional library that demonstrates how to declare custom type definitions
 * in a local .ts file. We match the .d.ts exports exactly, for consistent ES modules usage.
 */

/** Prints a greeting */
export function greet(name: string): void {
  console.log("Hello from MyCoolLib, " + name);
}

/** A sample class */
export class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  sayHello(): string {
    return `Hi, I'm ${this.name}`;
  }
}
