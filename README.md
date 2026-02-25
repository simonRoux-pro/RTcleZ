# RTcleZ

Plateforme de veille quotidienne pour rester informé de vos sujets d'intérêt.

## Technologies utilisées

Ce projet est construit avec :

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Installation locale

Les seules exigences sont d'avoir Node.js & npm installés - [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Suivez ces étapes :

```sh
# Étape 1 : Cloner le repository
git clone <YOUR_GIT_URL>

# Étape 2 : Naviguer vers le répertoire du projet
cd RTcleZ

# Étape 3 : Installer les dépendances nécessaires
npm i

# Étape 4 : Démarrer le serveur de développement avec rechargement automatique
npm run dev
```

## Déploiement sur Vercel

Ce projet peut être déployé facilement sur Vercel :

1. Connectez votre repository GitHub à Vercel
2. Vercel détectera automatiquement les paramètres de build
3. Assurez-vous d'ajouter vos variables d'environnement Supabase dans les paramètres du projet Vercel

### Variables d'environnement requises

Assurez-vous de configurer ces variables dans Vercel :

- `VITE_SUPABASE_URL` - URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` - Clé anonyme de votre projet Supabase

## Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run preview` - Prévisualiser le build de production
- `npm run lint` - Lancer le linter
