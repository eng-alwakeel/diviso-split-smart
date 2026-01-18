import { useState, useEffect, useCallback } from "react";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Testimonial {
  id: number;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  content: string;
  contentAr: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ahmed Al-Rashid",
    nameAr: "أحمد الراشد",
    role: "Travel Enthusiast",
    roleAr: "محب السفر",
    content: "Diviso made our group trip to Dubai so much easier! No more awkward money conversations.",
    contentAr: "Diviso سهّل رحلتنا الجماعية لدبي بشكل كبير! ما صار في نقاشات محرجة عن الفلوس.",
    avatar: "👨‍💼",
    rating: 5,
  },
  {
    id: 2,
    name: "Sara Mohammed",
    nameAr: "سارة محمد",
    role: "Shared Housing",
    roleAr: "سكن مشترك",
    content: "We use it for our apartment expenses. Everything is transparent and fair now!",
    contentAr: "نستخدمه لمصاريف الشقة. كل شي صار واضح وعادل!",
    avatar: "👩‍💻",
    rating: 5,
  },
  {
    id: 3,
    name: "Khalid Abdullah",
    nameAr: "خالد عبدالله",
    role: "Weekend Trips",
    roleAr: "طلعات نهاية الأسبوع",
    content: "Perfect for our camping trips. Add expenses on the go and settle later!",
    contentAr: "ممتاز لرحلات البر! نضيف المصاريف وقتها ونحاسب بعدين.",
    avatar: "🧔",
    rating: 5,
  },
  {
    id: 4,
    name: "Noura Al-Saud",
    nameAr: "نورة آل سعود",
    role: "Friends Group",
    roleAr: "مجموعة أصدقاء",
    content: "Finally an app that understands how we split bills in Saudi Arabia!",
    contentAr: "أخيراً تطبيق يفهم طريقتنا في تقسيم الحساب في السعودية!",
    avatar: "👩",
    rating: 5,
  },
  {
    id: 5,
    name: "Faisal Al-Otaibi",
    nameAr: "فيصل العتيبي",
    role: "Business Trips",
    roleAr: "رحلات عمل",
    content: "Clean reports and easy tracking. Highly recommend for team expenses!",
    contentAr: "تقارير واضحة وتتبع سهل. أنصح فيه لمصاريف الفريق!",
    avatar: "👨‍💼",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  const { t, i18n } = useTranslation('landing');
  const isArabic = i18n.language === 'ar';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      setTimeout(() => setIsAnimating(false), 50);
    }, 300);
  }, [isAnimating]);

  const goToIndex = useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 50);
    }, 300);
  }, [isAnimating, currentIndex]);

  useEffect(() => {
    const timer = setInterval(goToNext, 4000);
    return () => clearInterval(timer);
  }, [goToNext]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {t('testimonials.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-lg p-8 relative overflow-hidden">
            {/* Quote Icon */}
            <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/10" />
            
            {/* Content with fade animation */}
            <div 
              className={`relative transition-all duration-300 ease-in-out ${
                isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
              }`}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Text */}
              <p className="text-lg md:text-xl leading-relaxed mb-6 min-h-[80px]">
                "{isArabic ? currentTestimonial.contentAr : currentTestimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center text-2xl">
                  {currentTestimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">
                    {isArabic ? currentTestimonial.nameAr : currentTestimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? currentTestimonial.roleAr : currentTestimonial.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
