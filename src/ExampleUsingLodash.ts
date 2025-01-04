import _ from "lodash";
// The import above uses the official types for lodash installed via "npm install --save lodash @types/lodash"

import { greet, Person } from "../custom-libs/MyCoolLib";
import { log } from "./helpers/helpers-utils";
// Using ES modules import syntax

// Example usage of lodash:
export function exampleUsingLodash() {
  const array = [1, 2, 3, 4];
  const shuffled = _.shuffle(array);
  log("Shuffled array: " + shuffled.join(", "));
}

// Example usage of MyCoolLib:
export function exampleUsingMyCoolLib() {
  greet("Evan");

  const me = new Person("Evan");
  log("Person says: " + me.sayHello());
}