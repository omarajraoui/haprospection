# Release notes

## v1.0.0-rc.10

L’accueil donne accès au catalogue des entreprises et aux demandes d’achat. La nouvelle vue interroge TED pour les produits agricoles et alimentaires et affiche les avis admissibles avec leur échéance et leur source. La sélection documentée s’enrichit de Yuly Food et d’AGT Foods.

## v1.0.0-rc.9

L’accueil présente une sélection internationale de fournisseurs et d’importateurs documentés, avec filtres par catégorie et pays, reprise des critères dans la recherche et accès au portail UNGM.

## v1.0.0-rc.8

La recherche est accessible depuis l’accueil. Ses critères distinguent le produit, son origine et le pays des entreprises ciblées. Le mode public prépare des requêtes guidées pour tout produit. Les espaces avec le service connecté utilisent les mêmes critères pour la recherche automatique.

## v1.0.0-rc.7

Le corridor affiche le nombre d’entreprises par produit, des exemples de recettes et de formats sourcés, et une recherche par nom facultative. La sélection inclut le thon, le grossiste Yuly Food et la conserverie Conserval. Les espaces existants reçoivent le nouveau prospect avec leurs décisions et preuves déjà enregistrées.

## v1.0.0-rc.6

L’accueil explique le résultat attendu et propose un accès direct à une première fiche acheteur. Le parcours accompagne ensuite la vérification, la décision et la relance. La vue Suivi des prospects permet de retrouver les entreprises retenues et d’exporter la liste.

## v1.0.0-rc.5

- Le site s’ouvre sur le corridor Maroc → France pour les conserves de poisson. La sélection relie des fournisseurs marocains documentés aux acheteurs français par produit, avec les preuves et les vérifications à faire.
- Le répertoire du corridor relie les organismes marocains et français aux démarches et aux données de marché correspondantes.
- La vue Opportunités interroge TED et écarte les avis dont l’échéance est expirée ou ambiguë. Le suivi du corridor est enregistré dans le navigateur.
- La qualification web distingue le produit, le rôle, le marché et l’origine. Pour la France, un identifiant légal publié déclenche un contrôle au registre. Une unité inactive est exclue de l’approbation et de l’export.
- La version Netlify reste accessible sans compte avec la sélection préparée. Les recherches web personnalisées demandent une configuration du moteur de recherche et de l’espace hébergé.

## v1.0.0-rc.4

Adds the hosted Vercel deployment configuration and a private browser sign-in. The hosted backend uses Supabase PostgreSQL and imports the prepared catalogue on first access. Local use remains available. Optional live searches run through a protected scheduled worker.

The production build, Chromium sign-in flow, and API operations were verified using a real PostgreSQL test database and controlled authentication and search responses. A deployed Supabase and Vercel production smoke test still requires account access. See [deployment instructions](DEPLOYMENT.md).

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
