"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  FileEdit,
  Map,
  Grid3X3,
  Bot,
  Palette,
  FormInput,
  Network,
  Calendar,
  X,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";

const FULL_WIDTH = 240;
const STRIP_WIDTH = 48;

const tabRoutes = [
  { href: "/dashboard/layers", key: "layers" as const, icon: Layers },
  { href: "/dashboard/editor", key: "editor" as const, icon: FileEdit },
  { href: "/dashboard/story-map", key: "storyMap" as const, icon: Map },
  {
    href: "/dashboard/functional-map",
    key: "functionalMap" as const,
    icon: Grid3X3,
  },
  { href: "/dashboard/ai-hub", key: "aiHub" as const, icon: Bot },
  {
    href: "/dashboard/design-system",
    key: "designSystem" as const,
    icon: Palette,
  },
  { href: "/dashboard/formily", key: "formily" as const, icon: FormInput },
  {
    href: "/dashboard/architecture",
    key: "architecture" as const,
    icon: Network,
  },
  { href: "/dashboard/plan", key: "plan" as const, icon: Calendar },
] as const;

interface SidebarProps {
  /** When true, sidebar floats over content and can be closed */
  isFloating?: boolean;
  /** When floating, whether the sidebar is currently open */
  isOpen?: boolean;
  /** When floating and open, called to close (e.g. backdrop click) */
  onClose?: () => void;
}

export function Sidebar({
  isFloating = false,
  isOpen = true,
  onClose,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const { language, sidebarPosition, sidebarVisibility, brandProfile } = useSettings();
  const t = getTranslations(language);
  const [hovered, setHovered] = useState(false);

  const isFloat = sidebarVisibility === "float";
  const isCollapsed = isFloat && !hovered;
  const onRight = sidebarPosition === "right";

  // Hidden mode: translate off-screen when closed
  const isHidden = sidebarVisibility === "hidden";
  const isTranslatedOff = isHidden && isFloating && !isOpen;
  const translateClass =
    isTranslatedOff && onRight
      ? "translate-x-full"
      : isTranslatedOff && !onRight
        ? "-translate-x-full"
        : "translate-x-0";

  return (
    <aside
      data-cc-id="sidebar.root"
      className={`fixed top-0 z-50 h-screen shrink-0 overflow-hidden ${
        onRight ? "right-0 border-l" : "left-0 border-r"
      } border-slate-700/50 ${
        isFloat ? "shadow-lg" : ""
      } ${
        isHidden ? `transition-transform duration-200 ease-out ${translateClass}` : ""
      }`}
      style={{
        width: isCollapsed ? STRIP_WIDTH : FULL_WIDTH,
        transition: isFloat
          ? "width 300ms ease"
          : isHidden
            ? undefined
            : undefined,
        backgroundColor: isCollapsed
          ? "rgba(15, 23, 42, 0.8)"
          : "rgb(15, 23, 42)",
      }}
      onMouseEnter={isFloat ? () => setHovered(true) : undefined}
      onMouseLeave={isFloat ? () => setHovered(false) : undefined}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <header data-cc-id="sidebar.header" className="flex h-16 shrink-0 items-center border-b border-slate-700/50"
          style={{ padding: isCollapsed ? "0" : "0 16px", justifyContent: isCollapsed ? "center" : "flex-start", gap: isCollapsed ? 0 : 8 }}
        >
          {(() => {
            const logoEl = brandProfile.logoDataUrl ? (
              <div data-cc-id="sidebar.header.logo" className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--cc-accent-600-20)]">
                <img src={brandProfile.logoDataUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div data-cc-id="sidebar.header.logo" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cc-accent-600-20)]">
                <Layers className="h-5 w-5 text-[var(--cc-accent-400)]" />
              </div>
            );
            const nameText = brandProfile.companyName || t.appName;

            if (isCollapsed) return logoEl;

            if (onRight) return (
              <>
                {isFloating && !isFloat && onClose && (
                  <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <span data-cc-id="sidebar.header.name" data-cc-text="true" className="flex-1 text-right font-semibold text-slate-100">{nameText}</span>
                {logoEl}
              </>
            );

            return (
              <>
                {logoEl}
                <span data-cc-id="sidebar.header.name" data-cc-text="true" className="flex-1 text-left font-semibold text-slate-100">{nameText}</span>
                {isFloating && !isFloat && onClose && (
                  <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            );
          })()}
        </header>

        {/* Nav */}
        <nav data-cc-id="sidebar.nav" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
          {tabRoutes.map(({ href, key, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const label = t.tabs[key];

            if (isCollapsed) {
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                    isActive
                      ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                  title={label}
                >
                  {isActive && (
                    <span
                      className={`absolute inset-y-0 w-0.5 bg-[var(--cc-accent-500)] ${
                        onRight ? "right-0 rounded-r" : "left-0 rounded-l"
                      }`}
                      aria-hidden
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            }

            const linkClass = `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`;

            if (onRight) {
              return (
                <Link key={href} href={href} data-cc-id="sidebar.nav.link" className={linkClass}>
                  {isActive && (
                    <span className="absolute inset-y-0 right-0 w-0.5 rounded-r bg-[var(--cc-accent-500)]" aria-hidden />
                  )}
                  <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="flex-1 text-right">{label}</span>
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            }

            return (
              <Link key={href} href={href} data-cc-id="sidebar.nav.link" className={linkClass}>
                {isActive && (
                  <span className="absolute inset-y-0 left-0 w-0.5 rounded-l bg-[var(--cc-accent-500)]" aria-hidden />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="flex-1 text-left">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer — version label */}
        {!isCollapsed && (
          <footer data-cc-id="sidebar.footer" className="shrink-0 border-t border-slate-700/50 px-3 py-2">
            <span data-cc-id="sidebar.footer.tagline" data-cc-text="true" className="text-[10px] text-slate-600">{brandProfile.tagline || "GAM v1.0"}</span>
          </footer>
        )}
      </div>
    </aside>
  );
}
