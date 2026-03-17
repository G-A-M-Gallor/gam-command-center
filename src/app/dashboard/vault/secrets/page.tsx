"use client";
import { ShieldCheck } from "lucide-react";
import { ComingSoonPage } from "@/components/command-center/ComingSoonPage";
export default function Page() { return <ComingSoonPage icon={<ShieldCheck className="h-8 w-8 text-[var(--cc-accent-400)]" />} nameHe="סודות" nameEn="Secrets" nameRu="Секреты" />; }
