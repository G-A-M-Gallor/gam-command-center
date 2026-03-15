'use client';

import { useState, useMemo, useCallback } from 'react';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import { Copy, Check, Shuffle } from 'lucide-react';

// ─── Fonts ───────────────────────────────────────────────
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
});

// ─── Types ───────────────────────────────────────────────
interface Atmosphere {
  id: string;
  emoji: string;
  labelHe: string;
  keyword: string;
  sceneDescription: string;
  mood: string;
  sound: string;
  synonyms: string[];
}

interface VisualStyle {
  id: string;
  label: string;
  colorGrade: string;
  extraNotes: string;
  synonyms: string[];
}

// ─── Data ────────────────────────────────────────────────
const atmospheres: Atmosphere[] = [
  { id: 'epic', emoji: '🏔️', labelHe: 'אפי', keyword: 'epic', sceneDescription: 'Sweeping wide shot of vast terrain under dramatic skies', mood: 'Grand, awe-inspiring, monumental', sound: 'orchestral score swelling in the distance', synonyms: ['majestic', 'heroic', 'towering'] },
  { id: 'intimate', emoji: '🕯️', labelHe: 'אינטימי', keyword: 'intimate', sceneDescription: 'Close-up details in a warm, dimly lit interior space', mood: 'Warm, personal, tender', sound: 'soft ambient hum and gentle rustling', synonyms: ['cozy', 'personal', 'close'] },
  { id: 'futuristic', emoji: '🚀', labelHe: 'עתידני', keyword: 'futuristic', sceneDescription: 'Sleek neon-lit environment with holographic interfaces and clean lines', mood: 'Forward-looking, innovative, electric', sound: 'synthesizer drones and digital pulses', synonyms: ['sci-fi', 'cybernetic', 'avant-garde'] },
  { id: 'nostalgic', emoji: '📻', labelHe: 'נוסטלגי', keyword: 'nostalgic', sceneDescription: 'Sun-drenched scene with vintage color tones and soft grain', mood: 'Warm, bittersweet, reflective', sound: 'vinyl crackle and distant laughter', synonyms: ['retro', 'wistful', 'sentimental'] },
  { id: 'mysterious', emoji: '🌫️', labelHe: 'מסתורי', keyword: 'mysterious', sceneDescription: 'Fog-filled landscape with silhouettes emerging from shadow', mood: 'Enigmatic, suspenseful, intriguing', sound: 'low rumbling fog horns and wind whispers', synonyms: ['enigmatic', 'cryptic', 'shadowy'] },
  { id: 'energetic', emoji: '⚡', labelHe: 'אנרגטי', keyword: 'energetic', sceneDescription: 'Fast-paced montage of vibrant motion and dynamic lighting', mood: 'Alive, pulsing, explosive', sound: 'driving beat and rhythmic percussion', synonyms: ['dynamic', 'electric', 'vibrant'] },
  { id: 'serene', emoji: '🌊', labelHe: 'שליו', keyword: 'serene', sceneDescription: 'Calm water surface reflecting golden hour light, gentle ripples', mood: 'Peaceful, meditative, tranquil', sound: 'gentle waves lapping on shore', synonyms: ['tranquil', 'peaceful', 'still'] },
  { id: 'dark', emoji: '🖤', labelHe: 'אפל', keyword: 'dark', sceneDescription: 'Deep shadows with minimal light sources carving through blackness', mood: 'Ominous, brooding, intense', sound: 'deep bass rumble and distant thunder', synonyms: ['ominous', 'grim', 'brooding'] },
  { id: 'playful', emoji: '🎈', labelHe: 'שובב', keyword: 'playful', sceneDescription: 'Bright, colorful scene with unexpected whimsical elements and bouncy motion', mood: 'Fun, lighthearted, joyful', sound: 'cheerful chimes and light xylophone', synonyms: ['whimsical', 'fun', 'lighthearted'] },
  { id: 'luxurious', emoji: '💎', labelHe: 'יוקרתי', keyword: 'luxurious', sceneDescription: 'Gleaming surfaces of marble, gold, and crystal in elegant setting', mood: 'Opulent, refined, aspirational', sound: 'champagne fizz and soft jazz piano', synonyms: ['opulent', 'premium', 'lavish'] },
  { id: 'raw', emoji: '🔩', labelHe: 'גולמי', keyword: 'raw', sceneDescription: 'Unfiltered handheld footage with natural imperfections and real textures', mood: 'Authentic, gritty, unpolished', sound: 'street noise and ambient city sounds', synonyms: ['gritty', 'unpolished', 'real'] },
  { id: 'dreamy', emoji: '☁️', labelHe: 'חלומי', keyword: 'dreamy', sceneDescription: 'Soft-focus ethereal scene with floating particles and gentle bloom', mood: 'Ethereal, surreal, weightless', sound: 'reverb-drenched piano and distant choir', synonyms: ['ethereal', 'hazy', 'floating'] },
  { id: 'dramatic', emoji: '🎭', labelHe: 'דרמטי', keyword: 'dramatic', sceneDescription: 'High-contrast scene with powerful visual tension and stark lighting', mood: 'Intense, gripping, theatrical', sound: 'crescendo strings and booming timpani', synonyms: ['intense', 'theatrical', 'powerful'] },
  { id: 'minimal', emoji: '⬜', labelHe: 'מינימלי', keyword: 'minimal', sceneDescription: 'Clean negative space with single subject in vast emptiness', mood: 'Focused, pure, contemplative', sound: 'near-silence with a single sustained tone', synonyms: ['clean', 'sparse', 'stripped-back'] },
  { id: 'urban', emoji: '🏙️', labelHe: 'עירוני', keyword: 'urban', sceneDescription: 'City streets alive with neon signs, traffic, and concrete textures', mood: 'Gritty, alive, metropolitan', sound: 'traffic hum and distant sirens', synonyms: ['metropolitan', 'city-slick', 'street-level'] },
  { id: 'nature', emoji: '🌿', labelHe: 'טבעי', keyword: 'nature', sceneDescription: 'Lush organic environment with dappled sunlight through canopy', mood: 'Grounded, organic, alive', sound: 'birdsong and rustling leaves', synonyms: ['organic', 'wild', 'earthy'] },
  { id: 'retro-tech', emoji: '📼', labelHe: 'רטרו-טק', keyword: 'retro-tech', sceneDescription: 'CRT monitors, analog dials, and glowing vacuum tubes in dim room', mood: 'Analog, textured, mechanical', sound: 'tape hiss and CRT static buzz', synonyms: ['analog', 'lo-fi', 'vintage-tech'] },
  { id: 'spiritual', emoji: '✨', labelHe: 'רוחני', keyword: 'spiritual', sceneDescription: 'Sacred space bathed in golden light with dust motes floating upward', mood: 'Transcendent, uplifting, sacred', sound: 'resonant bowl singing and gentle chant', synonyms: ['transcendent', 'sacred', 'celestial'] },
  { id: 'industrial', emoji: '⚙️', labelHe: 'תעשייתי', keyword: 'industrial', sceneDescription: 'Massive machinery, sparks, and steel structures in cavernous factory', mood: 'Powerful, mechanical, imposing', sound: 'metallic clanking and hydraulic hiss', synonyms: ['mechanical', 'steely', 'factory-born'] },
  { id: 'romantic', emoji: '🌹', labelHe: 'רומנטי', keyword: 'romantic', sceneDescription: 'Soft candlelight, blooming flowers, and warm skin tones in golden hour', mood: 'Tender, passionate, beautiful', sound: 'solo violin and gentle breeze', synonyms: ['tender', 'amorous', 'passionate'] },
];

