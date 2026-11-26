# Installer HA Prospection sur un PC Windows

Ce guide part d’un PC où rien n’est installé. HA Prospection s’ouvre dans votre navigateur et enregistre vos décisions sur le PC. **Il suffit d’installer Node.js.** Un éditeur de code (IDE) comme Visual Studio Code est facultatif. Vous pouvez tout faire avec l’Explorateur de fichiers et PowerShell, le terminal fourni avec Windows. Git, Vercel et Supabase sont facultatifs pour cette installation locale.

## 1. Installer Node.js

1. Ouvrez le [site officiel de téléchargement de Node.js](https://nodejs.org/en/download). Dans le menu des versions, choisissez **Node.js 22 LTS**, en version **22.12 ou supérieure**. LTS signifie que cette version bénéficie d’un support prolongé.
2. Sélectionnez **Windows**, puis téléchargez **Windows Installer (.msi)**. Choisissez **x64** pour un processeur Intel ou AMD, ou **ARM64** si Windows indique un processeur ARM. Pour vérifier, ouvrez **Paramètres → Système → Informations système** et lisez **Type du système**.
3. Ouvrez le fichier `.msi` dans **Téléchargements**. Dans l’assistant, cliquez sur **Next**, acceptez les conditions, puis gardez le dossier et les composants proposés. Vérifiez que **npm package manager** et **Add to PATH** restent sélectionnés s’ils apparaissent.
4. Si l’assistant propose des outils supplémentaires pour compiler des modules natifs, laissez cette option décochée. Cliquez sur **Install**, confirmez la demande Windows si nécessaire, puis cliquez sur **Finish**.
5. Fermez les terminaux qui étaient ouverts. Dans le menu **Démarrer**, recherchez **PowerShell** et ouvrez-le. Tapez la première commande ci-dessous, appuyez sur **Entrée**, puis faites de même avec la deuxième.

```powershell
node --version
npm.cmd --version
```

La première affiche une version commençant par `v22.`, au moins `v22.12.0`. La seconde affiche un numéro de version de npm. Si Windows ne reconnaît pas une commande, fermez puis rouvrez PowerShell. Si le problème persiste, vérifiez l’installation de Node.js ou demandez de l’aide à la personne qui administre le PC.

## 2. Télécharger et extraire l’app

1. Si vous avez reçu un fichier ZIP, enregistrez-le sur le PC. Sinon, ouvrez le [dépôt GitHub public](https://github.com/omarajraoui/haprospection), puis cliquez sur **Code → Download ZIP**. Le téléchargement est accessible sans compte GitHub. [Aide GitHub sur le téléchargement](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives)
2. Dans l’Explorateur de fichiers, ouvrez **Téléchargements**, faites un clic droit sur le ZIP et choisissez **Extraire tout**. Choisissez un dossier que vous retrouverez, par exemple dans **Documents**, puis cliquez sur **Extraire**.
3. Ouvrez le dossier extrait. Si vous voyez encore un sous-dossier, ouvrez-le jusqu’à voir le fichier `package.json` et le dossier `src`. C’est ce dossier qui contient l’app.

## 3. Ouvrir le terminal au bon endroit

Dans le dossier qui contient `package.json`, faites un clic droit sur un espace vide et choisissez **Ouvrir dans le terminal**. Si cette option manque, cliquez dans la barre d’adresse de l’Explorateur, tapez `powershell` et appuyez sur **Entrée**.

Dans le terminal, tapez `dir package.json` et appuyez sur **Entrée**. Le terminal doit afficher le nom de ce fichier. Si le fichier est introuvable, revenez à l’étape précédente et ouvrez le bon dossier.

## 4. Installer les dépendances et démarrer

Copiez la première commande dans le terminal et appuyez sur **Entrée**. Attendez que le terminal vous redonne la main avant de passer à la suivante. Si une commande affiche une erreur, arrêtez-vous à cette étape et consultez le dépannage ci-dessous.

| Commande | Ce qu’elle fait |
| --- | --- |
| `npm.cmd ci` | Télécharge les composants nécessaires. Une connexion Internet est requise. |
| `npm.cmd run build` | Prépare l’application pour le lancement. |
| `npm.cmd start` | Démarre l’app et ouvre le navigateur. Cette commande reste active pendant l’utilisation. |

Si le navigateur ne s’ouvre pas, copiez l’adresse affichée dans le terminal dans Edge ou Chrome. Par défaut, c’est [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Gardez le terminal ouvert pendant l’utilisation.

## 5. Vérifier que tout fonctionne

1. Dans **Prospects**, ouvrez une fiche de la sélection préparée et consultez les liens dans **Éléments de preuve**.
2. Pour essayer la revue, ouvrez **Décision de revue**, choisissez **Approuver**, rédigez un motif et cliquez sur **Enregistrer la décision**.
3. Ouvrez **Liste prioritaire**, puis cliquez sur **Exporter Excel**. Le fichier `ha-prospection.xlsx` arrive dans **Téléchargements**. Dans Excel, ouvrez les onglets **Leads** et **Evidence** pour retrouver le prospect et ses sources.
4. Si cette approbation était un essai, rouvrez la fiche et enregistrez votre véritable décision.

La sélection préparée fonctionne dès l’installation. Pour lancer une **Nouvelle recherche** sur Internet, une clé Brave Search doit être configurée. Cette étape est facultative. [Configuration de la recherche web](README.md#activer-la-recherche-web)

## 6. Fermer et rouvrir l’app

Pour arrêter l’app, revenez au terminal et appuyez sur **Ctrl+C**. Si Windows demande de confirmer, suivez l’invite. La prochaine fois, ouvrez le terminal dans le même dossier et tapez uniquement `npm.cmd start`.

Les décisions restent enregistrées. Le terminal indique le dossier des données et du journal. L’emplacement par défaut est `%LOCALAPPDATA%\HA Prospection`. Vous pouvez coller ce chemin dans la barre d’adresse de l’Explorateur. Consultez les [instructions de sauvegarde](README.md#données-locales-et-sauvegarde) avant une mise à jour.

## Dépannage

| Ce que vous voyez | Que faire |
| --- | --- |
| `node` ou `npm.cmd` est introuvable | Vérifiez l’installation de Node.js et rouvrez le terminal. |
| `package.json` est introuvable | Ouvrez le terminal dans le dossier extrait qui contient ce fichier. Lancez `dir package.json` pour vérifier. |
| `npm.cmd ci` échoue | Vérifiez la connexion Internet et envoyez le texte de l’erreur à votre contact si elle persiste. |
| Le navigateur affiche une page inaccessible | Gardez le terminal de l’app ouvert et utilisez l’adresse qui y est imprimée. |
| Le terminal indique que le port est déjà utilisé | Arrêtez l’autre instance de l’app ou demandez à votre contact de vérifier quel programme utilise ce port. |

Si vous demandez de l’aide, indiquez le numéro de l’étape et le message d’erreur exact.
