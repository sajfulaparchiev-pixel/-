export const CATEGORY_KEYS = [
  "programming", "design", "music", "languages", "fitness", "photography", 
  "marketing", "business", "art", "cooking", "sport", "dancing", "video", 
  "writing", "psychology", "finance", "education", "crafts", "other"
] as const;

export type CategoryKey = typeof CATEGORY_KEYS[number];

export const getCategoryKey = (val: string): string => {
  if (!val) return "other";
  const lowerVal = val.toLowerCase();
  
  if (CATEGORY_KEYS.includes(lowerVal as CategoryKey)) return lowerVal;
  
  const mapping: Record<string, string> = {
    // English
    "programming": "programming", "design": "design", "music": "music",
    "languages": "languages", "fitness": "fitness", "photography": "photography",
    "marketing": "marketing", "business": "business", "art": "art",
    "cooking": "cooking", "sport": "sport", "dancing": "dancing",
    "video editing": "video", "writing & copywriting": "writing", "psychology": "psychology",
    "finance": "finance", "science & education": "education", "crafts": "crafts", "other": "other",
    // Russian
    "программирование": "programming", "дизайн": "design", "музыка": "music",
    "языки": "languages", "фитнес": "fitness", "фотография": "photography",
    "маркетинг": "marketing", "бизнес": "business", "искусство": "art",
    "кулинария": "cooking", "спорт": "sport", "танцы": "dancing",
    "видеомонтаж": "video", "письмо и копирайтинг": "writing", "психология": "psychology",
    "финансы": "finance", "наука и образование": "education", "ремёсла": "crafts", "другое": "other"
  };

  return mapping[lowerVal] || "other";
};
