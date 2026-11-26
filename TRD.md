# HA Prospection MVP v1 Technical Requirements Draft

## Product decision

Give a sales rep one place to find relevant agroalimentaire companies, inspect the evidence for each lead, and build a shortlist for follow-up. The primary outcome is a qualified shortlist the rep can defend and use.

The attached synthesis is product discovery input. Pages 4–7 describe specialist agents and scheduling, pages 9–11 describe lead data and controls, and pages 12–15 describe the legacy prototype and conflicting options. This TRD proposes a first release from those inputs. Its priorities, acceptance criteria, and pilot defaults are proposed decisions.

Pilot assumption: sell Moroccan canned fish to importers and distributors in France. Start with one rep and one reviewer, who may be the same person in the pilot. Product, target role, and geography are editable search parameters. The French-language UI starts with this example because both the product and target region fit the brief.

## What the rep sees

| Priority | Screen | Main actions |
| --- | --- | --- |
| P0 | Research sessions | Enter product/specification, role and country. Run a search. See progress, source failures, elapsed time and results. Reopen previous sessions. |
| P0 | Results and lead detail | Filter by role and review state. Inspect product fit, company details and public business contacts. Open supporting sources with dates and excerpts. Approve, flag or dismiss with a reason. |
| P0 | Resources | View source name, type, URL, access status and last checked time. Add a source reference manually and attach it to a lead. Start with company sites, directories and public business registries where available. |
| P0 | Shortlist | View approved leads across sessions, add an owner or follow-up date, and export an Excel workbook with Leads and Evidence tabs. |
| P1 | Prices and RFQs | Show comparable market observations and active buying opportunities. Each record carries its source, date and commercial terms. |
| P1 | Outreach drafts | Generate editable French, English or Arabic drafts from approved facts. The rep copies the draft into their own workflow. |

Lead details distinguish product relevance, evidence coverage, flags and human review state. A lead can be a good commercial fit and still need verification. The pilot uses explicit reasons and evidence counts in place of a single reliability score.

## What runs behind the interface

1. Creating a research session stores the inputs and queues a bounded run. Proposed pilot budget per run is six queries, twenty source pages and twenty candidate leads. The worker records the query and source outcomes under the run ID.
2. Discovery (Agent 5) calls an approved search provider through a server-side adapter. It evaluates accessible company and directory pages. It records blocked, timed-out and empty results separately. Readable source content is treated as untrusted data, with no authority to change the workflow or invoke tools.
3. Qualification (Agent 1) extracts structured company, product, role and public contact claims. Every surfaced claim needs a source reference with a supporting excerpt. Missing values stay blank. The system validates extracted fields and groups obvious duplicates by normalized company name, country and domain. Ambiguous matches remain available for human review.
4. Evidence checks (a narrow Agent 6 workflow) look for an official-domain match, independent corroboration and conflicting identities. Website existence, legal identity and contact evidence are tracked separately. Reviewers can flag suspected impersonation and record why.
5. A deterministic coordinator (Agent 0) records step state, persists partial results and enforces run limits. It supports retrying failed steps against the same run. Human review governs which leads enter the shortlist.

Price research (Agent 3) and RFQ discovery (Agent 2) can run independently once the product and market are specified. Use price observations to assess RFQ economics only when grade, currency, unit, date and delivery basis can be compared. Agent 4 begins with drafts. The expanded agents, scheduling, outbound integrations and negotiation tools are later release candidates.

## Proposed implementation

