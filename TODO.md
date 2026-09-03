# TODO

Ordered roughly by what unblocks the most. See the README for what already
works.

## Settings

The Settings page is a placeholder. It should hold the choices that are
currently hardcoded or hidden:

- **Stop-short count for Knit To Last Stitch.** Space stops one stitch short
  because `k to last st` is the common edge. Patterns that use a `k2` edge want
  two. Backspace covers it today; a setting would do it properly.
- **Stitch palette.** Which stitch each number key paints. The current ten are a
  guess at what gets reached for most.
- **Language.** Default language, alongside the switcher already in the menu bar.
- **Theme.** Dark and light modes. The workspace is currently light-on-dark with
  the chart itself always light; both should be deliberate rather than incidental.
- **Chart glyph convention.** Whether knit draws as `k` or as a blank cell, which
  is what printed charts use.
- **Printing preferences.** Whether written instructions sit beside their chart
  row or in a block after it, and whether shorthand notation is on. The print
  screen keeps its own checkboxes for people who would rather not go looking in
  settings; the setting just decides what they start as.

## Language support

The Languages menu switches a label and nothing else. Real support means
extracting every string, picking a library or a small home-grown catalogue, and
deciding what happens to stitch abbreviations — `k2tog` is English, and other
knitting traditions use their own notation, which is a deeper question than
translating the interface.

## Charting

- **Motif tiling.** Capture and destination exist; applying a tile is stubbed.
  Repeating a motif that changes a row's stitch count changes every row above it,
  so this needs the dialog that offers the three repairs (keep and flag, pad with
  knits, clear above) and reports how many rows each would touch.
- **Shaped cells.** Draw each stitch as a shape spanning what it consumes at the
  bottom and what it produces at the top, so decreases visibly converge and
  increases fan out. Needs row virtualisation and a rethink of how selection
  renders over a non-rectangular chart.
- **Stitches that span more than one row.** A slipped stitch is not worked on
  the row it appears in: it carries up and is worked on a later row, so the loop
  is physically as tall as the rows it crossed. I-cord is the clearest case —
  two stitches worked, one slipped, then on the next row the slipped one is
  worked and the other two slip — and the same mechanism underlies most edge
  treatments and the reinforced heels and slip-stitch soles used in socks.

  The model currently gives every cell exactly one row. Spanning needs a cell to
  record that it continues a stitch from below, which is the same class of
  change as the double stitch: state carried between rows rather than counted
  within one. The shaped-cell renderer is what makes it visible, since a spanning
  stitch is simply a taller box.

- **Double stitch and German short rows.** See the `pending` section of
  `src/features/stitches/stitches.json`. Needs a schema field first: a double
  stitch is count-neutral in both directions and carries state across rows, so
  two integers cannot describe it.
- **Wrong-side counterparts.** Several stitches in the table have no
  `wsCounterpart` because it has not been researched, not because none exists.

## Project handling

- **Nothing here for now.** A saved pattern is a self-contained page carrying its
  own chart data, so saving, sharing and reopening are all one file and one door.
- **Shared library.** A catalogue of patterns knitters have published for others
  to use. Needs a server, accounts and moderation before any of it is real, so
  it is a long way from a static site. Saving a pattern and sending the file
  covers most of the value with none of that.

## Engineering

- **Tests.** None yet. `src/features/project/rowMath.ts` and `parseProjectJson`
  are where a suite would pay for itself first.
- **Deployed demo.** The build is a static site; nothing hosts it yet.
