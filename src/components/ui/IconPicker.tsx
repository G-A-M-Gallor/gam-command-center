'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Upload, Link2, _X, Smile, Shapes, ImageIcon, Circle } from 'lucide-react';
import { parseIconValue, serializeIcon } from '@/lib/icons/iconValue';
import { EMOJI_CATEGORIES } from '@/lib/icons/emojiData';
import { LUCIDE_CATEGORIES, LUCIDE_MAP } from '@/lib/icons/lucideIconList';
import { useSettings } from '@/contexts/SettingsContext';
import { _getTranslations } from '@/lib/i18n';

// ─── IconDisplay ────────────────────────────────────────
// Renders any icon value inline — use this everywhere
export function IconDisplay({
  value,
  size = 20,
  className = '',
}: {
  value: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const parsed = parseIconValue(value);
  if (!parsed) return null;

  switch (parsed.kind) {
    case 'emoji':
      return (
        <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
          {parsed.value}
        </span>
      );
    case 'lucide': {
      const Icon = LUCIDE_MAP[parsed.value];
      if (!Icon) return <Circle size={size} className={className || 'text-slate-500'} />;
      return <Icon size={size} className={className} />;
    }
    case 'image':
      return (
        <img
          src={parsed.value}
          alt=""
          className={`rounded object-cover ${className}`}
          style={{ width: size, height: size }}
        />
      );
  }
}

// ─── IconPicker ─────────────────────────────────────────
type Tab = 'emoji' | 'icons' | 'image';

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  size?: number;
}

export function IconPicker({ value, onChange, size = 28 }: IconPickerProps) {
  const { language } = useSettings();
  const _t = getTranslations(language);
  const ip = t.iconPicker;
  const isRtl = language === 'he';
  const langKey = language === 'ru' ? 'labelRu' : isRtl ? 'labelHe' : 'labelEn';

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('emoji');
  const [search, setSearch] = useState('');
  const [emojiCat, setEmojiCat] = useState<string | null>(null);
  const [lucideCat, setLucideCat] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = useCallback((val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  // ── Emoji grid ──
  const filteredEmojis = useMemo(() => {
    const cats = emojiCat
      ? EMOJI_CATEGORIES.filter(c => c.id === emojiCat)
      : EMOJI_CATEGORIES;
    const all = cats.flatMap(c => c.emojis);
    if (!search) return all;
    // Emoji search doesn't make sense for chars — just return all
    return all;
  }, [emojiCat, search]);

  // ── Lucide grid ──
  const filteredLucide = useMemo(() => {
    const cats = lucideCat
      ? LUCIDE_CATEGORIES.filter(c => c.id === lucideCat)
      : LUCIDE_CATEGORIES;
    const all = cats.flatMap(c => c.icons);
    // dedupe
    const unique = [...new Set(all)];
    if (!search) return unique;
    const q = search.toLowerCase();
    return unique.filter(name => name.toLowerCase().includes(q));
  }, [lucideCat, search]);

  // ── Image upload handler ──
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const { uploadFile } = await import('@/lib/supabase/storageQueries');
      const { _createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { _user } } = await supabase.auth.getUser();
      if (!_user) { setUploading(false); return; }

      const result = await uploadFile(_user.id, file);
      if (result?.url) {
        pick(serializeIcon({ kind: 'image', value: result.url }));
      }
    } catch {
      // silent
    }
    setUploading(false);
  };

  const handleUrlSubmit = () => {
    if (!imgUrl.trim()) return;
    pick(serializeIcon({ kind: 'image', value: imgUrl.trim() }));
    setImgUrl('');
  };

  const parsed = parseIconValue(value);

  const TAB_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'emoji', label: ip.emoji, icon: Smile },
    { id: 'icons', label: ip.icons, icon: Shapes },
    { id: 'image', label: ip.image, icon: ImageIcon },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
        style={{ width: size + 12, height: size + 12 }}
        title={ip.pickIcon}
      >
        {parsed ? (
          <IconDisplay value={value} size={size} />
        ) : (
          <Smile size={size * 0.7} className="text-slate-500" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 w-[320px] rounded-xl border border-white/[0.08] bg-slate-900 shadow-2xl"
          style={{ [isRtl ? 'right' : 'left']: 0 }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2 pt-2">
            {TAB_ITEMS.map(ti => {
              const TIcon = ti.icon;
              return (
                <button
                  key={ti.id}
                  onClick={() => { setTab(ti.id); setSearch(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t-lg ${
                    tab === ti.id
                      ? 'text-purple-300 bg-purple-500/10 border-b-2 border-purple-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TIcon size={13} />
                  {ti.label}
                </button>
              );
            })}

            {/* Clear button */}
            {parsed && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="ms-auto p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                title={ip.remove}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search (for emoji & icons tabs) */}
          {tab !== 'image' && (
            <div className="px-3 pt-2">
              <div className="relative">
                <Search size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={ip.search}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] ps-8 pe-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-3 max-h-[280px] overflow-y-auto">
            {/* ── Emoji Tab ── */}
            {tab === 'emoji' && (
              <>
                {/* Category pills */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <button
                    onClick={() => setEmojiCat(null)}
                    className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                      !emojiCat ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {ip.all}
                  </button>
                  {EMOJI_CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setEmojiCat(c.id)}
                      className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                        emojiCat === c.id ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {c[langKey]}
                    </button>
                  ))}
                </div>
                {/* Emoji grid */}
                <div className="grid grid-cols-8 gap-1">
                  {filteredEmojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => pick(emoji)}
                      className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/[0.06] transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Icons Tab ── */}
            {tab === 'icons' && (
              <>
                {/* Category pills */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <button
                    onClick={() => setLucideCat(null)}
                    className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                      !lucideCat ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {ip.all}
                  </button>
                  {LUCIDE_CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setLucideCat(c.id)}
                      className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                        lucideCat === c.id ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {c[langKey]}
                    </button>
                  ))}
                </div>
                {/* Icons grid */}
                <div className="grid grid-cols-8 gap-1">
                  {filteredLucide.map(name => {
                    const Icon = LUCIDE_MAP[name];
                    if (!Icon) return null;
                    return (
                      <button
                        key={name}
                        onClick={() => pick(serializeIcon({ kind: 'lucide', value: name }))}
                        className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-white/[0.06] transition-colors text-slate-300 hover:text-purple-300"
                        title={name}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
                {filteredLucide.length === 0 && (
                  <p className="text-center text-xs text-slate-500 py-4">{ip.noResults}</p>
                )}
              </>
            )}

            {/* ── Image Tab ── */}
            {tab === 'image' && (
              <div className="space-y-3">
                {/* Upload */}
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-6 text-xs text-slate-400 hover:text-slate-200 hover:border-purple-500/30 transition-colors disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {uploading ? ip.uploading : ip.uploadFile}
                  </button>
                </div>

                {/* URL input */}
                <div>
                  <label className="text-[10px] font-medium text-slate-500 mb-1 block">{ip.orPasteUrl}</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Link2 size={13} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="url"
                        value={imgUrl}
                        onChange={e => setImgUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] ps-8 pe-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                    <button
                      onClick={handleUrlSubmit}
                      disabled={!imgUrl.trim()}
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-500 disabled:opacity-40"
                    >
                      {ip.apply}
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {parsed?.kind === 'image' && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL */}
                    <img
                      src={parsed.value}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="text-[10px] text-slate-500 truncate flex-1">{parsed.value}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