- **Web** uses React, TypeScript and Tailwind with routes for sessions, leads, resources and shortlist. Poll run status in v1.
- **Server** uses a TypeScript API and a separate worker. Search or model credentials live on the server. The client handoff targets a single operator on one PC. Serve the built frontend and API on localhost. For that deployment, use SQLite for records and the job queue, and run the worker alongside the API from the same launcher. Add account-based access and evaluate PostgreSQL if the client needs a shared deployment later.
- **Data** includes `ResearchSession`, `RunStep`, `Company`, `Lead`, `Source`, `EvidenceClaim` and `ReviewDecision`. A company may have distinct leads by product, market and role. Evidence records the field, observed value, source URL, excerpt, observed time and publication date if available. Review records carry the reviewer, decision, reason and time.
- **API** includes `POST /sessions`, `GET /sessions/:id`, `POST /sessions/:id/retry`, `GET /leads`, `GET /leads/:id`, `POST /leads/:id/reviews`, `GET /sources`, `POST /sources` and `GET /shortlist/export.xlsx`. Keep records in the local installation.
- **Run state** progresses through queued, running and complete, partial or failed. Session creation accepts an idempotency key. Claim jobs with a lease and write outputs with stable keys so recovery can resume without creating duplicate evidence or resetting review decisions. If subsequent evidence contradicts an approved claim, mark the lead for renewed review before export.
- **Source retrieval** restricts outbound fetching to public HTTP(S), validates redirects and destination addresses, and limits response sizes and timeouts. Record provider usage, source failures and per-run cost. Test fixtures are reserved for internal verification. The client workspace and workbook include the prepared catalogue and live sessions sourced from real records.

## Stress test

| Scenario | Expected behavior |
| --- | --- |
| A directory lists twenty businesses but gives weak product evidence | Prioritize evidence quality. Return a smaller shortlist and show how many candidates lacked support. |
| A provider fails halfway or a key source is gated | Keep completed results, report partial status, and allow an operator to retry failed work or attach another source. |
| An official-looking domain conflicts with a registry record | Show both observations and require review before the lead can enter the shortlist. |
| The same company appears under different spellings or in two runs | Reuse clear company matches while preserving distinct product and role leads. Send ambiguous merges to review. |
| A source includes commands or promises a certification it cannot support | Ignore commands in fetched content. Show certifications only as sourced claims with their evidence. |
| A reviewer opens the export after a fresh run changes the evidence | Export only currently approved leads and include the evidence and observation dates used in review. |
| A later price source mixes FOB, CIF or currencies | Display individual observations. Calculate ranges and margins only from comparable values. |

## Build sequence

The [build plan](BUILD-PLAN.md) defines the order, deliverables and acceptance checks for each chunk.

## Client delivery and versioning

**Delivery assumption.** The client runs the app in their browser on their own PC. Prioritize Windows for packaging and clean-machine testing, pending confirmation of the client’s OS. Sample mode runs with local data. Live mode requires internet access and credentials for the configured providers. Keep credentials and business data outside the checkout so they survive upgrades.

**Repository entry point.** The README explains the business purpose, current release status, setup requirements, how to launch and stop the app, and where the client’s data lives. The shipped release includes a step-by-step walkthrough covering a web search, source inspection, lead approval, and Excel export. The guide also explains the progress states, how to recover from a partial run, and how to configure live providers. Explain the agents in terms of what each step does and what still needs human review.

**Installation and support.** Provide one documented launcher for the supported OS that starts the API and worker and opens the local app. Ship an example configuration with placeholder values. Show the installed version and the path to logs in the app. Document backup and restore for the local database, prerequisites and common troubleshooting steps. Keep secrets, databases, backups and logs out of Git.

**Release process.** Use semantic versioning. Tag pre-release builds as `v0.x.y` and the accepted client release as `v1.0.0`. Pin dependencies with a committed lockfile, publish a changelog for each tag, and link the tagged release from the client handoff. Include a ready-to-run download if the supported platform can be packaged and tested. Document any required runtime alongside it.

**Upgrade and recovery.** Stop the app, back up the database, install the tagged release, migrate the database if needed, then verify the version and open an existing lead. A rollback across a database migration restores the matching pre-upgrade backup and previous release. Tag the client release only after verifying installation from scratch, persistence after restart, the live search flow, and backup and restore on the target OS.

## Pilot gate

Proposed target: in at least two of three realistic sessions, the rep approves at least five relevant companies within 15 minutes from search to review. Compare each session with a timed manual search for the same goal. Every approved lead needs evidence for company identity and product/role fit. Every exported contact needs public source evidence. Audit for duplicates, unsupported claims and missed relevant companies using the manual search as a reference. Track cost per run and per approved lead. Agree a spend ceiling before live trials and enforce it in the worker.
