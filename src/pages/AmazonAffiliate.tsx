import { AmazonSaudiManager } from '@/components/ads/AmazonSaudiManager';
import { useTranslation } from 'react-i18next';

const AmazonAffiliatePage = () => {
  const { t } = useTranslation('common');

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('amazon_affiliate.title')}</h1>
        <p className="text-muted-foreground">
          {t('amazon_affiliate.description')}
        </p>
      </div>
      
      <AmazonSaudiManager />
    </div>
  );
};

export default AmazonAffiliatePage;
