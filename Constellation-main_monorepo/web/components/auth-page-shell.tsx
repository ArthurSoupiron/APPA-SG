/** Écran neutre : évite un flash de texte / contenu avant redirection auth */
export function AuthPageShell() {
  return (
    <div
      className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black"
      role="status"
    >
      <div
        className="h-8 w-8 animate-pulse rounded-full bg-zinc-300 dark:bg-zinc-700"
        aria-hidden
      />
      <span className="sr-only">Chargement</span>
    </div>
  );
}
