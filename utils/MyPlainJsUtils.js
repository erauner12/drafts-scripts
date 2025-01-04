/**
 * MyPlainJsUtils.js
 *
 * A small collection of pure JS utility functions.
 * No TypeScript here, just normal JavaScript.
 */

// A simple random integer function
function getRandomInt(min, max) {
  // inclusive of min, exclusive of max
  return Math.floor(Math.random() * (max - min)) + min;
}

// A function that capitalizes the first letter of a string
function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Example: returning an object or array
function createRange(start, end) {
  // returns an array of numbers from start..end-1
  const arr = [];
  for (let i = start; i < end; i++) {
    arr.push(i);
  }
  return arr;
}

// We'll attach all these utilities to a single export object
// so we can import them in a TS file as needed.
export {
  getRandomInt,
  capitalizeFirst,
  createRange
};