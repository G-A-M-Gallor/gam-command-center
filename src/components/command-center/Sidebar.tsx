"use client";

import { useState, useRef, useEffect } from "react";
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
  Compass,
  Zap,
  Settings,
  Shield,
  X,
  LogOut,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/hooks/useBreakpoint";

const FULL_WIDTH = 240;
const MOBILE_WIDTH = 280;
const STRIP_WIDTH = 48;

// ─── Grouped Navigation ─────────────────────────────────

interface NavItem {
  href: string;
  key: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  labelKey: "groupCore" | "groupTools" | "groupSystem";
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    labelKey: "groupCore",
    items: [
      { href: "/dashboard/layers", key: "layers", icon: Layers },
      { href: "/dashboard/editor", key: "editor", icon: FileEdit },
      { href: "/dashboard/story-map", key: "storyMap", icon: Map },
      { href: "/dashboard/ai-hub", key: "aiHub", icon: Bot },
    ],
  },
  {
    id: "tools",
    labelKey: "groupTools",
    items: [
      { href: "/dashboard/functional-map", key: "functionalMap", icon: Grid3X3 },
      { href: "/dashboard/design-system", key: "designSystem", icon: Palette },
      { href: "/dashboard/architecture", key: "architecture", icon: Network },
      { href: "/dashboard/plan", key: "plan", icon: Calendar },
      { href: "/roadmap", key: "roadmap", icon: Compass },
    ],
  },
  {
    id: "system",
    labelKey: "groupSystem",
    items: [
      { href: "/dashboard/automations", key: "automations", icon: Zap },
      { href: "/dashboard/formily", key: "formily", icon: FormInput },
      { href: "/dashboard/admin", key: "admin", icon: Shield },
      { href: "/dashboard/settings", key: "settings", icon: Settings },
    ],
  },
];

// ─── Component ───────────────────────────────────────────

