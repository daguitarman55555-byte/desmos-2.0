# Reference screenshots — frozen

This folder is the ground truth the port is diffed against. **Never edit or regenerate anything in
it.** See `CLAUDE.md`.

## Status: empty, awaiting the real captures

`CLAUDE.md` describes this folder as "the Desmos captures we diff against", but no captures were
present when the port began. They were never committed alongside `desmos-demo.html`.

Until they are here, milestone 1 is verified the weaker way: by diffing the running app against
`reference/desmos-demo.html` directly, in the same browser at the same window size. That proves the
port did not change the prototype. It does **not** re-prove the prototype matches real Desmos —
that was established in the session that produced the demo and is taken on trust.

## What to drop in

Captures of **real Desmos** (not of the prototype), at a recorded device pixel ratio, one file per
state, named for what they show:

```
default-viewport.png        empty graph, default framing
expression-focused.png      a focused row with the blue border
slider.png                  a=1 collapsed to a slider
poi-labels.png              a selected curve with grey POI dots
```

Note the DPR they were taken at in the filename or here — the grid tick target of 104 css px was
derived from ~130 device px at 1.25 dpr, so the DPR matters when comparing.
