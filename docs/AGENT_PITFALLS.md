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

## Documentation that contradicts code

- **Diff every flag against the parser, every environment variable against the reads.** A draft of the calendar setup guide advertised `--ops-user-id` and `--ghl-version`, flags `cal-proxy.py` never had; the published guide was corrected to the real surface (`--version`, `--ghl-base`, `/free-slots`, `/health`). The guide now also states, in its HighLevel section, that no `--ops-user-id` exists.
- **The helper still contradicts itself.** `cal-proxy.py`'s header comment tells you to `export GHL_OPS_USER_ID`, and no line of code reads it, so user-scoped calendars are unwired. Until that is fixed or removed, docs must say so plainly — the trap is believing a documented variable is live. Same for the three HighLevel slot paths in `fetch_ghl`: they come from documentation and have **never been answered by a real account**, unlike the ICS path which was exercised end to end.
- **Every documentation number must come from a log, not from memory.** An earlier changelog draft stated 72 assertions, an earlier manifest 87; both were superseded by the 90 run on the final blob, for 108 total (90 desk + 12 helper + 6 end-to-end). Regrep counts, then write.
- **Re-deriving your own numbers is worth the run.** On 2026-11-28 the whole battery was re-run on the final blob with results written to JSON (`verification-20261128.json`): 30 + 34 + 26 + 12 + 6 = **108 passed, 0 failed**. The driver asserts it is serving blob `4140254…` before it runs anything, which is another way of saying: prove what you tested.
- **A first-pass parser can hide a pass.** One verify driver counted 107 because the harness returns the assertion block as a quoted JSON string and the leading quote made the first line fail a start-of-line match. The fix was to strip quotes before classifying. A harness that undercounts is as dangerous as one that overcounts.
- **A command block can lose its newlines.** The merge manifest published `git checkout -b wo6 maingit apply --unidiff-zero …`, because the intended newline was dropped when the text was assembled — exactly the missing-space class of bug recorded above, this time in prose a human would copy-paste. Fetch pushed docs back, diff them against the local file, and eyeball every fenced command once on the way out.

## Testing and environment

- **Cache-bust delivery URLs.** A plain static server with no cache headers made Playwright assert against a stale `index.html`; every fixture URL now carries a nonce. Hash the served copy and compare with the built file before trusting any green run.
- **Do not wait for the `load` event.** The Google Fonts link can hang it, so wait on the application's own state (`#app.on` via `waitForFunction`). Loading a webfont is *never* allowed to block rendering or boot: fetch the stylesheet with `media="print"`, promote it in `onload`, and degrade to Georgia silently with zero console errors.
- **Real popups destabilise this browser harness.** Stub them: capture `window.open` arguments, call the write path on a supplied object, and assert on produced markup.
- **Route interception to fake a "hung CDN" is not equivalent to slow** — a long delay in a route handler wedges the session. Use a deliberately slow local endpoint instead, or state that only the failure path was exercised.
- **Background servers die between calls in an ephemeral sandbox.** Supervise them in-process (`verify_all.py` owns the desk server, the ICS feed and the helper in one lifetime) and run one suite per call, otherwise results look like app failures.
- **jsdom does not prove the browser is happy.** The earlier 21-check jsdom pass did not exercise the availability path and threw on `AudioContext`; do not let a green jsdom run become evidence about media, popups, layout animation, or focus. Always state which harness ran.
- **Measure animations, do not assert on them.** Sample the panel height mid-transition so the test fails on an instantaneous jump — a class-presence assertion happily passes on a broken transition.
- **Run big suites as separate calls.** One enormous script across many contexts trips the harness; splitting by suite also gives a reviewer per-suite counts instead of one opaque number.

## Delivery and GitHub collaboration

- `docs/` is served if the Cloudflare deployment publishes the repository root, so documentation may be public. Inspect deployment settings before adding non-obvious internal material there.
- **Keep delivery generators, test fragments and manifests out of the application tree** (work order 5 policy) unless a work order explicitly authorises them.
- The connector used for these documentation commits writes reliably only for **small payloads, one file per commit**: multi-file commits in the ~21 KB range were rejected outright, while single files under ~11 KB landed. Push one file, fetch it back, diff, and move on.
- **Verify the remote after pushing.** Fetch via the contents API and compare the blob hash rather than trusting the action's response — a successful response does not guarantee byte-identical content. The delivered `docs/` in the output folder was overwritten with the fetched bytes so branch and folder cannot drift.
- **Treat a manifest as provisional until the build settles.** Several commits were needed to replace guessed byte counts and inaccurate claims about branch contents. Record the byte length and blob of every artefact a merge depends on, and re-publish them whenever the build changes.
- **Do not force or rebase shared branches** to clean up history; add a forward-fix commit and describe what happened, so reviewers can read the log linearly.
- **Separate merged from delivered, in the same sentence.** Unmerged work is real but not authoritative. `main` HEAD is still `2926da5` and its application blob is still `574232…`; the calendar work exists only on `feat/campaign-calendar-wo6` (docs) and in the delivery folder (app + patch). A future agent who assumes it shipped writes code against a feature that is not in `main`.
- Deliverables for an unmerged work order are: the file, a zero-context patch with its blob and sha256, the base blob it applies to, and proof the patch reproduces the result (`git apply --unidiff-zero` then `git hash-object`). Merging remains a human/Codex decision.
