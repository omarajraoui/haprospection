# Release notes

## v1.0.0-rc.3

The app opens on a prepared, sourced selection. The first release snapshot contains two French canned-fish importers with legal identity checked using the public French company-search API and product range documented by their company sites. The snapshot is available without a Brave key. New web searches are optional.

Verified initial import into an empty SQLite database, evidence links, Excel export, and review persistence after restart. The initial catalogue is a dated snapshot.

## v1.0.0-rc.2

Prepared research missions, separate workspaces, and result filters simplify the operator workflow. Resources and evidence identify the role of each source, including in Excel.

The client workspace accepts live web searches only. Existing demonstration sessions stay in the local database and are excluded from history, shortlist and Excel export. Without a configured Brave Search key, new research is unavailable and saved web sessions remain accessible.

Verified the production build, browser behavior without a key, and exclusion of a previously approved sample record from history and workbook export. The Windows, Microsoft Excel and live provider acceptance checks still apply.

## v1.0.0-rc.1

First client release candidate for the local HA Prospection MVP. Includes demo and Brave Search modes, saved sessions, lead review, a source directory, manual evidence, follow-up fields, and Excel shortlist export. These features run in a browser on the operator’s computer.

This release adds a local launcher, an application version and log path, platform-specific data locations, and backup and restore commands. Use the README to install on a new machine or bring forward data from a development prototype.

The release candidate is intended for the client walkthrough. Windows installation, opening the workbook in Microsoft Excel, and a full Brave Search run with the client key are acceptance checks for the final `v1.0.0` release.

Verified from a fresh source copy on macOS 26.0 with Node.js 22.22.2 and npm 10.9.7. The check covered lockfile installation, production build, launcher startup and shutdown, programmatic Excel workbook readback, restart, backup and restore. The launcher refused a restore while the app was running.
