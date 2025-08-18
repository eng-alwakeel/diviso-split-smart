import { AmazonSaudiManager } from '@/components/ads/AmazonSaudiManager';

const AmazonAffiliatePage = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">إدارة Amazon Affiliate</h1>
        <p className="text-muted-foreground">
          مزامنة وإدارة منتجات Amazon.sa للإعلانات التابعة
        </p>
      </div>
      
      <AmazonSaudiManager />
    </div>
  );
};

export default AmazonAffiliatePage;