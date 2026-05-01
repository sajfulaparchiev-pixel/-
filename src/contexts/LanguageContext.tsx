import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Language = "ru" | "en";

const translations = {
  ru: {
    // Header & Nav
    skills: "Навыки",
    howItWorks: "Как это работает",
    aboutUs: "О нас",
    profile: "Профиль",
    sessions: "Сессии",
    settings: "Настройки",
    signIn: "Войти",
    signOut: "Выйти",
    start: "Начать",
    feed: "Лента",
    search: "Поиск",
    add: "Добавить",

    // Feed
    communitySkills: "Навыки сообщества",
    findWhatToLearn: "Найди то, что хочешь изучить",
    addSkill: "Добавить навык",
    searchSkills: "Поиск навыков...",
    noSkillsFound: "Навыки не найдены. Попробуйте изменить фильтры.",
    all: "Все",
    programming: "Программирование",
    design: "Дизайн",
    music: "Музыка",
    languages: "Языки",
    fitness: "Фитнес",
    business: "Бизнес",
    art: "Искусство",

    // Profile
    user: "Пользователь",
    addInfoAboutYourself: "Добавьте информацию о себе в настройках профиля",
    rating: "рейтинг",
    sessionsCount: "сессий",
    skillsCount: "навыков",
    reputation: "репутация",
    mySkills: "Мои навыки",
    sessionHistory: "История сессий",
    reviews: "Отзывы",
    editProfile: "Редактировать профиль",
    name: "Имя",
    surname: "Фамилия",
    aboutMe: "О себе",
    yourName: "Ваше имя",
    yourSurname: "Ваша фамилия",
    tellAboutYourself: "Расскажите о себе...",
    save: "Сохранить",
    saving: "Сохранение...",
    profileUpdated: "Профиль обновлён",
    dataSaved: "Ваши данные успешно сохранены",
    error: "Ошибка",
    couldNotSave: "Не удалось сохранить изменения",
    noReviews: "Нет отзывов",
    reviewsAppearAfterSessions: "Отзывы появятся после завершённых сессий",
    noSessions: "Нет сессий",
    sessionsAppearAfterExchange: "Сессии появятся после обмена навыками",
    sessionsCompleted: "сессий проведено",
    beginner: "Начинающий",
    intermediate: "Средний",
    expert: "Эксперт",
    changeAvatar: "Сменить аватар",
    chooseAvatar: "Выберите аватар",
    defaultAvatars: "Стандартные аватары",

    // Sessions
    mySessions: "Мои сессии",
    manageYourSessions: "Управляйте своими учебными сессиями",
    upcoming: "Предстоящие",
    past: "Прошедшие",
    noUpcomingSessions: "Нет предстоящих сессий",
    findSkillsAndPlan: "Найдите навыки и запланируйте первую сессию",
    findSkills: "Найти навыки",
    startSession: "Начать",
    completed: "Завершено",
    rate: "Оценить",
    details: "Подробнее",
    reviewSent: "Отзыв отправлен",
    min: "мин",

    // Settings
    settingsTitle: "Настройки",
    themeTitle: "Тема оформления",
    themeDescription: "Выберите предпочитаемую тему для интерфейса",
    lightTheme: "Светлая",
    lightDescription: "Классическая светлая тема",
    darkTheme: "Тёмная",
    darkDescription: "Тёмная тема для комфорта глаз",
    systemTheme: "Системная",
    systemDescription: "Следовать настройкам системы",
    notificationsTitle: "Уведомления",
    notificationsDescription: "Управление уведомлениями приложения",
    pushNotifications: "Push-уведомления",
    pushDescription: "Получать уведомления о новых сообщениях и сессиях",
    emailNotifications: "Email-уведомления",
    emailDescription: "Получать уведомления на электронную почту",
    privacyTitle: "Приватность",
    privacyDescription: "Настройки конфиденциальности профиля",
    profileVisibility: "Видимость профиля",
    profileVisibilityDescription: "Показывать профиль другим пользователям",
    onlineStatus: "Статус онлайн",
    onlineStatusDescription: "Показывать, когда вы в сети",
    languageTitle: "Язык",
    languageDescription: "Выберите язык интерфейса",
    saved: "Сохранено",
    settingSaved: "Настройка обновлена",
    couldNotSaveSetting: "Не удалось сохранить настройку",
  },
  en: {
    // Header & Nav
    skills: "Skills",
    howItWorks: "How it works",
    aboutUs: "About us",
    profile: "Profile",
    sessions: "Sessions",
    settings: "Settings",
    signIn: "Sign in",
    signOut: "Sign out",
    start: "Get started",
    feed: "Feed",
    search: "Search",
    add: "Add",

    // Feed
    communitySkills: "Community Skills",
    findWhatToLearn: "Find what you want to learn",
    addSkill: "Add skill",
    searchSkills: "Search skills...",
    noSkillsFound: "No skills found. Try changing the filters.",
    all: "All",
    programming: "Programming",
    design: "Design",
    music: "Music",
    languages: "Languages",
    fitness: "Fitness",
    business: "Business",
    art: "Art",

    // Profile
    user: "User",
    addInfoAboutYourself: "Add information about yourself in profile settings",
    rating: "rating",
    sessionsCount: "sessions",
    skillsCount: "skills",
    reputation: "reputation",
    mySkills: "My Skills",
    sessionHistory: "Session History",
    reviews: "Reviews",
    editProfile: "Edit Profile",
    name: "First name",
    surname: "Last name",
    aboutMe: "About me",
    yourName: "Your name",
    yourSurname: "Your last name",
    tellAboutYourself: "Tell about yourself...",
    save: "Save",
    saving: "Saving...",
    profileUpdated: "Profile updated",
    dataSaved: "Your data has been saved",
    error: "Error",
    couldNotSave: "Could not save changes",
    noReviews: "No reviews",
    reviewsAppearAfterSessions: "Reviews will appear after completed sessions",
    noSessions: "No sessions",
    sessionsAppearAfterExchange: "Sessions will appear after skill exchanges",
    sessionsCompleted: "sessions completed",
    beginner: "Beginner",
    intermediate: "Intermediate",
    expert: "Expert",
    changeAvatar: "Change avatar",
    chooseAvatar: "Choose avatar",
    defaultAvatars: "Default avatars",

    // Sessions
    mySessions: "My Sessions",
    manageYourSessions: "Manage your learning sessions",
    upcoming: "Upcoming",
    past: "Past",
    noUpcomingSessions: "No upcoming sessions",
    findSkillsAndPlan: "Find skills and plan your first session",
    findSkills: "Find skills",
    startSession: "Start",
    completed: "Completed",
    rate: "Rate",
    details: "Details",
    reviewSent: "Review sent",
    min: "min",

    // Settings
    settingsTitle: "Settings",
    themeTitle: "Theme",
    themeDescription: "Choose your preferred interface theme",
    lightTheme: "Light",
    lightDescription: "Classic light theme",
    darkTheme: "Dark",
    darkDescription: "Dark theme for eye comfort",
    systemTheme: "System",
    systemDescription: "Follow system settings",
    notificationsTitle: "Notifications",
    notificationsDescription: "Manage app notifications",
    pushNotifications: "Push notifications",
    pushDescription: "Receive notifications about new messages and sessions",
    emailNotifications: "Email notifications",
    emailDescription: "Receive notifications via email",
    privacyTitle: "Privacy",
    privacyDescription: "Profile privacy settings",
    profileVisibility: "Profile visibility",
    profileVisibilityDescription: "Show profile to other users",
    onlineStatus: "Online status",
    onlineStatusDescription: "Show when you are online",
    languageTitle: "Language",
    languageDescription: "Choose interface language",
    saved: "Saved",
    settingSaved: "Setting updated",
    couldNotSaveSetting: "Could not save setting",
  },
} as const;

type TranslationKey = keyof typeof translations.ru;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(
    () => (user?.user_metadata?.language as Language) || "ru"
  );

  useEffect(() => {
    const lang = user?.user_metadata?.language;
    if (lang === "ru" || lang === "en") {
      setLanguageState(lang);
    }
  }, [user?.user_metadata?.language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.ru[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
