"use client";

// Permet de monter le module SG sous un préfixe d'URL différent (ex. /sg-demo
// pour une démo publique sans authentification). Par défaut, le module vit sous
// /rh/associatif : les pages réelles ne sont donc pas impactées.
import { createContext, useContext } from "react";

const SgBaseContext = createContext<string>("/rh/associatif");

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
