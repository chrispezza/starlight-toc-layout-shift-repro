// Prints the layout-shift result from the Lighthouse report `pnpm measure` wrote.
import { readFileSync } from "node:fs";

const { audits } = JSON.parse(readFileSync("./lighthouse.json", "utf8"));
console.log(`CLS ${audits["cumulative-layout-shift"].numericValue.toFixed(3)}`);
for (const item of audits["layout-shifts"].details?.items ?? []) {
	console.log(`  ${item.score.toFixed(3)}  ${item.node.selector}`);
}
