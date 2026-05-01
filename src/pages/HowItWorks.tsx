import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { 
  UserPlus, 
  Search, 
  MessageSquare, 
  Video, 
  Star, 
  CheckCircle
} from "lucide-react";
import FlowIcon from "@/components/ui/FlowIcon";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Создай профиль",
    description: "Зарегистрируйся и добавь навыки, которыми хочешь поделиться. Расскажи, чему хочешь научиться.",
    details: [
      "Быстрая регистрация через email или соцсети",
      "Выбери до 10 навыков для обмена",
      "Укажи уровень владения каждым навыком",
      "Добавь информацию о себе и фото"
    ]
  },
  {
    number: "02",
    icon: Search,
    title: "Найди партнёра",
    description: "Наш алгоритм подберёт людей с взаимными интересами. Ты учишь X, хочешь Y — мы найдём того, кто учит Y и хочет X.",
    details: [
      "Умный поиск по навыкам и интересам",
      "Система совпадений по взаимным потребностям",
      "Фильтры по рейтингу, формату и доступности",
      "Мгновенные уведомления о новых совпадениях"
    ]
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Договорись о сессии",
    description: "Свяжись с партнёром через чат, обсуди детали и назначь удобное время для обмена знаниями.",
    details: [
      "Встроенный чат для обсуждения",
      "Календарь для планирования сессий",
      "Выбор формата: онлайн или офлайн",
      "Возможность обмена материалами"
    ]
  },
  {
    number: "04",
    icon: Video,
    title: "Проведи сессию",
    description: "Встречайтесь онлайн через видеочат или офлайн. Делитесь знаниями и учитесь новому.",
    details: [
      "Встроенный видеочат для онлайн-сессий",
      "Таймер для контроля времени",
      "Возможность записи сессии",
      "Обмен файлами и ссылками в реальном времени"
    ]
  },
  {
    number: "05",
    icon: Star,
    title: "Получи отзыв",
    description: "После сессии оставьте друг другу отзывы. Развивай репутацию и становись экспертом сообщества.",
    details: [
      "Система рейтинга от 1 до 5 звёзд",
      "Текстовые отзывы о сессии",
      "Накопление репутационных очков",
      "Бейджи и достижения за активность"
    ]
  }
];

const benefits = [
  "Бесплатный обмен знаниями без денежных затрат",
  "Практика с реальными людьми, а не по учебникам",
  "Расширение сети контактов и единомышленников",
  "Гибкий график — учись когда удобно",
  "Развитие навыков преподавания",
  "Получение честной обратной связи"
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FlowIcon size={16} className="text-primary" />
              Простой процесс
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Как работает <span className="text-gradient">Skillflow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Пять простых шагов от регистрации до первой сессии обмена навыками. 
              Начни учиться и делиться знаниями уже сегодня.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-6xl font-bold text-primary/20">{step.number}</span>
                    <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center">
                      <step.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {step.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {step.description}
                  </p>
                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div className="flex-1 w-full">
                  <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-soft">
                    <div className="aspect-video bg-secondary/50 rounded-2xl flex items-center justify-center">
                      <step.icon className="w-20 h-20 text-primary/30" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Почему обмен навыками?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Преимущества бартерного обучения перед традиционными курсами
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border/50"
              >
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <FlowIcon size={16} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Skillflow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Skillflow. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
