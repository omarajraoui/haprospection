# HA Prospection

HA Prospection is a proposed desktop-local web app for agroalimentaire sales teams. It helps a rep find buyers or suppliers, check the evidence behind each company, and export a reviewed shortlist to Excel.

## Install and start

The MVP release candidate is `v1.0.0-rc.2`. Install Node.js 22.12 or later with npm, then download and extract the source archive for this version. An internet connection is needed for the first dependency install. Open a terminal in the extracted folder and run:

```sh
npm ci
npm run build
npm start
```

On Windows PowerShell, use `npm.cmd` in place of `npm` if a local policy blocks the PowerShell shim. On each later launch, run `npm start` from the same folder. The launcher opens the app in your browser at `http://127.0.0.1:4173/`. Keep the terminal open while using the app. Press Ctrl+C in the terminal to stop it. If the browser fails to open, copy the printed address into your browser.

## Try the MVP

Use **Recherche** to start or reopen a session, **Liste prioritaire** for approved leads, and **Ressources** for supporting sources. **Mode d’emploi** explains the workflow inside the app.

1. Under **Missions prêtes à lancer**, select one of the prepared missions and click **Lancer la mission**. The product, country and company type are already set. Use **Personnaliser une recherche** for a different brief. New missions require the web search service.
2. Under **Prospects de la session**, type a company, contact or source. The review buttons and **État des preuves** combine with that search. Use **Réinitialiser** to see every result again. Open each lead to inspect its evidence. **Activité de la session** shows what ran in the background.
3. Under **Décision de revue**, select **Approuver**, **Signaler** or **Écarter**, enter a reason, and save. Only approved leads appear in **Liste prioritaire**.
4. Choose **Une source ne répond pas** and run again. A partial run keeps completed results available.
5. Open **Ressources**, name a source, enter its URL and select its type. In a lead’s **Rattacher une source** section, select it, enter the claim, a supporting excerpt and the observation date, then save. If the lead was approved, review it again before exporting.
6. In **Liste prioritaire**, enter a responsible person and follow-up date and click **Enregistrer le suivi**. The shortlist search narrows the screen by company, product, market or owner. Click **Exporter Excel** to download the full approved list as `ha-prospection.xlsx`. The **Leads** and **Evidence** tabs share an `ID prospect` column for matching rows.
7. Restart the app and use **Sessions enregistrées** to reopen an earlier session and check its decisions and evidence.

The client workspace uses real web searches. Earlier sample sessions are excluded from history and export. Read the [pilot walkthrough](PILOT.md) for the full acceptance test.

## Local data and backup

The launcher prints the data folder and log path. By default, Windows uses `%LOCALAPPDATA%\HA Prospection`, macOS uses `~/Library/Application Support/HA Prospection`, and Linux uses `$XDG_DATA_HOME/ha-prospection` or `~/.local/share/ha-prospection`. The database is `prospection.sqlite` and the log is `app.log`. Set `HAPROSPECTION_DATA_DIR` before running the launcher or data commands to use a different directory.

Stop the app before restoring or upgrading. Run these commands from the release folder, using a backup path you can access. The backup command requires a new filename. The restore command saves any current data to a separate `before-restore-*.sqlite` file before replacing it.

```sh
npm run backup -- "./ha-backup.sqlite"
npm run restore -- "./ha-backup.sqlite"
```

Keep backups outside the source checkout and Git, for example by passing a full path on a backup drive. Start the app after restoration and confirm that a known session opens.

### Upgrade or roll back

1. Stop the old version and create a backup.
2. Extract the new tagged release into a new folder. Run `npm ci`, `npm run build`, and `npm start` there. Reuse the same data directory. The app applies database changes on launch.
3. Verify the version in the app footer, reopen a known session, and check the shortlist.
4. If you need to roll back, stop the new version and restore the pre-upgrade backup before launching the previous release.

Earlier development builds wrote to `data/prospection.sqlite` inside the checkout. To bring it forward, stop the development server, then pass the full path of that database to the release's restore command. Development with `npm run dev` continues to use the checkout’s `data` folder by default.

## Enable live web discovery

Get a Brave Search API key from the [Brave Search dashboard](https://api-dashboard.search.brave.com/). Set `BRAVE_SEARCH_API_KEY` in the environment of the terminal that launches HA Prospection. Keep the key out of Git and shared screenshots. On macOS or Linux, read it without displaying it in a Bash terminal:

```bash
read -rs BRAVE_SEARCH_API_KEY
export BRAVE_SEARCH_API_KEY
npm start
```

In Windows PowerShell:

```powershell
$env:BRAVE_SEARCH_API_KEY = [System.Net.NetworkCredential]::new("", (Read-Host "Brave Search API key" -AsSecureString)).Password
npm start
```

Restart the app if it was already running. The prepared missions are enabled when the key is configured. **Requêtes et pages consultées** lists the queries and page outcomes. If part of the run fails, **Relancer les étapes en échec** retries only those steps once and keeps results already collected.

Brave provides search result URLs. HA Prospection reads the returned pages, records excerpts, and presents candidates for human review. Each session starts with two Brave queries and processes up to ten distinct HTTPS pages. One retry can repeat failed requests. Brave usage is charged according to the client’s plan. The local app sends the search inputs to Brave and stores results and supporting excerpts on the PC.

Live candidates come from a conservative product-term match against readable pages. Known directories and registries stay in the source log as discovery or verification resources. The app skips creating company candidates for those domains. Check the linked page, company identity, market and role before approving. Contact fields stay blank for live candidates. Access failures, redirects and non-HTML pages are recorded in the session. Previously saved web sessions remain available without a key.

## Troubleshooting

- If the port is already in use, stop the other instance or set `HAPROSPECTION_PORT` to an unused port before launching. Use the address printed by the launcher.
- If the launcher reports that the data folder is in use, stop the other launcher or restore command. After an abrupt shutdown, remove `release.lock` from the data folder only after confirming the local app and its server process have stopped.
- If web search is disabled, set the Brave key in the same terminal and restart. Previously saved web sessions remain available.
- If an error persists, check the log path in the terminal or the app footer. Keep client data and credentials out of support messages.

## Release information

See the [release notes](CHANGELOG.md), [pilot walkthrough](PILOT.md), and [technical requirements](TRD.md).
