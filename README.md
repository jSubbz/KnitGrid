# KnitGrid

A knitting chart editor. It counts your stitches, and flags the rows that don't add up.

You cast on, type a row, and the next row is worked out from what that row produced. Increases widen the chart, decreases narrow it. There is no grid to set up first.

![The KnitGrid workspace: a chart worked upward from an eight-stitch cast-on, with paired edge increases, a decrease row, and the row in progress showing what it still owes.](docs/workspace.png)

**Status: early development (v0.7).** It is usable for charting. Several things listed under [What's next](#whats-next) are missing.

## Why

**No account, no server, no cloud.**

Your patterns are files on your computer. A saved pattern is a self-contained page - open it in a browser to read or print it, or hand that file to another knitter and it works the same for them.

KnitGrid never sees any of it. There is nowhere for it to go: no sign-up, no sync, nothing of yours on someone else's machine. That is also why there is nothing to pay for, and no reason this should stop working in ten years if nobody is minding it.

**There is no AI in the program.** Nothing here calls a model, watches what you chart, or offers to finish your row. It is designed as a quiet tool that does what you tell it and nothing else.

## Charting

Start a new pattern, say how many stitches you are casting on, and type.

The chart reads the way knitting does: bottom to top, right to left. Stitches go in from the number keys or the numpad, and every key has a button underneath the chart, so it works on a phone where there is no keyboard to bring up.

| Key | | Stitch |
|---|---|---|
| `0` | K | knit |
| `1` | P | purl |
| `2` | K2TOG | knit two together |
| `3` | SSK | slip slip knit |
| `4` | M1L | make one left |
| `5` | M1R | make one right |
| `6` | YO | yarn over |
| `7` | LLI | left lifted increase |
| `8` | RLI | right lifted increase |
| `9` | SL | slip |

Symbols slant the way the stitch leans, with a plus for an increase and a minus for a decrease. Lifted increases carry a foot at the base, because they are picked up out of the fabric below rather than made from the bar between stitches. More stitches are coming - the cable and short-row symbols are not there yet.

**Space** works to the last stitch, where shaping usually goes. Press it again to take the last one. So the standard edge increase

```
k1, m1r, knit to last stitch, m1l, k1
```

is `0` `5` Space `4` `0` - five presses regardless of row length.

**Enter** starts the next row. It is refused while stitches are still live, because turning early reshapes everything above and should not happen by accident. **Turn work** is the button for doing it on purpose; designed for german short rows, and is still in the to-do list.

Increases eat nothing. A make-one or a yarn over adds a stitch without using one up, which is why a row can hold more symbols than it has live stitches, and why the count in the margin tells you what the row still owes rather than how many symbols are in it. Each row shows how many stitches it produced once it closes, and goes amber if it does not add up.

**Designing / Knitting** switches between the chart as drawn and the chart as worked. In Knitting mode on a flat piece, wrong-side rows reverse and show the stitch you actually work, so a charted knit shows as a purl.

## Saving and sharing

**Save pattern** produces one file. It holds a printable copy of your chart and the written instructions, and underneath those, data you never see that describes the pattern exactly. **Load pattern** reads that data back and reopens the pattern in a new session, exactly as you left it.

That is the only file, unless you tick **Download only written instructions** on the print screen. That one is plain text, for reading and sending on. It cannot be loaded back - the pattern data is not in it.

## Live

**[jsubbz.github.io/KnitGrid](https://jsubbz.github.io/KnitGrid/)** - the program is live at this link. If you would rather have a local copy on your machine, [For developers](#for-developers) has the details on getting it running.

## Testing tools

The **Flag** and **Save log** buttons record what happened while charting, for tracking down bugs. They are here while the program is still being built and will come off the toolbar before release - most likely reappearing behind a developer option in Settings, so anyone who hits a bug can still capture it.

## What's next

[TODO.md](TODO.md) has the working list. The short version: settings, language support, dark and light modes, motif tiling, better row tracking while knitting, and more stitches - the double stitch and German short rows in particular.

## For developers

**Most people do not need this section.** KnitGrid runs in a browser at the link above with nothing to install. What follows is for running it from source, and assumes you are comfortable with git and Node.

<details>
<summary>Running from source</summary>

Requires Node 20 or newer.

```bash
git clone https://github.com/jSubbz/KnitGrid.git
cd KnitGrid
npm install
npm run dev
```

`npm run build` produces a static site in `dist/`.

</details>

<details>
<summary>The stitch table</summary>

`src/features/stitches/stitches.json` is the domain model:

```json
{ "id": "k2tog", "abbr": "k2tog", "name": "knit two together",
  "consumes": 2, "produces": 1, "category": "decrease",
  "lean": "right", "wsCounterpart": "p2tog" }
```

`consumes` and `produces` are what the whole program is built on - the width of every row, whether a row closes, and where a short row turned all fall out of those two numbers. `lean` drives the drawn symbol.

It is data rather than code so other tools can read the same table instead of reimplementing it. Entries without a `wsCounterpart` are unresearched, not symmetric by default. The `pending` section lists stitches the table needs to grow to hold and what each needs from the schema first.

</details>

## Licence

MIT - see [LICENSE](LICENSE).
