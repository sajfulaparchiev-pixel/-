
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
        error: "moderationError" 
      };
    }
  }

  // 2. Check for nonsense (random character strings)
  const words = text.split(/\s+/).filter(w => w.length > 7); 
  const VOWELS_RU = "аеёиоуыэюяaeiouy";
  
  for (const word of words) {
    const hasVowels = [...word.toLowerCase()].some(char => VOWELS_RU.includes(char));
    if (!hasVowels && word.length > 10 && /^[а-яa-z]+$/i.test(word)) {
      return { 
        isValid: false, 
        error: "meaninglessWordsError" 
      };
    }

    if (/(.)\1{6,}/.test(word)) {
      return { 
        isValid: false, 
        error: "tooManyRepeatedChars" 
      };
    }
  }

  // 3. Minimum length
  const trimmed = text.trim();
  if (isChat) {
    if (trimmed.length === 0) return { isValid: false, error: "emptyMessageError" };
    return { isValid: true };
  }

  const meaningfulWords = trimmed.split(/\s+/).filter(w => w.length > 1);
  if (meaningfulWords.length < 2) {
    return {
      isValid: false,
      error: "descriptionTooShort"
    };
  }

  return { isValid: true };
};

export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: "nameTooShort" };
  }
  if (name.trim().length > 35) {
    return { isValid: false, error: "nameTooLong" };
  }

  const lowerName = name.toLowerCase();
  
  for (const pattern of BAD_WORDS_RU) {
    const regex = new RegExp(`\\b${pattern}\\b|${pattern}`, 'i'); 
    if (pattern.length <= 3) {
      const strictRegex = new RegExp(`(^|\\s)${pattern}|${pattern}(\\s|$)`, 'i');
      if (strictRegex.test(lowerName)) {
        return { 
          isValid: false, 
          error: "nameBlockedExpressions" 
        };
      }
    } else {
      if (lowerName.includes(pattern)) {
        return { 
          isValid: false, 
          error: "nameBlockedExpressions" 
        };
      }
    }
  }

  const VOWELS_RU = "аеёиоуыэюяaeiouy";
  const hasVowels = [...lowerName].some(char => VOWELS_RU.includes(char));
  
  const keyboardSequences = ["qwerty", "asdfgh", "zxcvbn", "йцукен", "фывапр", "ячсмит"];
  const isKeyboardSeq = keyboardSequences.some(seq => lowerName.includes(seq));

  if ((!hasVowels && lowerName.trim().length > 3) || isKeyboardSeq) {
    return { isValid: false, error: "nameMeaningless" };
  }

  if (/(.)\1{4,}/.test(lowerName)) {
    return { isValid: false, error: "nameRepeatedChars" };
  }

  if (!/^[а-яa-z\s-]+$/i.test(name)) {
    return { isValid: false, error: "nameInvalidChars" };
  }

  return { isValid: true };
};
