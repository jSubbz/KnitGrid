# TODO

Ordered roughly by what unblocks the most. See the README for what already works.

## Settings

Built: Settings is reachable under Edit and holds the two choices that exist - theme and language. Colours are CSS custom properties defined once in `src/index.css`, light as the base and dark as the override, with `data-theme` pinning a choice over the system preference. The chart is deliberately not themed: a knitting chart is ink on paper by convention and prints that way, so it stays light in both.

The rest is still hardcoded or hidden. Full inventory, from a sweep of the code:

- **Stop-short count for Knit To Last Stitch.** Hardcoded to one. Space stops one stitch short because `k to last st` is the common edge; patterns with a `k2` edge want two. Backspace covers it today.
- **Stitch palette.** `DEFAULT_PALETTE` in `src/features/stitches/stitches.ts` decides which stitch each of the ten number keys works. The current ten are a guess at what gets reached for most.
- **New-pattern defaults.** The wizard starts at 6 stitches, flat, centre-aligned. All three are reasonable starting points and all three should be settable by anyone whose work is mostly one shape.
- **Printing preferences.** The two checkboxes on the print screen - shorthand notation, and instructions beside the chart rather than after it - are `useState` defaults of `true` and `false`. The print screen keeps its own copies for people who would rather not go looking; the setting only decides what they start as.
- **Chart glyph convention.** Whether knit draws as `k` or as a blank cell, which is what printed charts use.
- **Developer options.** Somewhere to switch the Flag and Save log buttons back on. They come off the toolbar before release, but anyone who hits a bug still needs a way to capture it.
- **Reset.** Four keys under `knitgrid.` in local storage hold hotkeys, language, theme and the dev log. One button to clear them.

Hotkeys stay their own editor rather than being absorbed here; Settings should link to it so there is one place to look. Everything the workspace listens for is now rebindable, cursor keys included, and a command can hold several keys separated by a comma - Erase is `Backspace, Delete`. The number row is the one thing not bound there, because which stitch a digit works is the palette above rather than a key binding.

## Feedback

Built: Info -> Submit feedback writes a report - what happened, environment, and optionally the open chart as JSON - and offers two routes out. With a GitHub account it opens a prefilled issue. Without one it saves the report, with the session log appended, to a file and offers a mailto. The contact address is assembled from three pieces at runtime and never appears whole in the bundle, which is checked by grepping the built JS.

- **The repo needs the three labels** the form applies: `bug`, `enhancement`, `feedback`. GitHub creates the first two by default; `feedback` has to be added, or the URL silently drops it.
- **Nothing arrives on its own.** An emailed report only exists once someone emails it, so there is no inbox to watch until the first one lands. Worth confirming the mailto behaves on a phone, where it is most likely to be used.
- **Worth an issue template** on the repo side so reports arriving by other routes look the same as these.
- **The chart checkbox warns that an issue is public.** Anyone pasting a copied report somewhere private is on their own, which is the right trade, but watch for a first report that includes a pattern the knitter did not mean to publish.

## Language support

Interface strings, written-pattern templates and stitch notation all live in `src/features/i18n/locales/`. Adding a language is one file; nothing else needs touching.

- **German and French need checking by a fluent knitter.** Both are marked `"reviewed": false` and show as "unchecked" in the Languages menu. The interface strings are ordinary translation; the stitch abbreviations are the part that matters. The shaping decreases were sourced by hand, the rest came from Claude, and none of it has been read by a native speaker with a pattern book open.
- **Missing stitches fall back to English.** Both now cover seventeen of the nineteen. Only `kf` and `kb` are left, and they never appear in written output - they are the two halves of `kfb`, so they show only in the chart key and the cell tooltip.
- **Two abbreviations per decrease.** German and French both have a native descriptive form (`2 M li verschr zus-str`, `gg env`) alongside the borrowed English acronym (`ssp`). The acronym is what the file uses, on the grounds that European tools tend to print the acronym and describe the action on hover, which is what the tooltip does. Worth a second opinion.
- **Composites are half translated.** The lifted increases now use their German and French abbreviations; `kfb` stays `kfb` in all three, which is what German and French patterns both write.
- **The Info page needs translating.** Getting started, About and the feedback form now live in the locale files like everything else, with `**bold**` and `` `code` `` as the only markup, so translating them is the same job as translating the menus. German and French carry none of it yet and fall back to English, which is the honest signal that nobody has done it. About is written in the first person and is Jay speaking, so it wants a translator who will keep that rather than flatten it.
- **More languages.** Japanese charts are largely symbol-only rather than abbreviation-based, which the current shape does not express - the stitch table would need a symbol-only mode rather than another abbreviation set.

## Charting

- **Motif tiling.** Capture and destination exist; applying a tile is stubbed. Repeating a motif that changes a row's stitch count changes every row above it, so this needs the dialog that offers the three repairs (keep and flag, pad with knits, clear above) and reports how many rows each would touch.
- **Shaped cells.** Draw each stitch as a shape spanning what it consumes at the bottom and what it produces at the top, so decreases visibly converge and increases fan out. Needs row virtualisation and a rethink of how selection renders over a non-rectangular chart.
- **Stitches that span more than one row.** A slipped stitch is not worked on the row it appears in: it carries up and is worked on a later row, so the loop is physically as tall as the rows it crossed. I-cord is the clearest case — two stitches worked, one slipped, then on the next row the slipped one is worked and the other two slip — and the same mechanism underlies most edge treatments and the reinforced heels and slip-stitch soles used in socks.

The model currently gives every cell exactly one row. Spanning needs a cell to record that it continues a stitch from below, which is the same class of change as the double stitch: state carried between rows rather than counted within one. The shaped-cell renderer is what makes it visible, since a spanning stitch is simply a taller box.

- **Double stitch and German short rows.** See the `pending` section of `src/features/stitches/stitches.json`. Needs a schema field first: a double stitch is count-neutral in both directions and carries state across rows, so two integers cannot describe it.
- **Turn work is untested.** The button marks a row short and moves on, but nothing has been worked from a chart that uses it, and German short rows need more than that: the double stitch has to be created at the turn and resolved exactly once on a later pass.
- **Wrong-side counterparts.** Several stitches in the table have no `wsCounterpart` because it has not been researched, not because none exists.

## Engineering

- **Mobile.** The palette and command buttons are tappable and the chart scrolls, but nothing has been tested on a phone since the toolbar changed, and the original complaint - no way to raise the keyboard - was never confirmed fixed.
- **Tests.** None yet. `src/features/project/rowMath.ts`, `parseProjectJson` and the saved-pattern round trip are where a suite would pay for itself first.
