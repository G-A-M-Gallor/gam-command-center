// ─── Library Registry — External Component Catalog ────────────────────
// Static catalog of components from shadcn/ui, Magic UI, and 21st.dev.
// MCP tools can't be called from the browser — this is a hardcoded reference.

export type LibrarySource = "shadcn" | "magicui" | "21st";

export type LibraryCategory =
  | "layout"
  | "data-display"
  | "input"
  | "feedback"
  | "navigation"
  | "overlay"
  | "animation"
  | "text-animation"
  | "background"
  | "button"
  | "special-effect"
  | "device-mock"
  | "utility";

export interface LibraryComponentEntry {
  id: string;
  name: string;
  slug: string;
  source: LibrarySource;
  category: LibraryCategory;
  description: { he: string; en: string };
  docsUrl: string;
  installCmd: string;
  tags: string[];
}

// ─── Installed components (based on src/components/ui/*.tsx) ───────────
export const INSTALLED_COMPONENTS = new Set([
  "shadcn-button",
  "shadcn-input",
  "shadcn-badge",
  "shadcn-skeleton",
  "shadcn-dialog",
  "shadcn-select",
  "shadcn-tooltip",
]);

// ─── Source colors ────────────────────────────────────────────────────
export const SOURCE_COLORS: Record<LibrarySource, { color: string; bg: string }> = {
  shadcn: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },    // purple
  magicui: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },     // blue
  "21st": { color: "#34d399", bg: "rgba(52,211,153,0.12)" },      // emerald
};

