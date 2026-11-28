# CallAssist — agent field notes and pitfalls

Observed while building this repository, not inferred. Grouped by where the time gets lost.
Companions: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md),
[CALENDAR_ARCHITECTURE.md](CALENDAR_ARCHITECTURE.md), [CHANGELOG.md](CHANGELOG.md).

## Application code

- **Attribute booleans need a trailing space.** Building markup by string concatenation produced `disabledaria-label=…`; the attribute was never applied, so *no calendar date was ever locked* while a passing test hid it. Assert on the DOM property (`el.disabled`), not on the string.
- **Never carry a calendar date inside a `Date` across a timezone boundary.** Formatting a local-noon `Date` through the appointment zone moved the whole grid back a day and showed the previous month. Use parts (`calKey`, `calParts`, `calFmt` for labels, `calWeekdayOf` for the leading offset) and compare keys as strings.
- **Adding days to a day-of-month number overflows the month** (`to=2026-11-58`). Add to the date, or send start-plus-count.
- **A control that repaints only when re-opened shows a false state.** The picker kept the "18 days open" banner after the request it described had failed. Any layer that survives a state change must be re-rendered as part of that change.
- **Distinguish `empty` from `error` from `off`.** Collapsing them makes it look like the calendar is full when nothing could be read, which is how an agent wastes a call.
- **Keep the availability path read-only by construction.** A single GET helper and journalled assertions ("no non-GET anywhere", "widget host never contacted") are cheaper to maintain than a review-time argument about whether something could book.
- **A label copied from a source is not a timezone conversion.** If a feed returns UTC-stamped labels, the desk faithfully displays the wrong hour. That gap is the helper's job, and it must be stated in the docs.
- **Prefer the application's own pipeline over reinventing it.** Delegating on `#checklist` and keeping `data-q` on the date and time cells is what made the calendar rows survive the desk's existing autosave, progress and check-mark logic untouched. A parallel save path would have re-broken them.
- **Documentation drifts from code faster than tests do.** The pushed calendar doc advertised `--ops-user-id` and `--ghl-version`, flags that `cal-proxy.py` never implemented — ops user ids come from `GHL_OPS_USER_ID` and the header from `--version`. Diff every flag written in any doc against `add_argument` before publishing. CHANGELOG.md's own counts were re-derived from run logs twice because earlier drafts guessed them.

## Testing and environment

- **Cache-bust delivery URLs.** A plain static server with no cache headers made Playwright assert against a stale `index.html`; every fixture URL now carries a nonce. Hash the served copy and compare with the built file before trusting any green run.
- **Do not wait for the `load` event.** The Google Fonts link can hang it, so wait on the application's own state (`#app.on` via `waitForFunction`). Loading a webfont is *never* allowed to block rendering or boot: fetch the stylesheet with `media="print"`, promote it in `onload`, and degrade to Georgia silently with zero console errors.
- **Real popups destabilise this browser harness.** Stub them: capture `window.open` arguments, call the write path on a supplied object, and assert on produced markup.
- **Route interception to fake a "hung CDN" is not equivalent to slow** — a long delay in a route handler wedges the session. Use a deliberately slow local endpoint instead, or state that only the failure path was exercised.
- **Background servers die between calls in an ephemeral sandbox.** Supervise them in-process (`run_e2e.py` with the fixture server, the helper and the browser in one lifetime) and run one suite per call, otherwise results look like app failures.
- **jsdom does not prove the browser is happy.** The earlier 21-check jsdom pass did not exercise the availability path and threw on `AudioContext`; do not let a green jsdom run become evidence about media, popups, layout animation, or focus. Always state which harness ran.
- **Measure animations, do not assert on them.** Sample the panel height mid-transition so the test fails on an instantaneous jump — a class-presence assertion happily passes on a broken transition.
- **Run big suites as separate calls.** One enormous script across many contexts trips the harness; splitting by suite also gives a reviewer per-suite counts instead of one opaque number.

## Delivery and GitHub collaboration

- `docs/` is served if the Cloudflare deployment publishes the repository root, so documentation may be public. Inspect deployment settings before adding non-obvious internal material there.
- **Keep delivery generators, test fragments and manifests out of the application tree** (work order 5 policy) unless a work order explicitly authorises them.
- The connector used for these documentation commits writes reliably only for small, plainly structured text: a 40 KB patch cannot be committed as a single file, and unusual whitespace plus escaped quotes is where corruption appears. Push one small file per commit, then fetch it back and compare bytes before considering the delivery correct.
- **Never push a partial artefact because it is convenient.** A fragment of a patch or an unlabelled file invites someone to merge something unverifiable. Push the file, its blob, its sha256, and the command that reproduces it.
- **Verify the remote after pushing, and treat a manifest as provisional.** Several work-order-6 commits were needed to replace guessed sizes and a wrong claim about branch contents with final hashes. Record the byte length and blob of every artefact a merge depends on, and re-publish whenever the build changes.
- **Separate merged from delivered, in the same sentence.** Unmerged work is real but not authoritative: a future agent who re-implements it wastes a work order, and one who assumes it shipped writes code against a feature that is not in `main`.
- Deliverables for an unmerged work order are: the changed file, a zero-context patch with its blob and sha256, the base blob it applies to, and evidence split by harness. Merging is a human/Codex decision, and CHANGELOG.md says plainly which items are not merged.
