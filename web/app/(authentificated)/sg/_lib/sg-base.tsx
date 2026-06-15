"use client";

// Permet de monter le module SG sous un préfixe d'URL configurable. Le module
// vit sous /sg ; ce contexte garde tous les liens internes cohérents.
import { createContext, useContext } from "react";

const SgBaseContext = createContext<string>("/sg");

export function SgBaseProvider({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <SgBaseContext.Provider value={value}>{children}</SgBaseContext.Provider>;
}

/** Préfixe d'URL courant du module SG (sans slash final). */
export function useSgBase() {
  return useContext(SgBaseContext);
}
