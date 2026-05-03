
// Simple client-side moderation utility

const BAD_WORDS_RU = [
  "хуй", "пизд", "ебал", "ебат", "бля", "сук", "гандон", "чмо", "ублюдок",
  "ниггер", "хач", "хохол", "кацап", "жид", "чюрк", "чурк",
  "терроризм", "бомб", "взрыв", "экстремизм",
  "убей", "убий", "насил"
];

const SEVERE_OFFENSE = [
  "чернож", "узкоглаз", "чурка", "хач"
];

const RELIGIOUS_RACIAL_TERMS = [
  "аллах", "иисус", "христос", "будд", "ислам", "православ", "католик",
  "еврей", "негр"
];

// Content moderation for skill descriptions, reviews, etc.
export const validateContent = (text: string, isChat = false): { isValid: boolean; error?: string } => {
  const lowerText = text.toLowerCase();
  
  // 1. Check for severe profanity and slurs
  const forbiddenPatterns = [...BAD_WORDS_RU, ...SEVERE_OFFENSE];
  for (const pattern of forbiddenPatterns) {
    if (lowerText.includes(pattern)) {
      return { 
        isValid: false, 
        error: "Текст содержит недопустимые выражения. Пожалуйста, соблюдайте правила сообщества." 
      };
    }
  }

  // Religious/Racial terms are only banned if not in chat (e.g. in skill titles/descriptions to avoid polemics)
  // But even then, let's allow them if they are part of a longer word or used normally.
  // Actually, let's only block them in titles if it really looks like baiting.
  // For now, let's NOT block them unless it's a known slur.

  // 2. Check for nonsense (random character strings)
  const words = text.split(/\s+/).filter(w => w.length > 7); // only check long words for gibberish
  const VOWELS_RU = "аеёиоуыэюяaeiouy";
  
  for (const word of words) {
    const hasVowels = [...word.toLowerCase()].some(char => VOWELS_RU.includes(char));
    // If a long word has NO vowels and it's not a known acronym, it's likely gibberish
    if (!hasVowels && word.length > 10 && /^[а-яa-z]+$/i.test(word)) {
      return { 
        isValid: false, 
        error: "Пожалуйста, используйте осмысленные слова." 
      };
    }

    // Check for repetitive characters (e.g. "aaaaaaaaaaaaaa")
    if (/(.)\1{6,}/.test(word)) {
      return { 
        isValid: false, 
        error: "Слишком много повторяющихся символов." 
      };
    }
  }

  // 3. Minimum length - Chat should be more flexible
  const trimmed = text.trim();
  if (isChat) {
    if (trimmed.length === 0) return { isValid: false, error: "Сообщение не может быть пустым" };
    return { isValid: true };
  }

  const meaningfulWords = trimmed.split(/\s+/).filter(w => w.length > 1);
  if (meaningfulWords.length < 2) {
    return {
      isValid: false,
      error: "Описание слишком короткое. Добавьте больше деталей."
    };
  }

  return { isValid: true };
};

export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: "Имя слишком короткое (мин. 2 символа)" };
  }
  if (name.trim().length > 35) {
    return { isValid: false, error: "Имя слишком длинное (макс. 35 символов)" };
  }

  const lowerName = name.toLowerCase();
  
  // Check for profanity in name - more carefully to avoid false positives in long names
  for (const pattern of BAD_WORDS_RU) {
    const regex = new RegExp(`\\b${pattern}\\b|${pattern}`, 'i'); 
    // Actually, for very short patterns, only match if it's a separate word or at start/end
    if (pattern.length <= 3) {
      const strictRegex = new RegExp(`(^|\\s)${pattern}|${pattern}(\\s|$)`, 'i');
      if (strictRegex.test(lowerName)) {
        return { 
          isValid: false, 
          error: "Имя содержит недопустимые выражения." 
        };
      }
    } else {
      if (lowerName.includes(pattern)) {
        return { 
          isValid: false, 
          error: "Имя содержит недопустимые выражения." 
        };
      }
    }
  }

  // Check for gibberish names (e.g. "asdfgh")
  const VOWELS_RU = "аеёиоуыэюяaeiouy";
  const hasVowels = [...lowerName].some(char => VOWELS_RU.includes(char));
  
  // If name has 4+ characters and no vowels, or is a known keyboard sequence
  const keyboardSequences = ["qwerty", "asdfgh", "zxcvbn", "йцукен", "фывапр", "ячсмит"];
  const isKeyboardSeq = keyboardSequences.some(seq => lowerName.includes(seq));

  if ((!hasVowels && lowerName.trim().length > 3) || isKeyboardSeq) {
    return { isValid: false, error: "Пожалуйста, введите осмысленное имя." };
  }

  // Check for repetitive characters (e.g. "aaaaa")
  if (/(.)\1{4,}/.test(lowerName)) {
    return { isValid: false, error: "Имя содержит слишком много повторяющихся символов." };
  }

  // Only allow letters and hyphens
  if (!/^[а-яa-z\s-]+$/i.test(name)) {
    return { isValid: false, error: "Имя может содержать только буквы и дефис." };
  }

  return { isValid: true };
};