const visualStyles: VisualStyle[] = [
  { id: 'cinematic', label: 'Cinematic', colorGrade: 'teal-and-orange Hollywood color grade', extraNotes: 'Film grain texture, letterbox framing.', synonyms: ['Hollywood-grade', 'blockbuster-style', 'widescreen'] },
  { id: 'documentary', label: 'Documentary', colorGrade: 'natural balanced color grade with slight desaturation', extraNotes: 'Observational framing, available light.', synonyms: ['docu-style', 'observational', 'verité'] },
  { id: 'fashion', label: 'Fashion Film', colorGrade: 'high-contrast editorial color grade with rich blacks', extraNotes: 'Magazine-quality framing, beauty lighting.', synonyms: ['editorial', 'haute couture', 'glossy'] },
  { id: 'music-video', label: 'Music Video', colorGrade: 'stylized saturated color grade with bold primary colors', extraNotes: 'Rhythmic cuts, performative energy, lens flares.', synonyms: ['MTV-style', 'performance-driven', 'high-energy'] },
  { id: 'anime', label: 'Anime', colorGrade: 'vibrant cel-shaded color palette with glowing highlights', extraNotes: 'Clean line art, dramatic speed lines, exaggerated expressions.', synonyms: ['cel-shaded', 'manga-inspired', 'Japanese animation'] },
  { id: 'noir', label: 'Film Noir', colorGrade: 'black-and-white with deep shadow contrast', extraNotes: 'Venetian blind shadows, smoke, wet streets reflecting light.', synonyms: ['hard-boiled', 'shadow-play', 'monochrome'] },
  { id: 'vaporwave', label: 'Vaporwave', colorGrade: 'pink-purple-cyan gradient color wash', extraNotes: 'Glitch artifacts, Greek statues, retro grid horizons.', synonyms: ['aesthetic', 'retro-digital', 'synthwave'] },
  { id: 'stop-motion', label: 'Stop Motion', colorGrade: 'warm tactile color grade with slight vignette', extraNotes: 'Handcrafted texture, visible material quality, miniature scale.', synonyms: ['claymation-style', 'handcrafted', 'puppet-like'] },
  { id: 'drone', label: 'Aerial/Drone', colorGrade: 'vivid landscape color grade with enhanced sky tones', extraNotes: 'Bird\'s eye perspective, sweeping reveals, geographical scale.', synonyms: ['overhead', 'bird\'s-eye', 'sky-view'] },
  { id: 'vintage-film', label: 'Vintage Film', colorGrade: 'faded warm tones with lifted blacks and soft halation', extraNotes: 'Super 8 / 16mm look, light leaks, gate weave.', synonyms: ['retro-film', 'old-school', 'analog-cinema'] },
  { id: 'hyper-real', label: 'Hyper-Real', colorGrade: 'razor-sharp clarity with micro-contrast and vivid saturation', extraNotes: 'Macro detail visible, every texture amplified, 8K sharpness.', synonyms: ['ultra-HD', 'crystal-clear', 'photo-real'] },
  { id: 'watercolor', label: 'Watercolor', colorGrade: 'soft pastel washes with transparent layered tones', extraNotes: 'Paint bleed edges, paper texture overlay, organic color mixing.', synonyms: ['painted', 'aquarelle', 'wash-style'] },
];

