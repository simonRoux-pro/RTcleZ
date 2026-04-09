# Morning Tech Briefing — Prompt de spécification

## Vision produit

Une application web minimaliste de **veille technique matinale** :
en un seul clic au réveil, l'utilisateur obtient un résumé de l'actu tech en 10 phrases,
synthétisé par Claude, et lisible en audio (podcast) pendant sa douche.

---

## Fonctionnalités cibles

### 1. Scraping des actualités (inspiré de RTcleZ)
- Récupérer les derniers articles tech du jour via **Firecrawl** (search + scrape)
- Sources : mots-clés configurables par l'utilisateur (ex : IA, startups, cybersécurité, dev)
- Filtre automatique : articles gratuits, pas de paywall, dernières 24h
- Stockage dans Supabase (table `articles`) avec déduplication

### 2. Résumé IA en 10 phrases (Claude API)
- Envoyer les titres + résumés des articles scrapés à **Claude Sonnet** (claude-sonnet-4-6)
- Prompt système : produire exactement 10 phrases, en français, ton neutre et informatif,
  couvrant les sujets les plus importants du jour, en ordre décroissant d'importance
- Résultat affiché à l'écran + stocké en base pour consultation ultérieure

### 3. Lecture audio / podcast (TTS)
- Convertir le résumé en audio via **l'API Web Speech** (browser natif, gratuit)
  ou **ElevenLabs / OpenAI TTS** si voix plus naturelle souhaitée
- Player audio intégré : play/pause, vitesse (0.8x, 1x, 1.25x, 1.5x)
- Format pensé pour écoute mains libres (douche, transport)

### 4. UX one-click
- Bouton principal unique : **"Mon briefing du matin"**
- Pipeline automatique : scrape → résumé Claude → génération audio → lecture auto
- Durée estimée : < 30 secondes bout-en-bout
- Indicateur de progression visuel pendant le chargement

### 5. Historique des briefings
- Conserver les 30 derniers briefings avec leur date
- Possibilité de réécouter ou relire un briefing passé

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React + Vite + TypeScript + Tailwind (comme RTcleZ) |
| Auth | Supabase Auth |
| Base de données | Supabase PostgreSQL |
| Scraping | Firecrawl API (via Edge Function Supabase) |
| IA résumé | Claude API (claude-sonnet-4-6) via Edge Function |
| Audio | Web Speech API (browser) ou TTS API externe |
| Déploiement | Vercel |

---

## Architecture des Edge Functions

```
supabase/functions/
  firecrawl-search/     ← déjà existant, réutiliser
  claude-summarize/     ← NOUVEAU : appelle Claude API avec les articles
  tts-generate/         ← OPTIONNEL : si TTS externe (ElevenLabs/OpenAI)
```

### `claude-summarize` — payload attendu
```json
{
  "articles": [
    { "title": "...", "summary": "...", "url": "..." }
  ],
  "lang": "fr",
  "sentences": 10
}
```

### `claude-summarize` — réponse
```json
{
  "briefing": "Phrase 1. Phrase 2. ... Phrase 10.",
  "generated_at": "2026-04-09T07:00:00Z"
}
```

---

## Schéma Supabase

```sql
-- Table briefings
create table briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  briefing_text text not null,
  article_count integer,
  keywords text[],
  audio_url text,
  created_at timestamptz default now()
);
```

---

## Prompt Claude (système)

```
Tu es un assistant de veille technologique. On t'envoie une liste d'articles tech du jour.
Rédige exactement 10 phrases en français, chacune autonome et informative.
- Couvre les sujets les plus importants en premier
- Ton neutre, journalistique, sans opinion
- Chaque phrase = 1 info clé (qui, quoi, impact)
- Pas de bullet points, pas de titres, juste 10 phrases séparées par un saut de ligne
- Si peu d'articles, synthétise et complète avec le contexte général du domaine
```

---

## Priorités de développement (ordre)

1. Edge Function `claude-summarize` (cœur du produit)
2. Hook `useBriefing` — orchestre scrape → résumé → stockage
3. Page `Briefing.tsx` — bouton unique + player audio + affichage des 10 phrases
4. Table Supabase `briefings` + migration
5. Historique des briefings passés
6. (Optionnel) TTS externe pour voix plus naturelle
