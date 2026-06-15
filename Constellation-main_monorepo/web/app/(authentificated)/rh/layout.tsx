import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RH",
  description: "Ressources humaines et gestion associative.",
};

export default function RhLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
