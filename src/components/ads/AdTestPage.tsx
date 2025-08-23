import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimplifiedAdManager } from './SimplifiedAdManager';
import { SmartAdManager } from './SmartAdManager';
import { SmartAdSidebar } from './SmartAdSidebar';
import { SimpleAdBanner } from './SimpleAdBanner';
import { FallbackAds } from './FallbackAds';
import { DebugAdPanel } from './DebugAdPanel';

export const AdTestPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>🎯 نظام الإعلانات - صفحة الاختبار</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            هذه الصفحة لاختبار جميع أنواع الإعلانات والتأكد من عملها بشكل صحيح
          </p>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <DebugAdPanel />

      {/* Simplified Ad Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Simplified Ad Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <SimplifiedAdManager 
            placement="test_page_simplified" 
            showDebug={true}
          />
        </CardContent>
      </Card>

      {/* Simple Ad Banner */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Ad Banner</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleAdBanner />
        </CardContent>
      </Card>

      {/* Fallback Ads */}
      <Card>
        <CardHeader>
          <CardTitle>Fallback Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FallbackAds placement="test_1" />
            <FallbackAds placement="test_2" />
            <FallbackAds placement="test_3" />
          </div>
        </CardContent>
      </Card>

      {/* Smart Ad Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Ad Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartAdManager
            context={{ type: 'dashboard' }}
            placement="test_smart_manager"
          />
        </CardContent>
      </Card>

      {/* Smart Ad Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Ad Sidebar</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartAdSidebar />
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>أدوات التحكم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            إعادة تحميل الصفحة
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              localStorage.clear();
              console.log('🧹 Cleared all localStorage data');
            }}
            className="w-full"
          >
            مسح بيانات التخزين المحلي
          </Button>

          <Button 
            variant="outline"
            onClick={() => {
              console.log('🎯 Current ad state:', {
                localStorage: localStorage.getItem('userSessions'),
                userBehavior: localStorage.getItem('userActions'),
                sessionStorage: sessionStorage
              });
            }}
            className="w-full"
          >
            عرض حالة الإعلانات في Console
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdTestPage;