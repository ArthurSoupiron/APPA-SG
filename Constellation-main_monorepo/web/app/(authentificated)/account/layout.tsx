import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compte",
  description: "Paramètres et informations de votre compte Constellation.",
};

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
