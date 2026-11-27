# Audit des agents HA Prospection

Le brief décrit un cycle commercial complet. Il faut trouver des entreprises et des demandes d’achat, qualifier les sociétés et les contacts, analyser les prix, puis décider d’une prise de contact. Cet audit reprend les agents 0 à 6 des pages 4 et 5 du PDF. Les extensions de négociation et de logistique restent en aval du premier cycle de prospection.

## Couverture actuelle

| Agent du PDF | Mise en œuvre | Résultat attendu pour terminer le périmètre |
| --- | --- | --- |
| 0 · Coordinateur | Tâches persistantes, limites de recherche, résultat partiel, relance ciblée. | Rapport par mission avec sources consultées, décisions humaines, coût et taux de prospects exploitables. Planification de la veille préparée. |
| 1 · Chasseur et qualification | Les termes du produit doivent être réunis dans un passage. Les mentions du rôle, du marché et de l’origine demandée sont affichées séparément. Une adresse générique achats n’est retenue que si elle est publiée sur le site et correspond à son domaine. | Fiches prêtes pour la prospection après revue. Afficher preuves de l’activité, contact professionnel, adéquation aux spécifications et prochaine action. |
| 2 · Commandes et marchés | Le corridor Maroc → France interroge TED. L’app présente les avis français avec un code produit admissible et une échéance future non ambiguë. | Étendre aux autres portails et exploiter les volumes et conditions lorsque les données peuvent être rapprochées du lot. |
| 3 · Analyse prix | À construire. | Enregistrer des observations datées avec unité, devise, origine, qualité et Incoterm. Comparer uniquement des observations sur une base compatible et garder les données manquantes visibles. |
| 4 · Contact client | Approbation, motif et suivi manuel dans la liste prioritaire. | Générer un brouillon à partir des preuves et laisser le commercial valider le destinataire, le texte et l’envoi. Conserver le suivi des réponses et relances. |
| 5 · Exploration web et B2B | Deux requêtes distinctes, pages publiques et rapprochement par domaine dans une session. Les annuaires identifiés ne deviennent pas des fiches entreprise. | Introduire des sources adaptées à chaque corridor, puis rapprocher les entités entre sessions par identifiant légal vérifié. Constituer une sélection préparée qui apporte une valeur commerciale dès l’ouverture. |
| 6 · Vérification et risque | Pour la France, un SIREN ou SIRET explicitement publié déclenche une consultation du registre public. Un nom concordant et une unité active documentent l’identité. Une unité inactive bloque l’approbation et sort de la liste exportable. | Vérifier les identités des autres marchés et documenter séparément les certifications, alertes et éléments de risque selon des sources adaptées. |

## Portée des preuves

Un registre actif renseigne sur l’identité administrative. Les mentions trouvées sur une page sont des indices de produit ou d’activité. L’acheteur doit confirmer son besoin, ses spécifications, ses origines acceptées et son interlocuteur. Un résultat de registre avec un nom différent reste à rapprocher. Les informations absentes restent à confirmer.

Les recherches web restent optionnelles sur la version publique sans compte. Le catalogue préparé donne accès aux fiches vérifiées et à l’export dans le navigateur. Les appels au moteur et au registre pour de nouvelles missions nécessitent le service configuré.

## Séquence proposée

1. Constituer un lot exploitable sur un seul corridor, en commençant par les conserves de poisson et les importateurs français. Mesurer combien de candidats obtiennent une preuve d’identité, une preuve de gamme et une prochaine action que le commercial accepte.
2. Élargir l’agent des demandes d’achat au-delà de TED avec des dates et liens vérifiables. Mesurer la part des demandes encore ouvertes et adaptées au besoin.
3. Ajouter les observations de prix lorsque les sources retenues permettent des comparaisons utiles. Valider les calculs sur des cas reflétant les pratiques du client.
4. Ajouter les brouillons et la revue humaine du contact à partir des fiches approuvées.

Exécuter `npm test` pour vérifier la qualification et les cas de registre sur des données de test contrôlées.
