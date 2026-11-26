# Pilot walkthrough and acceptance

Run this walkthrough after the MVP is installed from the tagged client release. Use the [README](README.md) for startup and live search setup. Start with a fresh test data directory if you want a separate shortlist for the pilot.

## Installation walkthrough

1. Open the app and run the prefilled search in **Démonstration**. Check the progress and open each result. Find the corroborating evidence, missing contact, and conflicting identities.
2. Approve the first lead, flag the second, and dismiss the third. Add a reason for each. Confirm that only the approved lead appears in **Liste prioritaire**.
3. Add a source under **Ressources**, attach it from the approved lead, and check that the lead returns to review. Approve the lead again, set a follow-up owner and date, and export it.
4. Open the workbook in Excel. Match the **Leads** and **Evidence** tabs using **ID prospect** and confirm that the workbook labels the run as a demo.
5. Run the partial demo scenario, then stop and restart the app. Reopen both saved sessions and verify that the partial status, review reasons, and follow-up data remain available.

## Live pilot

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
