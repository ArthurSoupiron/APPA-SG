# Groupe de routes authentifiées

Ce dossier est un route group Next.js pour regrouper les pages qui nécessitent une session.

- Le nom entre parenthèses n'apparaît pas dans l'URL.
- Le `layout.tsx` applique déjà le garde `RedirectIfAnonymous`.
- Vous pouvez déplacer progressivement `account/`, `crm/`, etc. dans ce groupe.
