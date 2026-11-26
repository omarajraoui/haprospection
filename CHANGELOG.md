# Release notes

## v1.0.0-rc.1

First client release candidate for the local HA Prospection MVP. Includes demo and Brave Search modes, saved sessions, lead review, a source directory, manual evidence, follow-up fields, and Excel shortlist export. These features run in a browser on the operator’s computer.

This release adds a local launcher, an application version and log path, platform-specific data locations, and backup and restore commands. Use the README to install on a new machine or bring forward data from a development prototype.

The release candidate is intended for the client walkthrough. Windows installation, opening the workbook in Microsoft Excel, and a full Brave Search run with the client key are acceptance checks for the final `v1.0.0` release.

Verified from a fresh source copy on macOS 26.0 with Node.js 22.22.2 and npm 10.9.7. The check covered lockfile installation, production build, launcher startup and shutdown, programmatic Excel workbook readback, restart, backup and restore. The launcher refused a restore while the app was running.
