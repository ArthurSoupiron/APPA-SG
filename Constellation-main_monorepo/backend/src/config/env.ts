function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ ERREUR: La variable d'environnement ${name} n'est pas définie.`);
    process.exit(1);
  }
  return value;
}

let cache: { corsOrigin: string; port: string } | null = null;

export function getBackendEnv(): { corsOrigin: string; port: string } {
  if (!cache) {
    cache = {
      corsOrigin: requireEnv("CORS_ORIGIN"),
      port: requireEnv("BACKEND_PORT"),
    };
  }
  return cache;
}
