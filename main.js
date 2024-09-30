import {mazeTextToGraph, prettyPrintGraf} from "./graphGen.js";

let m = `
#..
.#.
...
...`;

let graf = mazeTextToGraph(m);

prettyPrintGraf(graf);
console.log("y");