# Starlight: table of contents layout shift while a page streams

Minimal reproduction for a layout shift in [Starlight](https://github.com/withastro/starlight). This is the stock `starlight` template (Starlight 0.42.6, Astro 7.3.8) plus one page with 40 headings and a small server that sends HTML in two parts.

## The bug

`TwoColumnContent.astro` emits the table of contents `<aside>` before `.main-pane` and reorders it with `order: 2`. If the browser paints after it has parsed the aside and before it has parsed the main pane, the aside is the flex row's only child and sits at the left. It jumps right once the main pane arrives. Lighthouse reports one layout shift of 0.423 on `div.right-sidebar`.

## Reproduce

```bash
pnpm install
pnpm build
pnpm serve:split
```

In a second terminal:

```bash
pnpm measure
```

Expected output:

```text
CLS 0.423
  0.423  div.main-frame > div.lg:sl-flex > aside.right-sidebar-container > div.right-sidebar
```

`serve-split.mjs` serves `dist/` on port 4322 and pauses 500 ms halfway through the `<aside>`. That stands in for a slow connection, or a large document whose network chunk boundary falls inside the table of contents.

## Compare

| Server command | CLS |
| --- | --- |
| `node serve-split.mjs` | 0.423 |
| `node serve-split.mjs --no-split` | 0.000 |
| `node serve-split.mjs --fix` | 0.000 |

`--fix` injects this rule, which holds the aside at its final position while it is alone in the row and resolves to 0 once the main pane fills it:

```css
@media (min-width: 72rem) {
  .right-sidebar-container {
    margin-inline-start: auto;
  }
}
```

`pnpm measure` needs Chrome installed; it runs Lighthouse 12.6.1 with the desktop preset (1350×940).
