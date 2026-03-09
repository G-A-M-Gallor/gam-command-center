export interface EmojiCategory {
  id: string;
  labelHe: string;
  labelEn: string;
  labelRu: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    labelHe: 'פרצופים',
    labelEn: 'Smileys',
    labelRu: 'Смайлы',
    emojis: [
      '😀', '😃', '😄', '😁', '😊', '🥰', '😎', '🤩', '🤔', '😇',
      '🙂', '😏', '🤗', '😴', '🤓', '🧐', '😬', '🤝', '👋', '✌️',
      '👍', '👎', '👏', '🙏', '💪', '🤞',
    ],
  },
  {
    id: 'objects',
    labelHe: 'חפצים',
    labelEn: 'Objects',
    labelRu: 'Предметы',
    emojis: [
      '📄', '📁', '📋', '📌', '📎', '🔗', '📝', '✏️', '🖊️', '📐',
      '📏', '📊', '📈', '📉', '🗂️', '🗃️', '🗄️', '📦', '📮', '✉️',
      '📧', '💼', '🎒', '🔑', '🔒', '🔓',
    ],
  },
  {
    id: 'symbols',
    labelHe: 'סמלים',
    labelEn: 'Symbols',
    labelRu: 'Символы',
    emojis: [
      '⭐', '🌟', '✨', '💡', '🔥', '💎', '🏆', '🎯', '🚀', '⚡',
      '❤️', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❌', '✅',
      '⚠️', '🔴', '🟡', '🟢', '🔵', '🟣',
    ],
  },
  {
    id: 'people',
    labelHe: 'אנשים',
    labelEn: 'People',
    labelRu: 'Люди',
    emojis: [
      '👤', '👥', '👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍🏫', '👩‍🏫',
      '👷', '🧑‍🤝‍🧑', '👨‍👩‍👧', '🏃', '🧑‍💻', '🧑‍🔬', '🧑‍🎨', '👨‍⚕️', '🧑‍🏭', '🧑‍⚖️',
    ],
  },
  {
    id: 'nature',
    labelHe: 'טבע',
    labelEn: 'Nature',
    labelRu: 'Природа',
    emojis: [
      '🌳', '🌲', '🌴', '🌿', '🍀', '🌸', '🌻', '🌹', '🍁', '🌍',
      '🌊', '☀️', '🌙', '⛅', '🌈', '🦋', '🐦', '🐾', '🌵', '🍃',
    ],
  },
  {
    id: 'buildings',
    labelHe: 'בניינים',
    labelEn: 'Buildings',
    labelRu: 'Здания',
    emojis: [
      '🏠', '🏗️', '🏢', '🏭', '🏪', '🏫', '🏥', '🏛️', '🏟️', '🏰',
      '🗼', '🏘️', '🚧', '🛠️', '⛏️', '🧱', '🪵', '🏠', '🔨', '🪜',
    ],
  },
  {
    id: 'transport',
    labelHe: 'תחבורה',
    labelEn: 'Transport',
    labelRu: 'Транспорт',
    emojis: [
      '🚗', '🚕', '🚌', '🚛', '🏎️', '🚒', '🚑', '🚁', '✈️', '🚢',
      '🚲', '🛵', '🚜', '🚂', '📍', '🗺️', '🧭', '🚦', '⛽', '🅿️',
    ],
  },
  {
    id: 'food',
    labelHe: 'אוכל',
    labelEn: 'Food',
    labelRu: 'Еда',
    emojis: [
      '☕', '🍕', '🍔', '🍩', '🎂', '🍎', '🍇', '🥗', '🍺', '🍷',
      '🧁', '🍿', '🥤', '🍣', '🌮', '🥪', '🍳', '🥐', '🧃', '🫖',
    ],
  },
];

export const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap(c => c.emojis);
