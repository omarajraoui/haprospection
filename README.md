# HA Prospection

HA Prospection vous aide à repérer des acheteurs et fournisseurs agroalimentaires, à consulter les sources de chaque fiche et à préparer une liste de prospects à contacter.

## Que faire à la première ouverture ?

1. Dans **Prospects**, consultez la sélection préparée. Elle contient deux entreprises françaises dans le secteur des conserves de poisson. Chaque fiche indique les sources utilisées pour documenter l’identité de l’entreprise et sa gamme.
2. Utilisez les filtres de revue ou le champ de recherche pour retrouver une entreprise ou une source. Ouvrez une fiche et lisez les **Éléments de preuve** avant de décider.
3. Dans **Décision de revue**, choisissez **Approuver**, **Signaler** ou **Écarter**, saisissez un motif et enregistrez la décision. Une approbation ajoute l’entreprise à la **Liste prioritaire**.
4. Dans **Liste prioritaire**, renseignez si besoin le responsable et la date de relance. Cliquez sur **Exporter Excel** pour télécharger la liste complète des prospects approuvés. Les onglets **Leads** et **Evidence** utilisent le même identifiant pour relier chaque entreprise à ses sources.
5. Si vous trouvez une source utile, ajoutez-la dans **Ressources**, puis ouvrez la fiche et choisissez **Rattacher une source**. Si le prospect était approuvé, examinez de nouveau la fiche avant de l’exporter.

La sélection est disponible dès l’ouverture. Les dates de consultation figurent dans les fiches. Confirmez l’intérêt de l’entreprise pour votre offre et identifiez le bon interlocuteur avant de la contacter.

## Installer sur votre PC Windows

Suivez le [guide d’installation Windows](INSTALLATION-WINDOWS.md). Il détaille l’installation de Node.js, le téléchargement du ZIP, l’ouverture de PowerShell et le premier démarrage. Un navigateur et Node.js suffisent. Vous pouvez utiliser la sélection préparée, enregistrer vos décisions et exporter sans clé Brave Search.

### Commandes d’installation et de démarrage

La version candidate est `v1.0.0-rc.4`. Dans le dossier extrait qui contient `package.json`, ouvrez PowerShell et exécutez les commandes suivantes dans l’ordre.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Sur macOS ou Linux, utilisez `npm` à la place de `npm.cmd`. L’app s’ouvre normalement à l’adresse `http://127.0.0.1:4173/`. Gardez le terminal ouvert pendant l’utilisation. Pour arrêter l’app, appuyez sur **Ctrl+C**. Pour la rouvrir, exécutez simplement la dernière commande dans le même dossier.

## Activer la recherche web

La recherche web est facultative. Demandez à votre contact de configurer une clé [Brave Search](https://api-dashboard.search.brave.com/) dans la variable d’environnement `BRAVE_SEARCH_API_KEY`, puis redémarrez l’app. Gardez la clé hors du dépôt et des captures d’écran.

Sur Windows, ouvrez PowerShell dans le dossier de l’app et saisissez la clé dans l’invite sécurisée.

```powershell
$env:BRAVE_SEARCH_API_KEY = [System.Net.NetworkCredential]::new("", (Read-Host "Clé Brave Search" -AsSecureString)).Password
npm.cmd start
```

Sur macOS ou Linux, ces commandes sont prévues pour Bash.

```bash
read -rs BRAVE_SEARCH_API_KEY
export BRAVE_SEARCH_API_KEY
npm start
```

Dans **Prospects**, cliquez sur **Nouvelle recherche**, choisissez une mission ou personnalisez le produit, le marché et le type d’entreprise. L’application utilise Brave pour trouver des liens, lit les pages accessibles et présente les mentions de produits comme des pistes à examiner. Chaque session lance deux requêtes et traite jusqu’à dix pages. Les recherches peuvent être facturées selon votre offre Brave.

Dans **Activité de la session**, ouvrez **Requêtes et pages consultées** pour voir les sources et les éventuels échecs. Si la recherche est partielle, les résultats déjà trouvés restent disponibles. Utilisez **Relancer les étapes en échec** pour réessayer une fois. Vérifiez l’identité, la gamme et la pertinence avant d’approuver un candidat.

## Données locales et sauvegarde

L’application indique le chemin de la base `prospection.sqlite` et du journal `app.log` au démarrage. Sous Windows, le dossier se trouve par défaut dans `%LOCALAPPDATA%\HA Prospection`. Sous macOS, il se trouve dans `~/Library/Application Support/HA Prospection`. Sous Linux, il se trouve dans `$XDG_DATA_HOME/ha-prospection` ou `~/.local/share/ha-prospection`. La variable `HAPROSPECTION_DATA_DIR` permet de choisir un autre emplacement.

Arrêtez l’application avant de restaurer une sauvegarde ou de changer de version. Exécutez les commandes depuis le dossier de l’application. Remplacez le chemin par un emplacement de sauvegarde hors du dossier du projet.

```powershell
npm.cmd run backup -- "C:\Sauvegardes\ha-prospection.sqlite"
npm.cmd run restore -- "C:\Sauvegardes\ha-prospection.sqlite"
```

Créez le dossier de sauvegarde s’il manque et choisissez un nom de fichier disponible lors de la sauvegarde. La restauration crée d’abord une copie de vos données actuelles dans un fichier `before-restore-*.sqlite`. Après restauration, ouvrez l’application et vérifiez qu’une session connue s’affiche.

### Mettre à jour l’application

1. Arrêtez l’application et sauvegardez vos données.
2. Extrayez la nouvelle version dans un autre dossier, puis exécutez les trois commandes d’installation depuis ce dossier. Si vous aviez personnalisé le dossier de données, utilisez le même emplacement.
3. Vérifiez la version affichée et rouvrez un prospect connu. Pour revenir à la version précédente, arrêtez l’app et restaurez la sauvegarde réalisée avant la mise à jour.

Les anciennes versions de développement stockaient la base dans `data/prospection.sqlite` à l’intérieur du projet. Pour récupérer cette base, arrêtez le serveur de développement et indiquez son chemin complet à la commande de restauration de la version installée.

## En cas de problème

- Si une commande est introuvable ou si le navigateur n’affiche rien, consultez la rubrique **Dépannage** du [guide Windows](INSTALLATION-WINDOWS.md).
- Si le port est occupé, fermez l’autre instance ou définissez `HAPROSPECTION_PORT` avec un port libre avant de démarrer.
- Si l’application signale que le dossier de données est occupé, fermez l’autre instance ou attendez la fin de la restauration. Après un arrêt brutal, retirez le fichier `release.lock` uniquement après avoir confirmé que l’application et son serveur sont arrêtés.
- Si le problème persiste, transmettez à votre contact le numéro de l’étape et le message d’erreur affiché.

## Documentation technique

- [Déploiement Netlify et Supabase](DEPLOIEMENT-NETLIFY.md) pour l’administration d’un site Netlify.
- [Déploiement Vercel et Supabase](DEPLOYMENT.md) pour l’administration de la version hébergée.
- [Parcours de test](PILOT.md), [notes de version](CHANGELOG.md) et [exigences techniques](TRD.md).

La sélection initiale est un relevé daté. Les identités ont été contrôlées via l’[API Recherche d’entreprises](https://recherche-entreprises.api.gouv.fr/docs/) et les gammes ont été documentées à partir des sites des entreprises. Pour préparer un nouveau relevé destiné à une future installation, vérifiez les pages de la sélection puis lancez `npm run catalogue:prepare -- AAAA-MM-JJ` avec la date de consultation. Chaque base locale importe la sélection une seule fois et conserve ses décisions.