const durations = ['5s', '8s', '15s'] as const;
const transitionOptions = [
  { value: 0, label: 'ללא' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];
const ratios = ['9:16', '16:9', '1:1'] as const;
const cameraMovements = [
  'Push In', 'Pull Out', 'Pan', 'Static', 'Dolly', 'Handheld', 'Drone Orbit',
] as const;

const transitionsText: Record<number, string> = {
  0: 'Single continuous shot.',
  1: 'One seamless transition mid-scene.',
  2: 'Two smooth transitions dividing the video into three acts.',
  3: 'Three fluid transitions creating a four-part visual narrative.',
};

// ─── Helpers ─────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Component ───────────────────────────────────────────
export default function VideoPromptPage() {
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<typeof durations[number]>('8s');
  const [selectedTransitions, setSelectedTransitions] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState<typeof ratios[number]>('16:9');
  const [selectedCameraMovements, setSelectedCameraMovements] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [brandMessage, setBrandMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [variationSeed, setVariationSeed] = useState(0);

  const toggleCamera = useCallback((movement: string) => {
    setSelectedCameraMovements(prev => {
      if (prev.includes(movement)) return prev.filter(m => m !== movement);
      if (prev.length >= 2) return prev;
      return [...prev, movement];
    });
  }, []);

  const prompt = useMemo(() => {
    const atmo = atmospheres.find(a => a.id === selectedAtmosphere);
    const style = visualStyles.find(s => s.id === selectedStyle);
    if (!atmo || !style || !subject.trim()) return '';

    // Variation: swap in synonyms based on seed
    const atmoKeyword = variationSeed > 0 ? pickRandom(atmo.synonyms) : atmo.keyword;
    const styleLabel = variationSeed > 0 ? pickRandom(style.synonyms) : style.label.toLowerCase();
    const moodStr = atmo.mood;

    const cameraText = selectedCameraMovements.length > 0
      ? `${selectedCameraMovements.join(' to ')} camera movement.`
      : 'Static locked-off camera.';

    const brandLine = brandMessage.trim()
      ? `Brand message woven into the visual narrative: "${brandMessage.trim()}".`
      : '';

    const lines = [
      `${selectedDuration} cinematic ${styleLabel} video.`,
      `${subject.trim()}. ${atmo.sceneDescription}. ${atmoKeyword} atmosphere.`,
      `${cameraText} ${transitionsText[selectedTransitions]}`,
      `Mood: ${moodStr}.`,
      `Color grade: ${style.colorGrade}.`,
      `Lens: anamorphic, shallow depth of field, 35mm look.`,
      style.extraNotes,
      brandLine,
      `No text on screen. Ambient ${atmo.sound} only.`,
      `Aspect ratio: ${selectedRatio}.`,
    ].filter(Boolean);

    return lines.join('\n');
  }, [selectedAtmosphere, selectedStyle, selectedDuration, selectedTransitions, selectedRatio, selectedCameraMovements, subject, brandMessage, variationSeed]);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prompt]);

  const handleVariation = useCallback(() => {
    setVariationSeed(s => s + 1);
  }, []);

  // ─── Styles ──────────────────────────────────────────
  const accent = '#c8f050';
  const textColor = '#f0ece4';
  const bgCard = 'rgba(255,255,255,0.04)';
  const borderDefault = 'rgba(255,255,255,0.08)';

  return (
    <div
      className={`${bebasNeue.variable} ${dmSans.variable} min-h-screen`}
      style={{ background: '#0a0a0a', color: textColor, fontFamily: 'var(--font-dm), sans-serif' }}
      dir="ltr"
    >
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="mb-10 text-center">
          <h1
            className="mb-2 text-5xl tracking-wide sm:text-6xl"
            style={{ fontFamily: 'var(--font-bebas), sans-serif', color: accent }}
          >
            VIDEO PROMPT GENERATOR
          </h1>
          <p className="text-sm opacity-60">Build production-ready Veo 3 prompts in seconds</p>
        </div>

        {/* ─── Section 1: Atmosphere ─── */}
        <Section title="בחר אווירה" subtitle="Atmosphere" accent={accent}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {atmospheres.map(atmo => (
              <button
                key={atmo.id}
                onClick={() => setSelectedAtmosphere(atmo.id === selectedAtmosphere ? null : atmo.id)}
                className="rounded-xl px-3 py-3 text-left transition-all duration-150"
                style={{
                  background: selectedAtmosphere === atmo.id ? `${accent}15` : bgCard,
                  border: `1.5px solid ${selectedAtmosphere === atmo.id ? accent : borderDefault}`,
                  color: selectedAtmosphere === atmo.id ? accent : textColor,
                }}
              >
                <span className="text-xl">{atmo.emoji}</span>
                <span className="mr-2 text-sm font-medium" dir="rtl">{atmo.labelHe}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Section 2: Visual Style ─── */}
        <Section title="סגנון ויזואלי" subtitle="Visual Style" accent={accent}>
          <div className="flex flex-wrap gap-2">
            {visualStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id === selectedStyle ? null : style.id)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150"
                style={{
                  background: selectedStyle === style.id ? `${accent}20` : bgCard,
                  border: `1.5px solid ${selectedStyle === style.id ? accent : borderDefault}`,
                  color: selectedStyle === style.id ? accent : textColor,
                }}
              >
                {style.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Section 3: Details ─── */}
        <Section title="פרטי הסרטון" subtitle="Video Details" accent={accent}>
          <div className="space-y-5">
            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium opacity-70">
                Subject <span style={{ color: accent }}>*</span>
              </label>
              <textarea
                dir="rtl"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="תאר את הנושא המרכזי של הסרטון..."
                rows={3}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:opacity-30"
                style={{
                  background: bgCard,
                  border: `1.5px solid ${borderDefault}`,
                  color: textColor,
                }}
                onFocus={e => (e.target.style.borderColor = accent)}
                onBlur={e => (e.target.style.borderColor = borderDefault)}
              />
            </div>

            {/* Brand Message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium opacity-70">Brand Message</label>
              <input
                type="text"
                value={brandMessage}
                onChange={e => setBrandMessage(e.target.value)}
                placeholder="Optional brand or tagline to weave in..."
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors placeholder:opacity-30"
                style={{
                  background: bgCard,
                  border: `1.5px solid ${borderDefault}`,
                  color: textColor,
                }}
                onFocus={e => (e.target.style.borderColor = accent)}
                onBlur={e => (e.target.style.borderColor = borderDefault)}
              />
            </div>

            {/* Duration */}
            <PillGroup
              label="Duration"
              options={durations.map(d => ({ value: d, label: d }))}
              selected={selectedDuration}
              onSelect={v => setSelectedDuration(v as typeof durations[number])}
              accent={accent}
              textColor={textColor}
              bgCard={bgCard}
              borderDefault={borderDefault}
            />

            {/* Transitions */}
            <PillGroup
              label="Transitions"
              options={transitionOptions.map(t => ({ value: String(t.value), label: t.label }))}
              selected={String(selectedTransitions)}
              onSelect={v => setSelectedTransitions(Number(v))}
              accent={accent}
              textColor={textColor}
              bgCard={bgCard}
              borderDefault={borderDefault}
            />

            {/* Aspect Ratio */}
            <PillGroup
              label="Aspect Ratio"
              options={ratios.map(r => ({ value: r, label: r }))}
              selected={selectedRatio}
              onSelect={v => setSelectedRatio(v as typeof ratios[number])}
              accent={accent}
              textColor={textColor}
              bgCard={bgCard}
              borderDefault={borderDefault}
            />

            {/* Camera Movements */}
            <div>
              <label className="mb-1.5 block text-sm font-medium opacity-70">
                Camera Movement <span className="opacity-40">(max 2)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {cameraMovements.map(m => {
                  const isSelected = selectedCameraMovements.includes(m);
                  const isDisabled = !isSelected && selectedCameraMovements.length >= 2;
                  return (
                    <button
                      key={m}
                      onClick={() => toggleCamera(m)}
                      disabled={isDisabled}
                      className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30"
                      style={{
                        background: isSelected ? `${accent}20` : bgCard,
                        border: `1.5px solid ${isSelected ? accent : borderDefault}`,
                        color: isSelected ? accent : textColor,
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Section 4: Output ─── */}
        <Section title="הפרומפט המוכן" subtitle="Generated Prompt" accent={accent}>
          <div
            className="relative rounded-xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${borderDefault}` }}
          >
            {prompt ? (
              <pre
                className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: textColor, fontFamily: 'var(--font-dm), monospace' }}
              >
                {prompt}
              </pre>
            ) : (
              <p className="py-8 text-center text-sm opacity-30">
                Select an atmosphere, a style, and describe your subject to generate a prompt.
              </p>
            )}

            {prompt && (
              <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: borderDefault }}>
                <span className="text-xs opacity-40">{prompt.length} characters</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleVariation}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      background: bgCard,
                      border: `1.5px solid ${borderDefault}`,
                      color: textColor,
                    }}
                  >
                    <Shuffle size={14} />
                    Variation
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold transition-colors"
                    style={{
                      background: accent,
                      color: '#0a0a0a',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function Section({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline gap-3">
        <h2
          className="text-2xl tracking-wide"
          style={{ fontFamily: 'var(--font-bebas), sans-serif', color: accent }}
          dir="rtl"
        >
          {title}
        </h2>
        <span className="text-xs uppercase tracking-widest opacity-30">{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function PillGroup({
  label,
  options,
  selected,
  onSelect,
  accent,
  textColor,
  bgCard,
  borderDefault,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  accent: string;
  textColor: string;
  bgCard: string;
  borderDefault: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium opacity-70">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150"
            style={{
              background: selected === opt.value ? `${accent}20` : bgCard,
              border: `1.5px solid ${selected === opt.value ? accent : borderDefault}`,
              color: selected === opt.value ? accent : textColor,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
