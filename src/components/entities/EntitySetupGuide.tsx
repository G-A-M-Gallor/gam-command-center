'use client';

import { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, Hash, Database, Link2,
  CheckCircle2, Circle, ArrowRight, _ExternalLink,
} from 'lucide-react';

type GuideStep = {
  id: string;
  title: { he: string; en: string; ru: string };
  description: { he: string; en: string; ru: string };
  details: { he: string[]; en: string[]; ru: string[] };
  link?: string;
  icon: React.ElementType;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'fields',
    title: {
      he: '1. צור שדות בספריית השדות',
      en: '1. Create Fields in the Field Library',
      ru: '1. Создайте поля в библиотеке полей',
    },
    description: {
      he: 'שדות הם אבני הבניין — כל שדה נוצר פעם אחת ומשמש בכל סוגי הישויות.',
      en: 'Fields are the building blocks — each field is created once and reused across entity types.',
      ru: 'Поля — это строительные блоки: каждое поле создаётся один раз и используется в разных типах сущностей.',
    },
    details: {
      he: [
        'לחץ "שדה חדש" → מלא שם (עברית + אנגלית)',
        'בחר סוג שדה: טקסט, מספר, בחירה, תאריך, טלפון, אימייל, URL...',
        'הוסף אפשרויות (לשדות בחירה) — עם צבעים',
        'הגדר ולידציה: חובה, ייחודי, תבנית regex',
        'בחר קטגוריה: כללי, יצירת קשר, עסקי, פרויקט, משאבי אנוש, פיננסי, בנייה',
        'הוסף תיאור בעברית ואנגלית (יופיע ב-info של השדה)',
        'שמור — מפתח מטא (meta_key) ייווצר אוטומטית',
      ],
      en: [
        'Click "New Field" → fill name (Hebrew + English)',
        'Choose field type: text, number, select, date, phone, email, URL...',
        'Add options (for select fields) — with colors',
        'Set validation: required, unique, regex pattern',
        'Choose category: general, contact, business, project, HR, finance, construction',
        'Add description in Hebrew and English (will show in field info)',
        'Save — meta_key will be auto-generated',
      ],
      ru: [
        'Нажмите "Новое поле" → заполните имя (иврит + английский)',
        'Выберите тип поля: текст, число, выбор, дата, телефон, email, URL...',
        'Добавьте варианты (для полей выбора) — с цветами',
        'Настройте валидацию: обязательное, уникальное, regex',
        'Выберите категорию: общее, контакт, бизнес, проект, HR, финансы, строительство',
        'Добавьте описание на иврите и английском',
        'Сохраните — мета-ключ создастся автоматически',
      ],
    },
    link: '/dashboard/entities/fields',
    icon: Hash,
  },
  {
    id: 'entity-type',
    title: {
      he: '2. צור סוג ישות חדש',
      en: '2. Create a New Entity Type',
      ru: '2. Создайте новый тип сущности',
    },
    description: {
      he: 'סוג ישות = "עדשה" — הוא מגדיר אילו שדות להציג, באיזה סדר, ובאיזו תצוגה.',
      en: 'An entity type = "lens" — it defines which fields to show, in what order, and in which view.',
      ru: 'Тип сущности = "линза" — определяет какие поля показывать, в каком порядке и в каком виде.',
    },
    details: {
      he: [
        'לחץ "סוג חדש" בדף סוגי ישויות',
        'מלא: שם (עברית + אנגלית), slug (מזהה באנגלית), אייקון, צבע',
        'בחר תצוגת ברירת מחדל: טבלה / לוח / רשימה / לוח שנה / גאנט / ציר זמן',
        'בחר שדות — סמן את השדות מהספרייה שרלוונטיים לישות הזו',
        'בחר קבוצות חוזרות (אם צריך): לוג שיחות, לוג תשלומים...',
        'שמור — הסוג יופיע בתפריט הישויות',
      ],
      en: [
        'Click "New Type" in the Entity Types page',
        'Fill: name (Hebrew + English), slug (English ID), icon, color',
        'Choose default view: table / board / list / calendar / gantt / timeline',
        'Select fields — check the fields from the library relevant to this entity',
        'Select repeating groups (if needed): call log, payment log...',
        'Save — the type will appear in the entities menu',
      ],
      ru: [
        'Нажмите "Новый тип" на странице типов сущностей',
        'Заполните: имя (иврит + английский), slug (ID), иконка, цвет',
        'Выберите вид по умолчанию: таблица / доска / список / календарь / Гантт / хронология',
        'Выберите поля — отметьте поля из библиотеки для этой сущности',
        'Выберите повторяющиеся группы (если нужно): журнал звонков, платежей...',
        'Сохраните — тип появится в меню сущностей',
      ],
    },
    link: '/dashboard/entities/types',
    icon: Database,
  },
  {
    id: 'template',
    title: {
      he: '3. הגדר תבנית (Template Config)',
      en: '3. Configure Template',
      ru: '3. Настройте шаблон',
    },
    description: {
      he: 'התבנית מגדירה פריסה, תצוגות מותאמות, כפתורי פעולה ו-KPI.',
      en: 'The template defines layout, custom views, action buttons, and KPIs.',
      ru: 'Шаблон определяет макет, виды, кнопки действий и KPI.',
    },
    details: {
      he: [
        'פתח את סוג הישות → לשונית "תבנית"',
        'פריסה: בחר מספר עמודות (1-3) לשדות, הגדר סדר שדות',
        'תצוגות זמינות: בחר אילו תצוגות להציג (טבלה, לוח, גאנט...)',
        'הגדרת לוח (Board): בחר שדה לקיבוץ (למשל: סטטוס, מחלקה)',
        'הגדרת גאנט: בחר שדות תאריך התחלה/סיום',
        'כפתורי פעולה: הוסף כפתורים מותאמים (שינוי סטטוס, שליחת הודעה...)',
        'KPI triggers: הגדר אירועים לספירה אוטומטית',
      ],
      en: [
        'Open the entity type → "Template" tab',
        'Layout: choose columns (1-3) for fields, set field order',
        'Available views: select which views to show (table, board, gantt...)',
        'Board config: choose a field to group by (e.g., status, department)',
        'Gantt config: choose start/end date fields',
        'Action buttons: add custom buttons (change status, send message...)',
        'KPI triggers: define events for automatic counting',
      ],
      ru: [
        'Откройте тип сущности → вкладка "Шаблон"',
        'Макет: выберите количество колонок (1-3), порядок полей',
        'Доступные виды: выберите какие виды показывать',
        'Настройка доски: выберите поле для группировки',
        'Настройка Гантта: выберите поля дат',
        'Кнопки действий: добавьте кастомные кнопки',
        'KPI триггеры: определите события для автоматического подсчёта',
      ],
    },
    link: '/dashboard/entities/types',
    icon: Database,
  },
  {
    id: 'connections',
    title: {
      he: '4. הגדר חיבורים בין ישויות',
      en: '4. Define Connections Between Entities',
      ru: '4. Определите связи между сущностями',
    },
    description: {
      he: 'חיבורים מקשרים סוגי ישויות — לקוח→נכס, ספק→חשבונית וכו\'.',
      en: 'Connections link entity types — client→property, vendor→invoice, etc.',
      ru: 'Связи соединяют типы сущностей — клиент→объект, поставщик→счёт и т.д.',
    },
    details: {
      he: [
        'בדף סוגי ישויות → לשונית "חיבורים"',
        'בחר מקור (Source): הישות שמתחילה את הקשר',
        'בחר יעד (Target): הישות המחוברת',
        'בחר סוג קשר: one-to-one, one-to-many, many-to-many',
        'תן תווית לקשר (למשל: "הנכסים של הלקוח")',
        'חיבורים יופיעו כלשונית בתוך דף הפתק',
      ],
      en: [
        'In Entity Types page → "Connections" section',
        'Choose Source: the entity that starts the relationship',
        'Choose Target: the connected entity',
        'Choose relation type: one-to-one, one-to-many, many-to-many',
        'Give the relation a label (e.g., "Client\'s Properties")',
        'Connections will appear as a tab inside the note detail page',
      ],
      ru: [
        'На странице типов → раздел "Связи"',
        'Выберите источник: сущность, начинающая связь',
        'Выберите цель: связанная сущность',
        'Выберите тип связи: один-к-одному, один-ко-многим, многие-ко-многим',
        'Дайте метку связи',
        'Связи появятся как вкладка на странице записи',
      ],
    },
    link: '/dashboard/entities/types',
    icon: Link2,
  },
  {
    id: 'use',
    title: {
      he: '5. צור פתקים וטען נתונים',
      en: '5. Create Notes and Load Data',
      ru: '5. Создавайте записи и загружайте данные',
    },
    description: {
      he: 'הכל מוכן! עכשיו אפשר ליצור פתקים חדשים מסוג הישות.',
      en: 'All set! Now you can create new notes of your entity type.',
      ru: 'Всё готово! Теперь можно создавать записи нового типа.',
    },
    details: {
      he: [
        'לחץ על סוג הישות בדף הישויות',
        'לחץ "פתק חדש" → תן שם',
        'מלא את השדות שהגדרת',
        'שנה בין תצוגות: טבלה, לוח, רשימה...',
        'סנן ומיין לפי כל שדה',
        'קשר פתקים אחד לשני (stakeholders, linked notes)',
        'צפה בלוג פעילות ו-KPI אירועים',
      ],
      en: [
        'Click on the entity type in the entities page',
        'Click "New Note" → give it a name',
        'Fill in the fields you defined',
        'Switch between views: table, board, list...',
        'Filter and sort by any field',
        'Link notes to each other (stakeholders, linked notes)',
        'View activity log and KPI events',
      ],
      ru: [
        'Нажмите на тип сущности на странице сущностей',
        'Нажмите "Новая запись" → дайте имя',
        'Заполните определённые поля',
        'Переключайтесь между видами: таблица, доска, список...',
        'Фильтруйте и сортируйте по любому полю',
        'Связывайте записи друг с другом',
        'Просматривайте журнал активности и KPI',
      ],
    },
    icon: ArrowRight,
  },
];

