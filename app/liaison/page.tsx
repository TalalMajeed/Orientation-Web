"use client";

import LiaisonShell from "@/components/liaison/shell";
import { LiaisonProvider } from "@/components/liaison/store";

export default function LiaisonPage() {
  return (
    <LiaisonProvider>
      <LiaisonShell />
    </LiaisonProvider>
  );
}
