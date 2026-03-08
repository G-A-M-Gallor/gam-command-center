"use client";

import { useState, useCallback } from "react";

export interface ContactEntry {
  name: string;
  email: string;
  tel: string;
}

interface ContactsManager {
  select(
    properties: string[],
    options?: { multiple?: boolean }
  ): Promise<Array<{ name?: string[]; email?: string[]; tel?: string[] }>>;
  getProperties(): Promise<string[]>;
}

export function useContacts() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const isSupported =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    "ContactsManager" in window;

  const pickContacts = useCallback(async () => {
    if (!isSupported) return [];
    setLoading(true);
    try {
      const mgr = (navigator as unknown as { contacts: ContactsManager }).contacts;
      const results = await mgr.select(["name", "email", "tel"], {
        multiple: true,
      });

      const entries: ContactEntry[] = results.map((c) => ({
        name: c.name?.[0] || "",
        email: c.email?.[0] || "",
        tel: c.tel?.[0] || "",
      }));

      setContacts((prev) => {
        const existing = new Set(prev.map((p) => `${p.name}|${p.email}|${p.tel}`));
        const merged = [...prev];
        for (const entry of entries) {
          if (!existing.has(`${entry.name}|${entry.email}|${entry.tel}`)) {
            merged.push(entry);
          }
        }
        return merged;
      });

      return entries;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const clearContacts = useCallback(() => {
    setContacts([]);
  }, []);

  return { contacts, isSupported, loading, pickContacts, clearContacts };
}
