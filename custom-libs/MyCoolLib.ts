/**
 * MyCoolLib.ts
 * Real code so we can import it at runtime.
 */

// This is actual JavaScript/TypeScript code:
export function greet(name: string): void {
  console.log("Hello, " + name);
}

export class Person {
  constructor(private name: string) {}

  sayHello(): string {
    return `Hi, I'm ${this.name}`;
  }
}