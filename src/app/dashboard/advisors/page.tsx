"use client";

import { useState } from "react";
import { Bot, Users, Sparkles, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTranslations } from "@/lib/i18n";
import { useSettings } from "@/contexts/SettingsContext";
import { PageHeader } from "@/components/command-center/PageHeader";
import { AdvisorChat } from "@/components/ai-hub/AdvisorChat";
import { PERSONAS, PERSONA_DOMAINS } from "@/lib/ai/personas";
import type { Persona } from "@/lib/ai/personas";

export default function AdvisorsPage() {
  const router = useRouter();
  const { language } = useSettings();
  const t = getTranslations(language);

  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const filteredPersonas = selectedDomain
    ? PERSONAS.filter(p => p.domain === selectedDomain)
    : PERSONAS;

  const PersonaGrid = () => (
    <div className="space-y-6">
      {/* Domain Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDomain(null)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedDomain === null
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          כל התחומים
        </button>
        {PERSONA_DOMAINS.map(domain => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomain(domain.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedDomain === domain.id
                ? `bg-${domain.color}-600 text-white`
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {domain.label.he}
          </button>
        ))}
      </div>

      {/* Personas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonas.map(persona => (
          <button
            key={persona.id}
            onClick={() => setSelectedPersona(persona)}
            className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-right group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full bg-${persona.color}-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-${persona.color}-500/30 transition-colors`}>
                <Bot className={`w-6 h-6 text-${persona.color}-400`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-200 text-base mb-1">
                  {persona.name.he}
                </h3>
                <p className={`text-sm text-${persona.color}-400 mb-2`}>
                  {persona.domainLabel.he}
                </p>
                <p className="text-xs text-slate-400 line-clamp-3">
                  {persona.instructions.substring(0, 120)}...
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const ChatView = () => (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => setSelectedPersona(null)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        חזור לבחירת יועץ
      </button>

      {/* Selected Persona Info */}
      {selectedPersona && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full bg-${selectedPersona.color}-500/20 flex items-center justify-center flex-shrink-0`}>
              <Bot className={`w-6 h-6 text-${selectedPersona.color}-400`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-200 mb-1">
                {selectedPersona.name.he}
              </h2>
              <p className={`text-sm text-${selectedPersona.color}-400 mb-2`}>
                {selectedPersona.domainLabel.he}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                מומחה בתחום {selectedPersona.domainLabel.he}.
                מוכן לעזור לך עם שאלות מקצועיות, עצות והכוונה בתחום המומחיות.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <AdvisorChat
        selectedPersonaId={selectedPersona?.id}
        className="h-[600px]"
      />
    </div>
  );

  return (
    <div className="min-h-screen">
      <PageHeader pageKey="aiAdvisors" />

      <div className="px-3 py-4 sm:p-6">
        {!selectedPersona ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-200 mb-2">
                  יועצי AI מקצועיים
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  קבל עצות מקצועיות מיועצי AI מתמחים בתחומים שונים.
                  כל יועץ מוכן לספק הכוונה מותאמת אישית לתחום המומחיות שלו.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {PERSONAS.length}
                </div>
                <div className="text-sm text-slate-400">יועצים מקצועיים</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {PERSONA_DOMAINS.length}
                </div>
                <div className="text-sm text-slate-400">תחומי מומחיות</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  24/7
                </div>
                <div className="text-sm text-slate-400">זמינות</div>
              </div>
            </div>

            <PersonaGrid />
          </div>
        ) : (
          <ChatView />
        )}
      </div>
    </div>
  );
}