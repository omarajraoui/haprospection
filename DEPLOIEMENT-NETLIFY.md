# Mettre HA Prospection en ligne avec Netlify

Le client ouvre l’adresse HTTPS de l’application, se connecte et retrouve directement la sélection préparée. Les données sont dans Supabase PostgreSQL.

## 1. Préparer Supabase

1. Créez un projet Supabase. Dans **SQL Editor**, exécutez le contenu du [schéma de la base](server/cloud/schema.sql).
2. Dans **Authentication → Users**, créez le compte e-mail et mot de passe du client et confirmez son adresse. Désactivez les inscriptions publiques. L’application autorise un compte client par déploiement.
3. Dans **Connect**, récupérez l’URI du **Transaction pooler** (port 6543), avec le mot de passe de la base et TLS activé (`sslmode=require`). Récupérez aussi l’URL du projet et sa clé publique.

## 2. Configurer Netlify

Connectez Netlify à la branche `main` du dépôt. Le fichier [netlify.toml](netlify.toml) configure la commande de compilation, le dossier `dist` et les fonctions qui répondent aux routes `/api/*`.

Dans les paramètres Netlify, ajoutez ces variables d’environnement pour le contexte **Production** et la portée **Functions** si le choix de portée est proposé.

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | URI du pooler de transactions Supabase avec TLS. |
| `SUPABASE_URL` | URL du projet Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase. |
| `HAPROSPECTION_CLIENT_EMAIL` | Adresse du compte client créé dans Supabase. |
| `BRAVE_SEARCH_API_KEY` | Facultative. Active les recherches web via la fonction planifiée Netlify. |

Gardez le mot de passe de la base et la clé Brave dans Netlify. Après avoir ajouté les variables, déclenchez un nouveau déploiement de production.

## 3. Vérifier avant de partager le lien

1. Ouvrez `https://VOTRE-SITE.netlify.app/api/auth/status` dans une fenêtre privée. Avant connexion, cette adresse doit renvoyer `{"hosted":true,"authenticated":false}`. Si la réponse inclut `"configured":false`, vérifiez les quatre variables Supabase et relancez le déploiement.
2. Ouvrez l’adresse principale et connectez-vous avec le compte client. Vérifiez que la sélection préparée apparaît, puis enregistrez une décision et vérifiez l’export Excel.
3. Si la clé Brave est configurée, lancez une recherche et observez sa progression. Le traitement planifié s’exécute chaque minute sur le déploiement de production.

Une ancienne installation locale conserve ses données sur le PC. La base hébergée démarre avec la sélection préparée et les décisions prises en ligne.

[Configuration des fonctions Netlify](https://docs.netlify.com/build/functions/configuration/) · [Connexion à PostgreSQL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