interface EntitySetupGuideProps {
  lang: 'he' | 'en' | 'ru';
  completedFields: number;
  completedTypes: number;
  completedConnections: number;
}

export function EntitySetupGuide({ lang, completedFields, completedTypes, completedConnections }: EntitySetupGuideProps) {
  const [open, setOpen] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const isRtl = lang === 'he';
  const title = { he: 'מדריך הקמת ישויות', en: 'Entity Setup Guide', ru: 'Руководство по настройке' }[lang];
  const subtitle = { he: 'צעד אחר צעד', en: 'Step by step', ru: 'Шаг за шагом' }[lang];

  // Determine completion per step
  const stepDone = (id: string): boolean => {
    switch (id) {
      case 'fields': return completedFields > 0;
      case 'entity-type': return completedTypes > 0;
      case 'template': return completedTypes > 0; // template is part of entity type
      case 'connections': return completedConnections > 0;
      case 'use': return completedFields > 0 && completedTypes > 0;
      default: return false;
    }
  };

  const doneCount = GUIDE_STEPS.filter(s => stepDone(s.id)).length;
  const pct = Math.round((doneCount / GUIDE_STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-blue-500/[0.05] transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
          <BookOpen size={16} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">{title}</span>
            <span className="text-[10px] text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded">{subtitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden max-w-[200px]">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-slate-500">{doneCount}/{GUIDE_STEPS.length}</span>
          </div>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>

      {/* Steps */}
      {open && (
        <div className="border-_t border-blue-500/10 px-4 py-3 space-y-2">
          {GUIDE_STEPS.map(step => {
            const done = stepDone(step.id);
            const expanded = expandedStep === step.id;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expanded ? null : step.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-white/[0.03] transition-colors"
                >
                  {done
                    ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    : <Circle size={16} className="text-slate-600 shrink-0" />
                  }
                  <StepIcon size={14} className={done ? 'text-emerald-400 shrink-0' : 'text-slate-500 shrink-0'} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${done ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {step.title[lang]}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{step.description[lang]}</p>
                  </div>
                  {expanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
                </button>

                {expanded && (
                  <div className="px-3 pb-3 ps-10 border-_t border-white/[0.04]" dir={isRtl ? 'rtl' : 'ltr'}>
                    <ul className="space-y-1.5 mt-2">
                      {step.details[lang].map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                          <span className="text-blue-400 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    {step.link && (
                      <a
                        href={step.link}
                        className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <_ExternalLink size={10} />
                        {{ he: 'פתח', en: 'Open', ru: 'Открыть' }[lang]}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
