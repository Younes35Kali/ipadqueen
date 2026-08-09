# iPad Queen — site premium

Boutique en ligne pour **iPad Queen** (revendeur iPad en Algérie), construite en HTML / CSS / JS
pur (pas de framework, pas de build) pour rester simple à modifier et à déployer.

## Structure

```
index.html        Page d'accueil (hero, avantages, produits vedettes, catégories,
                   avis clients, Instagram, FAQ, contact)
products.html      Boutique complète : recherche, filtres (catégorie / prix),
                   tri, favoris, "vus récemment"
product.html       Fiche produit détaillée (spécifications, WhatsApp, favoris, partage)
admin.html         Tableau de bord (gestion des produits + suivi des demandes WhatsApp)
css/style.css       Design system (couleurs, typographie, composants, animations)
js/data.js          Couche de données (catalogue + favoris + commandes, dans localStorage)
js/main.js          Interactions du site (nav, animations, filtres, produits)
js/admin.js         Logique du tableau de bord
js/footer.js         Pied de page injecté sur toutes les pages
assets/logo.jpg      Logo iPad Queen
robots.txt / sitemap.xml
```

## Ce qui est réellement inclus

- Design premium sur-mesure (rose poudré / rose gold / prune, à l'image du logo),
  animations au scroll, hover, compteurs animés, écran de chargement.
- Catalogue complet avec recherche, filtres par catégorie et budget, tri, favoris,
  produits récemment vus, produits liés.
- Bouton **Commander sur WhatsApp** sur chaque produit, message pré-rempli avec
  le nom exact de l'article, vers le **0551 58 32 84**.
- Tableau de bord admin (`admin.html`) pour ajouter / modifier / supprimer des produits
  et consulter les demandes clients envoyées via WhatsApp.
- SEO de base : meta titles/descriptions, Open Graph, données structurées `Store`,
  `robots.txt`, `sitemap.xml`.

## À savoir avant la mise en ligne

Ce site fonctionne **sans serveur** : le catalogue, les favoris et les demandes clients
sont stockés dans le navigateur (`localStorage`), pas dans une vraie base de données.
Concrètement :

- **C'est parfait pour démarrer** et présenter le site en ligne dès aujourd'hui.
- Les modifications faites depuis `admin.html` sur un ordinateur ne sont visibles
  que sur ce même navigateur — pas sur le site public que voient les visiteurs.
  Pour que les changements de catalogue soient visibles par tout le monde, il
  faudra brancher une vraie base de données (Supabase est un bon choix, gratuit
  pour démarrer) : seul `js/data.js` aurait besoin d'être adapté, le reste du site
  n'a pas à changer.
- Le mot de passe admin (`queen2026` par défaut, à changer dans `js/admin.js`) est
  une protection simple côté navigateur, pas une authentification sécurisée.
  Pour un usage réel avec plusieurs personnes, prévoir une vraie authentification
  (Supabase Auth, Netlify Identity...).
- Le flux Instagram est une mise en page statique avec un lien vers le profil —
  un vrai flux automatique demande l'API Instagram Graph (compte professionnel +
  validation Meta).

Aucun de ces points n'empêche de déployer et d'utiliser le site dès maintenant —
ce sont des évolutions naturelles pour la suite.

## Déploiement (Netlify — le plus simple)

1. Créer un compte sur [netlify.com](https://netlify.com).
2. Glisser-déposer le dossier complet du projet sur la page "Sites" de Netlify.
3. Le site est en ligne en quelques secondes avec une URL `*.netlify.app`.
4. Dans "Domain settings", ajouter un nom de domaine personnalisé si besoin
   (ex. `ipadqueen.dz` ou `.com`).

## Déploiement (Vercel)

1. Créer un compte sur [vercel.com](https://vercel.com).
2. "Add New Project" → importer le dossier ou un dépôt GitHub contenant ces fichiers.
3. Aucune configuration de build n'est nécessaire (site statique).

## Modifier les informations

- **Numéro WhatsApp** : remplacer `213551583284` dans `js/data.js` (`WHATSAPP_NUMBER`)
  et dans les liens `wa.me` des fichiers `.html`.
- **Produits** : soit via `admin.html`, soit directement dans `SEED_PRODUCTS`
  (`js/data.js`).
- **Couleurs / polices** : variables en haut de `css/style.css`.
