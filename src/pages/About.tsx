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

import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  const values = [
    {
      icon: Heart,
      title: t("openness"),
      description: t("opennessDesc")
    },
    {
      icon: Users,
      title: t("community"),
      description: t("communityAboutDesc")
    },
    {
      icon: Target,
      title: t("practicality"),
      description: t("practicalityDesc")
    },
    {
      icon: Lightbulb,
      title: t("development"),
      description: t("developmentDesc")
    }
  ];

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
              {t("ourHistory")}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              {t("aboutUs")} <span className="text-gradient">Skillflow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("aboutDescription")}
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
                {t("mission")}
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  <strong className="text-foreground">Skillflow</strong> {t("aboutIntro")}
                </p>
                <p>
                  {t("missionText")}
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
                    <p className="text-sm text-muted-foreground">{t("usersStatus") || t("users")}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">500+</p>
                    <p className="text-sm text-muted-foreground">{t("skillsStatus") || t("skills")}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">50K+</p>
                    <p className="text-sm text-muted-foreground">{t("sessionsStatus") || t("sessions")}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground">4.9</p>
                    <p className="text-sm text-muted-foreground">{t("ratingStatus") || t("rating")}</p>
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
              {t("ourValues")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("principlesTitle")}
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
              {t("contactUs")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("contactText")}
            </p>
          </motion.div>
 
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="rounded-2xl h-14 px-8 font-bold shadow-lg shadow-primary/20" asChild>
              <a href="mailto:saifulkjh63@gmail.com">
                <Mail className="w-5 h-5 mr-2" />
                {t("writeToUs")}
              </a>
            </Button>
            <Button variant="outline" size="lg" className="rounded-2xl h-14 px-8 font-bold" asChild>
              <a href="https://t.me/+MfafzZ912WtiYzM6" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                {t("telegramChat")}
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
              © 2026 Skillflow. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
