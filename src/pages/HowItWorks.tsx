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

import { useLanguage } from "@/contexts/LanguageContext";

const steps = (t: any) => [
  {
    number: "01",
    icon: UserPlus,
    title: t("step1Title"),
    description: t("step1Desc"),
    details: t("step1Items") || []
  },
  {
    number: "02",
    icon: Search,
    title: t("step2Title"),
    description: t("step2Desc"),
    details: t("step2Items") || []
  },
  {
    number: "03",
    icon: MessageSquare,
    title: t("step3Title"),
    description: t("step3Desc"),
    details: t("step3Items") || []
  },
  {
    number: "04",
    icon: Video,
    title: t("step4Title"),
    description: t("step4Desc"),
    details: t("step4Items") || []
  },
  {
    number: "05",
    icon: Star,
    title: t("step5Title"),
    description: t("step5Desc"),
    details: t("step5Items") || []
  }
];

const benefits = (t: any) => t("benefitsList") || [];

const HowItWorks = () => {
  const { t } = useLanguage();
  const currentSteps = steps(t);
  const currentBenefits = benefits(t);

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
              {t("simpleProcess")}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              {t("howItWorksTitle")} <span className="text-gradient">Skillflow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("howItWorksSubtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="space-y-16">
            {currentSteps.map((step, index) => (
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
              {t("whySkillExchange")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("whySkillExchangeDesc")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {currentBenefits.map((benefit, index) => (
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
              © 2026 Skillflow. {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
