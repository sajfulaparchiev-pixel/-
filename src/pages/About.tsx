import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { 
  Heart, 
  Users, 
  Target, 
  Lightbulb,
  Mail,
  MessageCircle
} from "lucide-react";
import FlowIcon from "@/components/ui/FlowIcon";

const values = [
  {
    icon: Heart,
    title: "Открытость",
    description: "Мы верим, что знания должны быть доступны каждому. Skillflow — это платформа без финансовых барьеров."
  },
  {
    icon: Users,
    title: "Сообщество",
    description: "Мы строим пространство, где люди помогают друг другу расти и развиваться через взаимный обмен."
  },
  {
    icon: Target,
    title: "Практичность",
    description: "Учёба через практику и реальное общение эффективнее любых теоретических курсов."
  },
  {
    icon: Lightbulb,
    title: "Развитие",
    description: "Каждый человек — одновременно ученик и учитель. Делясь знаниями, мы сами становимся лучше."
  }
];

const team = [
  {
    name: "Парчиев Сайфула",
    role: "Технический лидер",
    bio: "Отвечает за архитектуру и техническое развитие платформы.",
    avatar: "ПС"
  },
  {
    name: "Парижев Муслим",
    role: "Стратегия и Партнёрство",
    bio: "Развивает стратегические направления и партнёрские отношения.",
    avatar: "ПМ"
  },
  {
    name: "Ганижев Ислам",
    role: "Маркетинг и Коммуникации",
    bio: "Продвигает платформу и выстраивает коммуникацию с аудиторией.",
    avatar: "ГИ"
  },
  {
    name: "Нальгиев Магомед",
    role: "Аналитика и UX",
    bio: "Анализирует данные и создаёт удобный пользовательский опыт.",
    avatar: "НМ"
  }
];


const About = () => {
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
              <Heart className="w-4 h-4" />
              Наша история
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              О <span className="text-gradient">Skillflow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Мы создаём пространство, где люди свободно обмениваются знаниями и навыками, 
              помогая друг другу расти без финансовых барьеров.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Наша миссия
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  <strong className="text-foreground">Skillflow</strong> появился из простой идеи: 
                  у каждого человека есть знания и навыки, которыми он может поделиться, 
                  и есть то, чему он хочет научиться.
                </p>
                <p>
                  Мы соединяем этих людей, создавая экосистему взаимного обучения. 
                  Здесь программист может научить кодить в обмен на уроки игры на гитаре, 
                  а повар — поделиться рецептами за уроки английского.
                </p>
                <p>
                  Наша цель — сделать образование доступным, практичным и основанным на 
                  живом человеческом общении.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-soft">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">10K+</p>
                    <p className="text-sm text-muted-foreground">пользователей</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">500+</p>
                    <p className="text-sm text-muted-foreground">навыков</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">50K+</p>
                    <p className="text-sm text-muted-foreground">сессий</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">4.9</p>
                    <p className="text-sm text-muted-foreground">рейтинг</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Наши ценности
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Принципы, которые направляют нас в создании лучшей платформы для обмена знаниями
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-soft text-center"
              >
                <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Свяжитесь с нами
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Есть вопросы, предложения или хотите сотрудничать? Мы всегда рады обратной связи.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="rounded-2xl h-14 px-8 font-bold shadow-lg shadow-primary/20" asChild>
              <a href="mailto:saifulkjh63@gmail.com">
                <Mail className="w-5 h-5 mr-2" />
                Написать нам
              </a>
            </Button>
            <Button variant="outline" size="lg" className="rounded-2xl h-14 px-8 font-bold" asChild>
              <a href="https://t.me/+MfafzZ912WtiYzM6" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Telegram-чат
              </a>
            </Button>
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

export default About;
