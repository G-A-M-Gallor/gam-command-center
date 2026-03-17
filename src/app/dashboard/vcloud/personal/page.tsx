"use client";
import { UserCircle } from "lucide-react";
import { ComingSoonPage } from "@/components/command-center/ComingSoonPage";
export default function Page() { return <ComingSoonPage icon={<UserCircle className="h-8 w-8 text-[var(--cc-accent-400)]" />} nameHe="מידע אישי" nameEn="Personal" nameRu="Личное" />; }
