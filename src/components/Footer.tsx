import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Linkedin,
  Youtube
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandedDiviso } from "@/components/ui/branded-diviso";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

export const Footer = () => {
  const { t } = useTranslation('landing');

  return (
    <footer className="bg-gradient-to-b from-muted/50 to-muted">
      <div className="container mx-auto px-4 py-10">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
              </div>
              <p className="text-sm font-medium text-muted-foreground/80">
                {t('footer.slogan')}
              </p>
            </div>
            <p className="text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.usefulLinks')}</h4>
            <div className="space-y-3 text-muted-foreground">
              <Link to="/how-it-works" className="block hover:text-foreground transition-colors text-sm">
                {t('footer.howItWorks')}
              </Link>
              <Link to="/faq" className="block hover:text-foreground transition-colors text-sm">
                {t('footer.faq')}
              </Link>
              <Link to="/pricing" className="block hover:text-foreground transition-colors text-sm">
                {t('footer.pricing')}
              </Link>
              <Link to="/privacy-policy" className="block hover:text-foreground transition-colors text-sm">
                {t('footer.privacy')}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.contactUs')}</h4>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">support@diviso.app</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+966 50 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{t('footer.location')}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>© 2025 <BrandedDiviso />. {t('footer.allRights')}</p>
            <span className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">
              v{new Date().toISOString().slice(0, 16).replace('T', '-')}
            </span>
          </div>
          
          {/* Social Media */}
          <div className="flex items-center gap-3">
            <span className="text-sm">{t('footer.followUs')}</span>
            <div className="flex items-center gap-2">
              <a 
                href="https://www.facebook.com/profile.php?id=61579811247949" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.linkedin.com/company/110384116" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@diviso.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
              <a 
                href="https://www.youtube.com/channel/UCBQ1ZXCcm14IB2WGFO8T4Tw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};