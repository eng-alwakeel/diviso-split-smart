import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { CityStats } from '@/hooks/useUsersByCity';
import 'leaflet/dist/leaflet.css';

interface UsersLocationMapProps {
  data: CityStats[];
  isLoading?: boolean;
}

// Component to fit bounds when data changes
const FitBounds = ({ data }: { data: CityStats[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (data.length === 0) return;
    
    const validPoints = data.filter(d => d.avg_lat && d.avg_lng);
    if (validPoints.length === 0) {
      // Default to Saudi Arabia center
      map.setView([24.7136, 46.6753], 5);
      return;
    }
    
    const bounds = validPoints.map(d => [d.avg_lat!, d.avg_lng!] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
  }, [data, map]);
  
  return null;
};

// Calculate radius based on user count
const getRadius = (count: number, maxCount: number): number => {
  const minRadius = 15;
  const maxRadius = 50;
  const ratio = count / maxCount;
  return minRadius + (maxRadius - minRadius) * ratio;
};

// Get color based on user count density
const getColor = (count: number, maxCount: number): string => {
  const ratio = count / maxCount;
  if (ratio > 0.7) return '#22c55e'; // green
  if (ratio > 0.4) return '#eab308'; // yellow
  if (ratio > 0.2) return '#3b82f6'; // blue
  return '#6366f1'; // indigo
};

export const UsersLocationMap = ({ data, isLoading }: UsersLocationMapProps) => {
  // Filter valid data points (with location)
  const validData = data.filter(d => d.avg_lat && d.avg_lng);
  const usersWithLocation = validData.reduce((sum, d) => sum + d.user_count, 0);
  
  // Users without location
  const usersWithoutLocation = data
    .filter(d => !d.avg_lat || !d.avg_lng)
    .reduce((sum, d) => sum + d.user_count, 0);
  
  const totalUsers = usersWithLocation + usersWithoutLocation;
  const maxCount = Math.max(...validData.map(d => d.user_count), 1);
  
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            توزيع المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-white/5 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-white/40">جاري تحميل الخريطة...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          توزيع المستخدمين حسب المدن
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm mt-2">
          <span className="text-white/80">
            الإجمالي: <strong className="text-primary">{totalUsers.toLocaleString('ar-SA')}</strong>
          </span>
          <span className="text-emerald-400">
            مع موقع: <strong>{usersWithLocation.toLocaleString('ar-SA')}</strong>
          </span>
          <span className="text-white/50">
            بدون موقع: <strong>{usersWithoutLocation.toLocaleString('ar-SA')}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-lg overflow-hidden border border-white/10">
          {validData.length > 0 ? (
            <MapContainer
              center={[24.7136, 46.6753]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <FitBounds data={validData} />
              {validData.map((city) => (
                <CircleMarker
                  key={city.city}
                  center={[city.avg_lat!, city.avg_lng!]}
                  radius={getRadius(city.user_count, maxCount)}
                  pathOptions={{
                    color: getColor(city.user_count, maxCount),
                    fillColor: getColor(city.user_count, maxCount),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="text-center p-2">
                      <h3 className="font-bold text-lg">{city.city}</h3>
                      <p className="text-2xl font-bold text-primary">
                        {city.user_count.toLocaleString('ar-SA')}
                      </p>
                      <p className="text-sm text-muted-foreground">مستخدم</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-white/5">
              <div className="text-center text-white/60">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>لا توجد بيانات موقع متاحة</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span>كثافة عالية</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span>كثافة متوسطة</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-sky-500"></div>
            <span>كثافة منخفضة</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500"></div>
            <span>كثافة قليلة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