// ─── Category colors ─────────────────────────────────────────────────
export const LIBRARY_CATEGORY_COLORS: Record<LibraryCategory, { color: string; bg: string }> = {
  layout:           { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "data-display":   { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  input:            { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  feedback:         { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  navigation:       { color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  overlay:          { color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  animation:        { color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  "text-animation": { color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  background:       { color: "#a3e635", bg: "rgba(163,230,53,0.12)" },
  button:           { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  "special-effect": { color: "#e879f9", bg: "rgba(232,121,249,0.12)" },
  "device-mock":    { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  utility:          { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

// ─── Category labels ─────────────────────────────────────────────────
export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, { he: string; en: string }> = {
  layout:           { he: "פריסה", en: "Layout" },
  "data-display":   { he: "תצוגת נתונים", en: "Data Display" },
  input:            { he: "קלט", en: "Input" },
  feedback:         { he: "משוב", en: "Feedback" },
  navigation:       { he: "ניווט", en: "Navigation" },
  overlay:          { he: "שכבת-על", en: "Overlay" },
  animation:        { he: "אנימציה", en: "Animation" },
  "text-animation": { he: "אנימציית טקסט", en: "Text Animation" },
  background:       { he: "רקע", en: "Background" },
  button:           { he: "כפתור", en: "Button" },
  "special-effect": { he: "אפקט מיוחד", en: "Special Effect" },
  "device-mock":    { he: "הדמיית מכשיר", en: "Device Mock" },
  utility:          { he: "שירות", en: "Utility" },
};

// ─── Helper ──────────────────────────────────────────────────────────
function shadcn(
  slug: string,
  name: string,
  category: LibraryCategory,
  descHe: string,
  descEn: string,
  tags: string[] = [],
): LibraryComponentEntry {
  return {
    id: `shadcn-${slug}`,
    name,
    slug,
    source: "shadcn",
    category,
    description: { he: descHe, en: descEn },
    docsUrl: `https://ui.shadcn.com/docs/components/${slug}`,
    installCmd: `npx shadcn@latest add ${slug}`,
    tags,
  };
}

function magicui(
  slug: string,
  name: string,
  category: LibraryCategory,
  descHe: string,
  descEn: string,
  tags: string[] = [],
): LibraryComponentEntry {
  return {
    id: `magicui-${slug}`,
    name,
    slug,
    source: "magicui",
    category,
    description: { he: descHe, en: descEn },
    docsUrl: `https://magicui.design/docs/components/${slug}`,
    installCmd: `npx magicui-cli@latest add ${slug}`,
    tags,
  };
}

function twentyFirst(
  slug: string,
  name: string,
  category: LibraryCategory,
  descHe: string,
  descEn: string,
  tags: string[] = [],
): LibraryComponentEntry {
  return {
    id: `21st-${slug}`,
    name,
    slug,
    source: "21st",
    category,
    description: { he: descHe, en: descEn },
    docsUrl: `https://21st.dev/components/${slug}`,
    installCmd: `npx 21st@latest add ${slug}`,
    tags,
  };
}

// ─── shadcn/ui components (~50) ──────────────────────────────────────

const SHADCN_COMPONENTS: LibraryComponentEntry[] = [
  shadcn("accordion", "Accordion", "layout", "רכיב מתקפל להצגת תוכן", "Collapsible content sections", ["collapse", "expand"]),
  shadcn("alert", "Alert", "feedback", "הודעה חשובה למשתמש", "Important message for the user", ["message", "warning"]),
  shadcn("alert-dialog", "Alert Dialog", "overlay", "דיאלוג אישור עם פעולה הרסנית", "Confirmation dialog for destructive actions", ["confirm", "modal"]),
  shadcn("aspect-ratio", "Aspect Ratio", "layout", "שומר יחס גובה-רוחב קבוע", "Maintains a fixed aspect ratio", ["image", "video"]),
  shadcn("avatar", "Avatar", "data-display", "תמונת פרופיל עם fallback", "Profile image with fallback", ["user", "profile"]),
  shadcn("badge", "Badge", "data-display", "תווית סטטוס קטנה", "Small status label", ["tag", "label", "status"]),
  shadcn("breadcrumb", "Breadcrumb", "navigation", "נתיב ניווט היררכי", "Hierarchical navigation path", ["path", "trail"]),
  shadcn("button", "Button", "button", "כפתור אינטראקטיבי עם גרסאות", "Interactive button with variants", ["action", "click"]),
  shadcn("calendar", "Calendar", "input", "בוחר תאריך חודשי", "Monthly date picker", ["date", "picker"]),
  shadcn("card", "Card", "layout", "מיכל תוכן עם כותרת ותיאור", "Content container with header and description", ["container", "panel"]),
  shadcn("carousel", "Carousel", "data-display", "מציג שקופיות עם ניווט", "Slide viewer with navigation", ["slider", "gallery"]),
  shadcn("checkbox", "Checkbox", "input", "תיבת סימון", "Toggle checkbox", ["check", "toggle"]),
  shadcn("collapsible", "Collapsible", "layout", "אזור מתקפל פשוט", "Simple collapsible area", ["expand", "collapse"]),
  shadcn("command", "Command", "input", "פלטת פקודות — Cmd+K", "Command palette — Cmd+K", ["search", "palette", "cmdk"]),
  shadcn("context-menu", "Context Menu", "overlay", "תפריט קליק ימני", "Right-click context menu", ["menu", "right-click"]),
  shadcn("data-table", "Data Table", "data-display", "טבלת נתונים מתקדמת עם מיון וסינון", "Advanced data table with sorting and filtering", ["table", "grid", "sort"]),
  shadcn("date-picker", "Date Picker", "input", "בוחר תאריך עם לוח שנה", "Date picker with calendar", ["date", "calendar"]),
  shadcn("dialog", "Dialog", "overlay", "חלון מודאלי", "Modal dialog window", ["modal", "popup"]),
  shadcn("drawer", "Drawer", "overlay", "פאנל נשלף מהצד", "Sliding side panel", ["panel", "slide"]),
  shadcn("dropdown-menu", "Dropdown Menu", "overlay", "תפריט נפתח", "Dropdown menu with items", ["menu", "dropdown"]),
  shadcn("form", "Form", "input", "טופס עם ולידציה — react-hook-form + zod", "Form with validation — react-hook-form + zod", ["validation", "zod"]),
  shadcn("hover-card", "Hover Card", "overlay", "כרטיס מידע בריחוף", "Info card on hover", ["preview", "popup"]),
  shadcn("input", "Input", "input", "שדה קלט טקסט", "Text input field", ["text", "field"]),
  shadcn("input-otp", "Input OTP", "input", "קלט קוד חד-פעמי", "One-time password input", ["otp", "code", "verification"]),
  shadcn("label", "Label", "input", "תווית לשדה טופס", "Form field label", ["text", "form"]),
  shadcn("menubar", "Menubar", "navigation", "סרגל תפריטים", "Menu bar navigation", ["menu", "toolbar"]),
  shadcn("navigation-menu", "Navigation Menu", "navigation", "תפריט ניווט מתקדם", "Advanced navigation menu", ["nav", "links"]),
  shadcn("pagination", "Pagination", "navigation", "ניווט בין דפים", "Page navigation", ["pages", "next", "prev"]),
  shadcn("popover", "Popover", "overlay", "חלון צף ליד אלמנט", "Floating content near trigger", ["popup", "tooltip"]),
  shadcn("progress", "Progress", "feedback", "סרגל התקדמות", "Progress bar", ["loading", "bar"]),
  shadcn("radio-group", "Radio Group", "input", "קבוצת כפתורי רדיו", "Radio button group", ["select", "option"]),
  shadcn("resizable", "Resizable", "layout", "פאנלים עם שינוי גודל", "Resizable panels", ["resize", "split"]),
  shadcn("scroll-area", "Scroll Area", "layout", "אזור גלילה מותאם", "Custom scroll area", ["scroll", "overflow"]),
  shadcn("select", "Select", "input", "תפריט בחירה", "Select dropdown", ["dropdown", "pick"]),
  shadcn("separator", "Separator", "layout", "קו הפרדה", "Visual separator line", ["divider", "line"]),
  shadcn("sheet", "Sheet", "overlay", "פאנל צדי על שכבת-על", "Side panel overlay", ["drawer", "panel"]),
  shadcn("skeleton", "Skeleton", "feedback", "מצייני טעינה בצורת תוכן", "Content loading placeholders", ["loading", "placeholder"]),
  shadcn("slider", "Slider", "input", "מחוון טווח ערכים", "Range value slider", ["range", "value"]),
  shadcn("sonner", "Sonner", "feedback", "התראות toast מעוצבות", "Styled toast notifications", ["toast", "notification"]),
  shadcn("switch", "Switch", "input", "מתג הפעלה/כיבוי", "Toggle switch", ["toggle", "boolean"]),
  shadcn("table", "Table", "data-display", "טבלת נתונים", "Data table", ["grid", "rows"]),
  shadcn("tabs", "Tabs", "navigation", "לשוניות ניווט", "Tabbed navigation", ["tab", "switch"]),
  shadcn("textarea", "Textarea", "input", "שדה טקסט רב-שורתי", "Multi-line text area", ["text", "multiline"]),
  shadcn("toast", "Toast", "feedback", "התראה זמנית", "Temporary notification", ["notification", "alert"]),
  shadcn("toggle", "Toggle", "input", "כפתור מצב — פעיל/לא פעיל", "State toggle button", ["switch", "on-off"]),
  shadcn("toggle-group", "Toggle Group", "input", "קבוצת כפתורי מצב", "Group of toggle buttons", ["group", "multi"]),
  shadcn("tooltip", "Tooltip", "overlay", "טיפ כלי בריחוף", "Hover tooltip", ["hint", "info"]),
];

// ─── Magic UI components (~67) ───────────────────────────────────────

const MAGICUI_COMPONENTS: LibraryComponentEntry[] = [
  // Animation
  magicui("marquee", "Marquee", "animation", "גלילה אינסופית של תוכן", "Infinite scrolling content", ["scroll", "loop"]),
  magicui("animated-beam", "Animated Beam", "animation", "קו מונפש בין אלמנטים", "Animated connecting beam", ["line", "connection"]),
  magicui("border-beam", "Border Beam", "animation", "גבול מונפש זוהר", "Animated glowing border", ["border", "glow"]),
  magicui("blur-fade", "Blur Fade", "animation", "הופעה עם טשטוש והעלמות", "Blur and fade entrance", ["fade", "blur"]),
  magicui("cool-mode", "Cool Mode", "animation", "אפקט חלקיקים בלחיצה", "Particle effect on click", ["particles", "click"]),
  magicui("animated-list", "Animated List", "animation", "רשימה עם אנימציית כניסה", "List with entry animation", ["list", "stagger"]),
  magicui("orbiting-circles", "Orbiting Circles", "animation", "עיגולים מקיפים", "Orbiting circular elements", ["orbit", "circle"]),
  magicui("animated-circular-progress", "Circular Progress", "animation", "מד התקדמות עגול מונפש", "Animated circular progress", ["progress", "circle"]),
  magicui("number-ticker", "Number Ticker", "animation", "מונה מספרים מונפש", "Animated number counter", ["counter", "increment"]),
  magicui("scroll-based-velocity", "Scroll Velocity", "animation", "טקסט מואץ לפי גלילה", "Scroll-accelerated text", ["scroll", "speed"]),
  magicui("box-reveal", "Box Reveal", "animation", "חשיפת תוכן בתיבה", "Box content reveal animation", ["reveal", "box"]),
  magicui("scratch-to-reveal", "Scratch to Reveal", "animation", "גלוס כרטיס — גרד לחשוף", "Scratch card reveal effect", ["scratch", "reveal"]),

  // Text Animation
  magicui("typing-animation", "Typing Animation", "text-animation", "אפקט הקלדה", "Typewriter text effect", ["typewriter", "type"]),
  magicui("word-rotate", "Word Rotate", "text-animation", "סיבוב מילים", "Rotating words animation", ["rotate", "words"]),
  magicui("flip-text", "Flip Text", "text-animation", "טקסט מתהפך", "Flipping text animation", ["flip", "3d"]),
  magicui("gradual-spacing", "Gradual Spacing", "text-animation", "ריווח הדרגתי", "Gradual letter spacing", ["spacing", "letters"]),
  magicui("word-pull-up", "Word Pull Up", "text-animation", "מילים עולות", "Words pulling up animation", ["pullup", "entrance"]),
  magicui("word-fade-in", "Word Fade In", "text-animation", "הופעת מילים", "Words fading in", ["fade", "entrance"]),
  magicui("letter-pullup", "Letter Pullup", "text-animation", "אותיות עולות", "Letters pulling up", ["letters", "entrance"]),
  magicui("blur-in", "Blur In", "text-animation", "הופעה מטשטוש", "Text appearing from blur", ["blur", "entrance"]),
  magicui("fade-text", "Fade Text", "text-animation", "טקסט נמוג ומופיע", "Fading text animation", ["fade", "transition"]),
  magicui("hyper-text", "Hyper Text", "text-animation", "טקסט עם אפקט סקרמבל", "Text scramble effect", ["scramble", "random"]),
  magicui("wavy-text", "Wavy Text", "text-animation", "טקסט גלי", "Wavy text animation", ["wave", "motion"]),
  magicui("sparkles-text", "Sparkles Text", "text-animation", "טקסט עם ניצוצות", "Text with sparkle effect", ["sparkle", "glitter"]),
  magicui("line-shadow-text", "Line Shadow Text", "text-animation", "טקסט עם צל קו", "Text with line shadow", ["shadow", "line"]),
  magicui("morphing-text", "Morphing Text", "text-animation", "טקסט משתנה צורה", "Morphing text animation", ["morph", "transform"]),
  magicui("aurora-text", "Aurora Text", "text-animation", "טקסט אורורה זוהר", "Aurora glowing text", ["aurora", "glow"]),
  magicui("text-animate", "Text Animate", "text-animation", "אנימציית טקסט גנרית", "Generic text animation", ["animate", "entrance"]),
  magicui("animated-shiny-text", "Shiny Text", "text-animation", "טקסט מבריק מונפש", "Animated shiny text", ["shine", "gradient"]),

  // Background
  magicui("animated-grid-pattern", "Grid Pattern", "background", "רקע משבצות מונפש", "Animated grid pattern", ["grid", "pattern"]),
  magicui("dot-pattern", "Dot Pattern", "background", "רקע נקודות", "Dot pattern background", ["dots", "pattern"]),
  magicui("grid-pattern", "Static Grid", "background", "רקע משבצות סטטי", "Static grid pattern", ["grid", "bg"]),
  magicui("ripple", "Ripple", "background", "אפקט גלים", "Ripple wave effect", ["wave", "circle"]),
  magicui("retro-grid", "Retro Grid", "background", "רקע רטרו תלת-ממד", "3D retro grid background", ["retro", "3d"]),
  magicui("flickering-grid", "Flickering Grid", "background", "משבצות מהבהבות", "Flickering grid pattern", ["flicker", "grid"]),
  magicui("particles", "Particles", "background", "חלקיקים צפים", "Floating particles background", ["particles", "float"]),

  // Layout / Data Display
  magicui("bento-grid", "Bento Grid", "layout", "פריסת בנטו — כמו Apple", "Bento-style grid layout", ["grid", "bento", "apple"]),
  magicui("dock", "Dock", "navigation", "סרגל כלים macOS", "macOS-style dock", ["toolbar", "mac"]),
  magicui("magic-card", "Magic Card", "data-display", "כרטיס עם אפקט אור עוקב", "Card with spotlight follow effect", ["card", "spotlight"]),
  magicui("neon-gradient-card", "Neon Gradient Card", "data-display", "כרטיס עם גרדיאנט ניאון", "Card with neon gradient", ["card", "neon", "gradient"]),
  magicui("file-tree", "File Tree", "data-display", "עץ קבצים אינטראקטיבי", "Interactive file tree", ["tree", "files"]),
  magicui("terminal", "Terminal", "data-display", "הדמיית טרמינל", "Terminal mockup", ["cli", "console"]),
  magicui("tweet-card", "Tweet Card", "data-display", "כרטיס ציוץ מוטמע", "Embedded tweet card", ["twitter", "social"]),
  magicui("hero-video-dialog", "Hero Video Dialog", "overlay", "דיאלוג וידאו ראשי", "Hero video dialog", ["video", "modal"]),
  magicui("globe", "Globe", "data-display", "גלובוס אינטראקטיבי תלת-ממדי", "Interactive 3D globe", ["3d", "map", "world"]),

  // Buttons
  magicui("shimmer-button", "Shimmer Button", "button", "כפתור עם אפקט נצנוץ", "Button with shimmer effect", ["shimmer", "click"]),
  magicui("shiny-button", "Shiny Button", "button", "כפתור מבריק", "Shiny animated button", ["shine", "glow"]),
  magicui("pulsating-button", "Pulsating Button", "button", "כפתור פועם", "Pulsating animated button", ["pulse", "glow"]),
  magicui("animated-subscribe-button", "Subscribe Button", "button", "כפתור הרשמה מונפש", "Animated subscribe button", ["subscribe", "email"]),
  magicui("rainbow-button", "Rainbow Button", "button", "כפתור קשת צבעים", "Rainbow gradient button", ["rainbow", "gradient"]),
  magicui("interactive-hover-button", "Hover Button", "button", "כפתור אינטראקטיבי בריחוף", "Interactive hover button", ["hover", "effect"]),

  // Special Effects
  magicui("meteors", "Meteors", "special-effect", "אפקט מטאורים נופלים", "Falling meteors effect", ["falling", "stars"]),
  magicui("confetti", "Confetti", "special-effect", "אפקט קונפטי", "Confetti celebration effect", ["celebrate", "party"]),

  // Device Mocks
  magicui("safari", "Safari", "device-mock", "הדמיית דפדפן Safari", "Safari browser mockup", ["browser", "mac"]),
  magicui("iphone-15-pro", "iPhone 15 Pro", "device-mock", "הדמיית iPhone 15 Pro", "iPhone 15 Pro mockup", ["phone", "mobile"]),
];

// ─── 21st.dev featured components (~10) ──────────────────────────────

const TWENTYFIRST_COMPONENTS: LibraryComponentEntry[] = [
  twentyFirst("hero-section", "Hero Section", "layout", "סקשן ראשי — כותרת, תיאור ו-CTA", "Hero section — heading, description and CTA", ["hero", "landing"]),
  twentyFirst("pricing-table", "Pricing Table", "data-display", "טבלת תמחור עם מסלולים", "Pricing table with tiers", ["pricing", "plans"]),
  twentyFirst("testimonial-card", "Testimonial Card", "data-display", "כרטיס המלצה / ציטוט", "Testimonial / quote card", ["quote", "review"]),
  twentyFirst("feature-grid", "Feature Grid", "layout", "רשת פיצ'רים עם אייקונים", "Feature grid with icons", ["features", "grid"]),
  twentyFirst("cta-section", "CTA Section", "layout", "סקשן קריאה לפעולה", "Call-to-action section", ["cta", "action"]),
  twentyFirst("footer", "Footer", "navigation", "פוטר עם לינקים ורשתות חברתיות", "Footer with links and social", ["footer", "links"]),
  twentyFirst("navbar", "Navbar", "navigation", "סרגל ניווט ראשי", "Main navigation bar", ["nav", "header"]),
  twentyFirst("faq-accordion", "FAQ Accordion", "layout", "שאלות נפוצות מתקפל", "FAQ accordion section", ["faq", "questions"]),
  twentyFirst("stats-section", "Stats Section", "data-display", "סקשן מספרים / סטטיסטיקות", "Numbers / statistics section", ["stats", "numbers"]),
  twentyFirst("logo-cloud", "Logo Cloud", "data-display", "שורת לוגואים של שותפים", "Partner logos row", ["logos", "partners"]),
];

// ─── Combined registry ───────────────────────────────────────────────

export const libraryRegistry: LibraryComponentEntry[] = [
  ...SHADCN_COMPONENTS,
  ...MAGICUI_COMPONENTS,
  ...TWENTYFIRST_COMPONENTS,
];

// ─── Lookup helpers ──────────────────────────────────────────────────

export function getLibraryBySource(source: LibrarySource): LibraryComponentEntry[] {
  return libraryRegistry.filter((c) => c.source === source);
}

export function getLibraryByCategory(category: LibraryCategory): LibraryComponentEntry[] {
  return libraryRegistry.filter((c) => c.category === category);
}

export function getLibrarySourceCounts(): Record<LibrarySource, number> {
  const counts = { shadcn: 0, magicui: 0, "21st": 0 };
  for (const c of libraryRegistry) {
    counts[c.source]++;
  }
  return counts;
}
