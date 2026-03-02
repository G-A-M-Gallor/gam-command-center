import type { ElementStyle } from "@/contexts/StyleOverrideContext";

export interface StylableElement {
  ccId: string;
  labelKey: string;
  descriptionKey: string;
  supports: Partial<Record<keyof ElementStyle, boolean>>;
}

export const STYLABLE_ELEMENTS: StylableElement[] = [
  // Shell
  {
    ccId: "shell.root",
    labelKey: "shellRoot",
    descriptionKey: "shellRoot",
    supports: { backgroundColor: true, borderColor: true },
  },
  // Sidebar
  {
    ccId: "sidebar.root",
    labelKey: "sidebarRoot",
    descriptionKey: "sidebarRoot",
    supports: { backgroundColor: true, color: true, borderColor: true },
  },
  {
    ccId: "sidebar.header",
    labelKey: "sidebarHeader",
    descriptionKey: "sidebarHeader",
    supports: { backgroundColor: true, color: true, borderColor: true },
  },
  {
    ccId: "sidebar.header.logo",
    labelKey: "sidebarLogo",
    descriptionKey: "sidebarLogo",
    supports: { backgroundColor: true, borderColor: true },
  },
  {
    ccId: "sidebar.header.name",
    labelKey: "sidebarName",
    descriptionKey: "sidebarName",
    supports: { color: true, textHighlight: true, fontFamily: true, fontSize: true, letterSpacing: true, lineHeight: true, textContent: true },
  },
  {
    ccId: "sidebar.nav",
    labelKey: "sidebarNav",
    descriptionKey: "sidebarNav",
    supports: { backgroundColor: true },
  },
  {
    ccId: "sidebar.nav.link",
    labelKey: "sidebarNavLink",
    descriptionKey: "sidebarNavLink",
    supports: { backgroundColor: true, color: true, borderColor: true, fontFamily: true, fontSize: true },
  },
  {
    ccId: "sidebar.nav.link.label",
    labelKey: "sidebarNavLabel",
    descriptionKey: "sidebarNavLabel",
    supports: { color: true, textHighlight: true, fontFamily: true, fontSize: true, letterSpacing: true, textContent: true },
  },
  {
    ccId: "sidebar.footer",
    labelKey: "sidebarFooter",
    descriptionKey: "sidebarFooter",
    supports: { backgroundColor: true, color: true, borderColor: true },
  },
  {
    ccId: "sidebar.footer.tagline",
    labelKey: "sidebarTagline",
    descriptionKey: "sidebarTagline",
    supports: { color: true, textHighlight: true, fontFamily: true, fontSize: true, textContent: true },
  },
  // TopBar
  {
    ccId: "topbar.root",
    labelKey: "topbarRoot",
    descriptionKey: "topbarRoot",
    supports: { backgroundColor: true, borderColor: true },
  },
  // Content
  {
    ccId: "content.main",
    labelKey: "contentMain",
    descriptionKey: "contentMain",
    supports: { backgroundColor: true },
  },
  // Page Header
  {
    ccId: "page.header",
    labelKey: "pageHeader",
    descriptionKey: "pageHeader",
    supports: { backgroundColor: true, borderColor: true },
  },
  {
    ccId: "page.header.title",
    labelKey: "pageHeaderTitle",
    descriptionKey: "pageHeaderTitle",
    supports: { color: true, textHighlight: true, fontFamily: true, fontSize: true, letterSpacing: true, lineHeight: true, textContent: true },
  },
  {
    ccId: "page.header.description",
    labelKey: "pageHeaderDescription",
    descriptionKey: "pageHeaderDescription",
    supports: { color: true, textHighlight: true, fontFamily: true, fontSize: true, lineHeight: true, textContent: true },
  },
  // Project Card
  {
    ccId: "card.project",
    labelKey: "cardProject",
    descriptionKey: "cardProject",
    supports: { backgroundColor: true, color: true, borderColor: true },
  },
  {
    ccId: "card.project.name",
    labelKey: "cardProjectName",
    descriptionKey: "cardProjectName",
    supports: { color: true, textHighlight: true, fontFamily: true, fontSize: true, textContent: true },
  },
  {
    ccId: "card.project.meta",
    labelKey: "cardProjectMeta",
    descriptionKey: "cardProjectMeta",
    supports: { color: true, fontSize: true },
  },
  // Health Badge
  {
    ccId: "badge.health",
    labelKey: "badgeHealth",
    descriptionKey: "badgeHealth",
    supports: { backgroundColor: true, color: true, fontSize: true },
  },
];

const elementMap = new Map(STYLABLE_ELEMENTS.map((el) => [el.ccId, el]));

export function getStylableElement(ccId: string): StylableElement | undefined {
  return elementMap.get(ccId);
}
