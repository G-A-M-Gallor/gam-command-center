'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Hash, Link2, ArrowRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/command-center/PageHeader';
import { IconDisplay } from '@/components/ui/IconPicker';
import { useSettings } from '@/contexts/SettingsContext';
import { getTranslations } from '@/lib/i18n';
import { fetchGlobalFields, fetchEntityTypes, fetchEntityConnections } from '@/lib/supabase/entityQueries';
import { EntitySetupGuide } from '@/components/entities/EntitySetupGuide';

export default function EntitiesPage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const isHe = language === 'he';
  const te = t.entities;
  const lang = isHe ? 'he' : 'en';

  const [stats, setStats] = useState({ fields: 0, types: 0, connections: 0 });
  const [types, setTypes] = useState<{ slug: string; label: { he: string; en: string; ru: string }; icon: string; color: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [fields, entityTypes, connections] = await Promise.all([
        fetchGlobalFields(),
        fetchEntityTypes(),
        fetchEntityConnections(),
      ]);
      setStats({ fields: fields.length, types: entityTypes.length, connections: connections.length });
      setTypes(entityTypes);
      setLoading(false);
    })();
  }, []);

  const cards = [
    {
      href: '/dashboard/entities/fields',
      icon: Hash,
      label: te.fieldLibrary,
      desc: te.fieldLibraryDesc,
      count: stats.fields,
      color: 'purple',
    },
    {
      href: '/dashboard/entities/types',
      icon: Database,
      label: te.entityTypes,
      desc: te.entityTypesDesc,
      count: stats.types,
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-6" dir={isHe ? 'rtl' : 'ltr'}>
      <PageHeader pageKey="entities" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : (
        <>
          {/* Nav cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map(card => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${card.color}-500/10`}>
                        <Icon size={18} className={`text-${card.color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                          {card.label}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{card.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-slate-300">{card.count}</span>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Setup Guide */}
          <EntitySetupGuide
            lang={language === 'ru' ? 'ru' : isHe ? 'he' : 'en'}
            completedFields={stats.fields}
            completedTypes={stats.types}
            completedConnections={stats.connections}
          />

          {/* Quick access to entity types */}
          {types.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-500 mb-3">
                {te.entityTypes}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {types.map(et => (
                  <Link
                    key={et.slug}
                    href={`/dashboard/entities/${et.slug}`}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors group"
                  >
                    <IconDisplay value={et.icon} size={22} className="text-slate-300" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-purple-300 transition-colors">
                      {et.label[lang] || et.slug}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 text-xs text-slate-500 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-1.5">
              <Hash size={12} />
              <span>{stats.fields} {te.fields}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database size={12} />
              <span>{stats.types} {te.entityTypes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link2 size={12} />
              <span>{stats.connections} {te.connections}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
