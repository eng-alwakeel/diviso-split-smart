import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFoundingProgram } from "@/hooks/useFoundingProgram";
import { 
  Star, 
  Coins, 
  CalendarCheck, 
  BadgeCheck, 
  Hash,
  UserPlus,
  Award,
  Sparkles,
  Crown
} from "lucide-react";

const FoundingProgram = () => {
  const { t } = useTranslation('founding');
  const navigate = useNavigate();
  const { total, remaining, limit, isClosed, isLoading } = useFoundingProgram();

  const progressValue = ((limit - remaining) / limit) * 100;

  const benefits = [
    {
      icon: Coins,
      title: t('benefits.welcome.title'),
      description: t('benefits.welcome.description'),
      gradient: "from-emerald-500/20 to-green-600/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/30"
    },
    {
      icon: CalendarCheck,
      title: t('benefits.monthly.title'),
      description: t('benefits.monthly.description'),
      gradient: "from-blue-500/20 to-cyan-600/20",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/30"
    },
    {
      icon: BadgeCheck,
      title: t('benefits.badge.title'),
      description: t('benefits.badge.description'),
      gradient: "from-amber-500/20 to-yellow-600/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30"
    },
    {
      icon: Hash,
      title: t('benefits.number.title'),
      description: t('benefits.number.description'),
      gradient: "from-purple-500/20 to-violet-600/20",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30"
    }
  ];

  const steps = [
    {
      icon: UserPlus,
      title: t('howItWorks.steps.register.title'),
      description: t('howItWorks.steps.register.description')
    },
    {
      icon: Hash,
      title: t('howItWorks.steps.number.title'),
      description: t('howItWorks.steps.number.description')
    },
    {
      icon: Sparkles,
      title: t('howItWorks.steps.points.title'),
      description: t('howItWorks.steps.points.description')
    },
    {
      icon: Award,
      title: t('howItWorks.steps.badge.title'),
      description: t('howItWorks.steps.badge.description')
    }
  ];

  const faqItems = [
    { key: 'condition', question: t('faq.items.condition.question'), answer: t('faq.items.condition.answer') },
    { key: 'lifetime', question: t('faq.items.lifetime.question'), answer: t('faq.items.lifetime.answer') },
    { key: 'transfer', question: t('faq.items.transfer.question'), answer: t('faq.items.transfer.answer') },
    { key: 'limit', question: t('faq.items.limit.question'), answer: t('faq.items.limit.answer') },
    { key: 'verify', question: t('faq.items.verify.question'), answer: t('faq.items.verify.answer') }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/20 rounded-full blur-[120px] opacity-50" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-amber-300">{t('hero.badge')}</span>
              </div>
              
              {/* Title */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center gap-3 mb-4">
                  <Crown className="w-12 h-12 text-amber-400" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {t('hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t('hero.subtitle')}
                </p>
              </div>

              {/* Progress Counter */}
              <div className="max-w-md mx-auto space-y-3 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{total} / {limit}</span>
                  <span className={`font-semibold ${isClosed ? 'text-destructive' : 'text-amber-400'}`}>
                    {isClosed ? t('hero.programClosed') : t('hero.spotsRemaining', { count: remaining })}
                  </span>
                </div>
                <Progress 
                  value={progressValue} 
                  className="h-3 bg-muted/50"
                />
                {!isClosed && (
                  <p className="text-sm text-amber-400/80 animate-pulse">
                    {t('hero.hurry')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('benefits.title')}</h2>
              <p className="text-muted-foreground text-lg">{t('benefits.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index}
                  className={`relative overflow-hidden bg-gradient-to-br ${benefit.gradient} border ${benefit.borderColor} hover:scale-105 transition-transform duration-300`}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background/50 ${benefit.iconColor}`}>
                      <benefit.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('howItWorks.title')}</h2>
              <p className="text-muted-foreground text-lg">{t('howItWorks.subtitle')}</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-4 gap-4 md:gap-8">
                {steps.map((step, index) => (
                  <div key={index} className="relative flex flex-col items-center text-center">
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-8 start-1/2 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-amber-500/20" />
                    )}
                    
                    {/* Step Number */}
                    <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl mb-4 shadow-lg shadow-amber-500/30">
                      {index + 1}
                    </div>
                    
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 mb-3">
                      <step.icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('faq.title')}</h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqItems.map((item) => (
                  <AccordionItem 
                    key={item.key} 
                    value={item.key}
                    className="border border-border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="text-start hover:no-underline py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 border-amber-500/30 overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <Crown className="w-16 h-16 text-amber-400 mx-auto" />
                <h2 className="text-3xl md:text-4xl font-bold">{t('cta.title')}</h2>
                <p className="text-muted-foreground text-lg">{t('cta.subtitle')}</p>
                
                <Button 
                  size="lg"
                  variant="hero"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/auth')}
                  disabled={isClosed}
                >
                  {t('cta.button')}
                </Button>

                {!isClosed && (
                  <p className="text-amber-400 font-semibold animate-pulse">
                    {t('cta.spotsLeft', { count: remaining })}
                  </p>
                )}

                <p className="text-sm text-muted-foreground">
                  {t('cta.termsLink')}{' '}
                  <a href="/terms" className="text-amber-400 hover:underline">
                    {t('cta.termsText')}
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FoundingProgram;