interface SidebarProps {
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  isFloating = false,
  isOpen = true,
  onClose,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const { language, sidebarPosition, sidebarVisibility, brandProfile } = useSettings();
  const { user, signOut } = useAuth();
  const t = getTranslations(language);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [hovered, setHovered] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ top: number; height: number } | null>(null);

  const isFloat = sidebarVisibility === "float";
  const isCollapsed = isFloat && !hovered;
  const onRight = sidebarPosition === "right";
  const expandedWidth = isMobile ? MOBILE_WIDTH : FULL_WIDTH;

  const isHidden = sidebarVisibility === "hidden";
  const shouldCloseOnNav = isHidden && isFloating && onClose;
  const isTranslatedOff = isHidden && isFloating && !isOpen;
  const translateClass =
    isTranslatedOff && onRight
      ? "translate-x-full"
      : isTranslatedOff && !onRight
        ? "-translate-x-full"
        : "translate-x-0";

  // ── Sliding active indicator measurement ─────────────
  useEffect(() => {
    if (isCollapsed || !navRef.current) {
      setIndicatorStyle(null);
      return;
    }
    requestAnimationFrame(() => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeEl) {
        const navRect = navRef.current.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          top: elRect.top - navRect.top + navRef.current.scrollTop,
          height: elRect.height,
        });
      } else {
        setIndicatorStyle(null);
      }
    });
  }, [pathname, isCollapsed]);

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
        width: isCollapsed ? STRIP_WIDTH : expandedWidth,
        maxWidth: isMobile ? "calc(100vw - 56px)" : undefined,
        transition: isFloat ? "width 300ms ease" : undefined,
        backgroundColor: isCollapsed
          ? "rgba(15, 23, 42, 0.8)"
          : "rgb(15, 23, 42)",
      }}
      onMouseEnter={isFloat ? () => setHovered(true) : undefined}
      onMouseLeave={isFloat ? () => setHovered(false) : undefined}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <header
          data-cc-id="sidebar.header"
          className="relative flex h-16 shrink-0 items-center border-b border-slate-700/50 overflow-hidden"
          style={{
            padding: isCollapsed ? "0" : "0 16px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: isCollapsed ? 0 : 8,
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[var(--cc-accent-500)]/[0.03] to-transparent pointer-events-none"
            aria-hidden
          />

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

            if (isCollapsed) return <Link href="/" title="Workspace Hub" aria-label="Workspace Hub">{logoEl}</Link>;

            if (onRight) return (
              <>
                {isFloating && !isFloat && onClose && (
                  <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Link href="/" className="flex flex-1 items-center justify-end gap-2 transition-opacity hover:opacity-80" title="Workspace Hub">
                  <span data-cc-id="sidebar.header.name" data-cc-text="true" className="text-right text-[15px] font-semibold text-slate-100">{nameText}</span>
                  {logoEl}
                </Link>
              </>
            );

            return (
              <>
                <Link href="/" className="flex flex-1 items-center gap-2 transition-opacity hover:opacity-80" title="Workspace Hub">
                  {logoEl}
                  <span data-cc-id="sidebar.header.name" data-cc-text="true" className="text-left text-[15px] font-semibold text-slate-100">{nameText}</span>
                </Link>
                {isFloating && !isFloat && onClose && (
                  <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" aria-label="Close sidebar">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            );
          })()}
        </header>

        {/* Nav with grouped items */}
        <nav
          ref={navRef}
          data-cc-id="sidebar.nav"
          className="relative min-h-0 flex-1 overflow-y-auto p-2"
        >
          {/* Sliding active indicator */}
          {!isCollapsed && indicatorStyle && (
            <div
              className="absolute inset-x-2 rounded-lg bg-[var(--cc-accent-600-20)] border border-[var(--cc-accent-500)]/20 pointer-events-none transition-all duration-300 ease-out"
              style={{
                top: indicatorStyle.top,
                height: indicatorStyle.height,
              }}
            />
          )}

          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id}>
              {/* Group label / divider */}
              {gi > 0 && isCollapsed && (
                <div className="mx-2 my-2 border-t border-slate-700/30" />
              )}
              {!isCollapsed && (
                <div className={gi === 0 ? "pt-1 pb-1 px-3" : "pt-4 pb-1 px-3"}>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
                    {(t.sidebar as Record<string, string>)[group.labelKey]}
                  </span>
                </div>
              )}

              {/* Items */}
              <div className="space-y-0.5">
                {group.items.map(({ href, key, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(href + "/");
                  const label = (t.tabs as Record<string, string>)[key];

                  // ── Collapsed item ──
                  if (isCollapsed) {
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={shouldCloseOnNav ? onClose : undefined}
                        data-active={isActive || undefined}
                        aria-label={label}
                        className={`group relative flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                          isActive
                            ? "text-[var(--cc-accent-300)]"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                        }`}
                      >
                        {isActive && (
                          <span
                            className={`absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[var(--cc-accent-500)] ${
                              onRight ? "right-0" : "left-0"
                            }`}
                            aria-hidden
                          />
                        )}
                        <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                          !isActive ? "group-hover:scale-110" : ""
                        }`} />
                        {/* Tooltip */}
                        <span
                          className={`absolute ${
                            onRight ? "right-full mr-2" : "left-full ml-2"
                          } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  }

                  // ── Expanded item ──
                  const content = onRight ? (
                    <>
                      <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="flex-1 text-right truncate">{label}</span>
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                        !isActive ? "group-hover:scale-105" : ""
                      }`} />
                    </>
                  ) : (
                    <>
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                        !isActive ? "group-hover:scale-105" : ""
                      }`} />
                      <span data-cc-id="sidebar.nav.link.label" data-cc-text="true" className="flex-1 text-left truncate">{label}</span>
                    </>
                  );

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={shouldCloseOnNav ? onClose : undefined}
                      data-cc-id="sidebar.nav.link"
                      data-active={isActive || undefined}
                      className={`group relative z-10 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                        isActive
                          ? "text-[var(--cc-accent-300)] font-medium"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                      }`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        {user && (
          <div className="shrink-0 border-t border-slate-700/50 p-2">
            {isCollapsed ? (
              <button
                type="button"
                onClick={signOut}
                className="group relative flex w-full items-center justify-center rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                title={t.auth.signOut}
              >
                <LogOut className="h-4 w-4" />
                <span
                  className={`absolute ${
                    onRight ? "right-full mr-2" : "left-full ml-2"
                  } rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
                >
                  {t.auth.signOut}
                </span>
              </button>
            ) : (
              <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${onRight ? "flex-row-reverse" : ""}`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-400)] text-xs font-medium">
                  {(user.email?.[0] || "?").toUpperCase()}
                </div>
                <span className={`flex-1 truncate text-[11px] text-slate-500 ${onRight ? "text-right" : "text-left"}`}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded p-1 text-slate-600 transition-colors hover:text-red-400 hover:bg-red-500/10"
                  title={t.auth.signOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <footer data-cc-id="sidebar.footer" className="shrink-0 border-t border-slate-700/50 px-3 py-2">
            <span data-cc-id="sidebar.footer.tagline" data-cc-text="true" className="text-[10px] text-slate-600">{brandProfile.tagline || "GAM v1.0"}</span>
          </footer>
        )}
      </div>
    </aside>
  );
}
