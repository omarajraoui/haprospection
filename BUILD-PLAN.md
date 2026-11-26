# MVP v1 Build Plan

Use the [TRD](TRD.md) for product and technical requirements. Work through these chunks in order. Each chunk ends with a working demo or a verification result.

| Chunk | Deliverable | Done when |
| --- | --- | --- |
| **01 — Fixture research and evidence** | React, TypeScript and Tailwind app with a search form, sample run progress, results and lead evidence. | An operator can run the sample search, see partial results, open a lead and explain the evidence behind it. |
| **02 — Local data and review** | Local API and SQLite storage for runs, leads, evidence and review decisions. Add approve, flag and dismiss actions with reasons. | Restarting the app preserves the run and decisions. A flagged lead stays out of the shortlist. |
| **03 — Resources and Excel** | Source directory, manual evidence attachment, shortlist follow-up fields and Excel export. | A reviewer can attach a source and open an Excel workbook whose Leads and Evidence tabs can be matched. |
| **04 — Live discovery** | Search provider adapter, bounded worker, sourced extraction, deduplication and retry. | An actual search returns traceable results. A simulated provider failure preserves completed records and retry creates no duplicates. |
| **05 — Pilot and fixes** | Run three realistic scenarios against the manual baseline and address workflow blockers. | Record time to shortlist, approved leads, evidence coverage and cost. Apply the pilot gate in the TRD. |
| **06 — Versioned client handoff** | Launcher, setup and operator guides, backup and upgrade instructions, changelog and tagged release. | A fresh installation on the client's OS completes the sample workflow, produces an Excel export and restores a backup using only repository instructions. |

## Chunk 01 scope

Implemented in local prototype version 0.1.0. The production build and Chromium checks passed for run progress, all three evidence cases and the partial run.

- Create the app shell and a short README section with the actual commands to run it.
- Add an editable search form for product, market and target company type. Seed it with Moroccan canned fish and French importers or distributors.
- Simulate discovery, qualification and evidence checks with deterministic fixtures. Label the run as sample data throughout.
- Build a result list and lead detail with three cases that exercise the interface. Include a lead with corroborating evidence, one with a missing contact and one with conflicting evidence.
- Show which source claims each detail supports, with a source URL, excerpt and observation date. Mark the example sources as fixtures.
- Include a partial run where one source fails and completed results remain visible.

### Demo checklist

1. Launch the app from the documented commands.
2. Start the sample session and watch the progress update.
3. Inspect the evidence for all three lead cases.
4. Identify the missing contact and conflicting claim without opening external tools.
5. Run the partial scenario and reopen a completed result.
6. Verify the production build.

## Chunk 02 verification

Implemented in local prototype version 0.2.0. A Chromium walkthrough saved approval, flag and dismissal decisions with reasons. After stopping and restarting the preview process on the same SQLite database, the session, evidence and decisions matched. Changing the approved lead to flagged removed it from the shortlist.

Chunk 03 adds the Resources screen and export. The client OS needs confirmation before packaging in Chunk 06.

## Chunk 03 verification

Implemented in local prototype version 0.3.0. Chromium checks covered adding a source, attaching evidence, approving again, and saving a follow-up. Workbook readback verified that both sheets link through the same lead IDs and that flagged leads stay out. Restart preserved the new data and a review migrated from the 0.2.0 schema. The workbook was checked programmatically. Microsoft Excel itself remains a client release check.

## Chunk 04 verification

Implemented in local prototype version 0.4.0 with a Brave Search adapter, a bounded SQLite-backed worker, a source log and one retry of failed tasks. A controlled provider test verified that a failed page leaves completed results usable and that retry does not duplicate a candidate. The app also fetched and qualified a public catalogue page for the canned fish corridor. An end-to-end search against Brave remains to be run with a client API key. Live records are candidates for manual identity and market review.


## Chunk 05 verification

Version 0.5.0 passed the internal dry run across three demo briefs. Session history and shortlist rows now show the research mode and time to help distinguish repeated searches, and completed web searches with zero candidates explain where to look for source outcomes. The [pilot walkthrough](PILOT.md) records the dry run and provides the live comparison checklist. The client pilot is deferred until the packaged MVP is ready.

## Chunk 06 verification

The local release candidate is tagged `v1.0.0-rc.1`. A clean source copy passed installation, installation-path handling, local launch, version and log reporting, sample review and Excel export, and backup restoration on macOS. The client PC walkthrough, Microsoft Excel check and Brave Search run remain acceptance checks for the final `v1.0.0` tag. See the [release notes](CHANGELOG.md) and [pilot walkthrough](PILOT.md).
