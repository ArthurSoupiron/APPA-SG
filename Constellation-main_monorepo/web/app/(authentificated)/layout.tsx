import { AccountAppShell } from "@/components/account/account-app-shell";

/**
 * Shell unique pour toute la zone authentifiée : évite de remonter sidebar + session
 * à chaque navigation entre /myster, /account, /jaeger, /rh (flicker).
 * `RedirectIfAnonymous` est déjà dans `AccountAppShell`.
 */
export default function AuthentificatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AccountAppShell>{children}</AccountAppShell>;
}
