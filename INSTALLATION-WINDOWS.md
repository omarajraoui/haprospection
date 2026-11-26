# Installer HA Prospection sur un PC Windows

L’application s’ouvre dans votre navigateur et enregistre les données sur votre PC. La sélection préparée, les décisions de revue et l’export Excel sont utilisables dès le premier démarrage.

## Première installation

1. Installez une version LTS de [Node.js](https://nodejs.org/en/download) compatible avec le projet (22.12 ou plus récente). L’installeur Windows inclut npm.
2. Récupérez le fichier ZIP fourni ou téléchargez le code depuis le [dépôt GitHub privé](https://github.com/omarajraoui/haprospection) avec **Code → Download ZIP**. Le téléchargement depuis GitHub nécessite un accès au dépôt.
3. Faites un clic droit sur le ZIP et choisissez **Extraire tout**. Ouvrez le dossier extrait qui contient `package.json`. Dans l’Explorateur de fichiers, faites un clic droit dans ce dossier et choisissez **Ouvrir dans le terminal**.
4. Exécutez ces commandes l’une après l’autre. Attendez la fin de chaque commande. La première nécessite Internet pour télécharger les dépendances.

```powershell
node --version
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Le navigateur s’ouvre automatiquement. Si besoin, ouvrez l’adresse affichée dans le terminal, généralement [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Gardez le terminal ouvert pendant l’utilisation.

## Utilisation et redémarrage

- Dans **Prospects**, ouvrez une fiche de la sélection préparée et consultez ses sources.
- Pour retenir une entreprise, choisissez **Approuver** dans **Décision de revue**, saisissez un motif, puis enregistrez. Le prospect apparaît dans **Liste prioritaire**, où vous pouvez l’exporter avec **Exporter Excel**.
- Pour arrêter l’app, appuyez sur **Ctrl+C** dans le terminal. Pour la rouvrir plus tard, ouvrez un terminal dans le même dossier et exécutez `npm.cmd start`.

Vous pouvez utiliser la sélection préparée sans compte Vercel, Supabase ou Brave. La clé Brave est facultative et sert uniquement à lancer une nouvelle recherche web.

## Retrouver les données ou demander de l’aide

Le terminal affiche le chemin de la base `prospection.sqlite` et du journal `app.log`. Sous Windows, ils sont par défaut dans `%LOCALAPPDATA%\HA Prospection`. Consultez le [README](README.md#local-data-and-backup) avant une mise à jour ou une restauration.

Si `node` ou `npm.cmd` est introuvable, fermez et rouvrez le terminal après avoir installé Node.js. Si npm indique que `package.json` est introuvable, ouvrez le dossier extrait qui contient ce fichier. Si l’application reste inaccessible, vérifiez l’adresse imprimée et le journal local.
