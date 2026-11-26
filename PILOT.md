# Pilot walkthrough and acceptance

Run this walkthrough after the MVP is installed from the tagged client release. Use the [README](README.md) for startup and live search setup. Start with a fresh test data directory if you want a separate shortlist for the pilot.

## Installation walkthrough

1. Open **Prospects** and inspect the prepared canned-fish selection. Check both the registry entry and company page on each lead.
2. Open the resulting leads and inspect the linked evidence. Approve only leads whose identity and activity you can verify. Flag or dismiss questionable leads and record a reason.
3. Attach a real supporting source to an approved lead and check that it returns to review. Approve it again after checking the source, set a follow-up owner and date, and export it.
4. Open the workbook in Excel. Match the **Leads** and **Evidence** tabs using **ID prospect** and confirm that the workbook identifies the session as a prepared selection.
5. Stop and restart the app. Reopen the saved session and verify that the review reasons, evidence, and follow-up data remain available.

## Live pilot

Configure the search provider before starting the live comparisons. Open the activity log to check query and page outcomes.

Pick three searches the sales rep would actually run. Candidate briefs are Moroccan canned fish for French importers, white rice suppliers in Senegal, and olive oil buyers in Spain. Use the same product, country, role and acceptance criteria for each live search and its manual comparison. Keep earlier results out of sight when running the second method.

Time each search from submission until the rep reaches five usable approvals or stops. Include time spent checking evidence. If a search falls short, record the elapsed time and actual approvals. Confirm company identity and product/role fit against sources. Record how many manual-baseline leads the app missed and why each result was accepted or rejected. Count only public contacts with source evidence.

| Search | Manual minutes and usable leads | App minutes and approved leads | Evidence or duplicate issues | Brave requests and cost | Missed relevant leads |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

Record the query attempts shown in the session log, including any retry, and reconcile the billed request count and cost with the client’s provider plan. Use the [TRD](TRD.md) gate of five approved leads in 15 minutes in at least two searches. Compare elapsed time against the manual baseline and record any blocker before relying on live results.

## Internal dry run

Version 0.5.0 passed three simulated searches covering the canned fish, rice and olive oil briefs, including the partial-run scenario. Saved history retained all three sessions and their decisions. The workbook contained three approved leads and nine matching evidence rows, all from demo sessions. The live search, timing and cost measurements belong to the client walkthrough after packaging.
