// Serves dist/ and sends every HTML page in two parts, pausing in the middle of
// the table of contents <aside>, so the browser paints before it has parsed
// the main pane. This stands in for a slow connection or a large document
// whose network chunk boundary falls inside the table of contents.
//
//   node serve-split.mjs            split inside the <aside>, 500 ms pause
//   node serve-split.mjs --no-split send each page in one piece
//   node serve-split.mjs --fix      split, and inject the one-rule workaround
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const root = new URL("./dist/", import.meta.url).pathname;
const split = !process.argv.includes("--no-split");
const fix = process.argv.includes("--fix");
const PAUSE_MS = 500;
const WORKAROUND =
	"<style>@media (min-width: 72rem) { .right-sidebar-container { margin-inline-start: auto; } }</style>";
const types = {
	".html": "text/html; charset=utf-8",
	".css": "text/css",
	".js": "text/javascript",
	".svg": "image/svg+xml",
	".webp": "image/webp",
};

createServer((req, res) => {
	let path = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
	if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
	if (!existsSync(path)) {
		res.statusCode = 404;
		res.end("not found");
		return;
	}
	res.setHeader("content-type", types[extname(path)] ?? "application/octet-stream");
	if (extname(path) !== ".html") {
		res.end(readFileSync(path));
		return;
	}
	let html = readFileSync(path, "utf8");
	if (fix) html = html.replace("</head>", `${WORKAROUND}</head>`);
	const aside = html.indexOf('class="right-sidebar-container');
	const main = html.indexOf('class="main-pane');
	if (!split || aside === -1 || main === -1) {
		res.end(html);
		return;
	}
	// Halfway through the table of contents.
	const cut = Math.floor((aside + main) / 2);
	res.write(html.slice(0, cut));
	setTimeout(() => res.end(html.slice(cut)), PAUSE_MS);
}).listen(4322, "127.0.0.1", () => {
	console.log(
		`http://127.0.0.1:4322/guides/long-page/ (${split ? "split" : "not split"}${fix ? ", workaround injected" : ""})`,
	);
});
