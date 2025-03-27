// This helper imports the built index.js and logs its export keys.
import * as kit from "../dist/index.js";
console.log("Exported keys from ./dist/index.js:", Object.keys(kit));
