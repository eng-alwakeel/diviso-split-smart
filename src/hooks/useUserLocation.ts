import { useState, useEffect, useCallback } from "react";
import { getCurrentLocation, LocationCoords } from "@/lib/native";
import { supabase } from "@/integrations/supabase/client";

interface UserLocationState {
  city: string | null;
  district: string | null;
  coords: LocationCoords | null;
  loading: boolean;
  hasPermission: boolean | null;
  error: string | null;
  timestamp: number | null;
}

interface ReverseGeocodeResult {
  city: string | null;
  district: string | null;
}

const LOCATION_STORAGE_KEY = "diviso_user_location";
const LOCATION_ASKED_KEY = "diviso_location_asked";
const LOCATION_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours - auto-refresh after this

// Fallback city based on Saudi Arabia (most users)
const DEFAULT_CITY = "Riyadh";

// Reverse geocoding using a free API - returns city AND district
async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=en`
    );
    
    if (!response.ok) return { city: null, district: null };
    
    const data = await response.json();
    
    // Extract city name from response
    const city = data.address?.city || 
                 data.address?.town || 
                 data.address?.municipality ||
                 data.address?.state ||
                 data.address?.county;
    
    // Extract district/neighborhood from response
    const district = data.address?.suburb || 
                     data.address?.neighbourhood || 
                     data.address?.quarter ||
                     data.address?.district;
    
    return { city: city || null, district: district || null };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { city: null, district: null };
  }
}

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    city: null,
    district: null,
    coords: null,
    loading: false,
    hasPermission: null,
    error: null,
    timestamp: null,
  });

  // Load saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    const hasAsked = localStorage.getItem(LOCATION_ASKED_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          city: parsed.city,
          district: parsed.district || null,
          coords: parsed.coords,
          hasPermission: true,
          timestamp: parsed.timestamp || null,
        }));
      } catch {
        // Invalid saved data
      }
    } else if (hasAsked === "denied") {
      setState(prev => ({
        ...prev,
        hasPermission: false,
        city: DEFAULT_CITY,
      }));
    }
  }, []);

  // Save location to database
  const saveLocationToDb = useCallback(async (city: string, coords: LocationCoords | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_recommendation_settings")
        .upsert({
          user_id: user.id,
          default_city: city,
          last_location_lat: coords?.latitude,
          last_location_lng: coords?.longitude,
          location_updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });
    } catch (error) {
      console.error("Error saving location to DB:", error);
    }
  }, []);

  // Request location permission and get city
  const requestLocation = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const coords = await getCurrentLocation();

      if (!coords) {
        // Permission denied or error
        localStorage.setItem(LOCATION_ASKED_KEY, "denied");
        setState(prev => ({
          ...prev,
          loading: false,
          hasPermission: false,
          city: DEFAULT_CITY,
        }));
        return false;
      }

      // Got coordinates, now reverse geocode
      const { city, district } = await reverseGeocode(coords.latitude, coords.longitude);
      const finalCity = city || DEFAULT_CITY;
      const now = Date.now();

      // Save to localStorage
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
        city: finalCity,
        district,
        coords,
        timestamp: now,
      }));
      localStorage.setItem(LOCATION_ASKED_KEY, "granted");

      // Save to database
      await saveLocationToDb(finalCity, coords);

      setState({
        city: finalCity,
        district,
        coords,
        loading: false,
        hasPermission: true,
        error: null,
        timestamp: now,
      });

      return true;
    } catch (error) {
      console.error("Location request error:", error);
      localStorage.setItem(LOCATION_ASKED_KEY, "denied");
      setState(prev => ({
        ...prev,
        loading: false,
        hasPermission: false,
        city: DEFAULT_CITY,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      return false;
    }
  }, [saveLocationToDb]);

  // Get fresh location with current coordinates (for recommendations)
  const getFreshLocation = useCallback(async (): Promise<{
    city: string;
    district: string | null;
    coords: LocationCoords | null;
  }> => {
    // If user denied permission, return cached/default
    if (state.hasPermission === false) {
      return { city: state.city || DEFAULT_CITY, district: state.district, coords: null };
    }

    try {
      const coords = await getCurrentLocation();
      
      if (!coords) {
        // Can't get location, return cached
        return { city: state.city || DEFAULT_CITY, district: state.district, coords: state.coords };
      }

      // Got coordinates, reverse geocode to get fresh city and district
      const { city: newCity, district: newDistrict } = await reverseGeocode(coords.latitude, coords.longitude);
      const finalCity = newCity || state.city || DEFAULT_CITY;
      const finalDistrict = newDistrict || state.district;
      const now = Date.now();

      // Update state and storage if location changed
      if (newCity && (newCity !== state.city || newDistrict !== state.district)) {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
          city: finalCity,
          district: finalDistrict,
          coords,
          timestamp: now,
        }));

        setState(prev => ({
          ...prev,
          city: finalCity,
          district: finalDistrict,
          coords,
          timestamp: now,
        }));

        // Save to database
        await saveLocationToDb(finalCity, coords);
      }

      return { city: finalCity, district: finalDistrict, coords };
    } catch (error) {
      console.error("getFreshLocation error:", error);
      return { city: state.city || DEFAULT_CITY, district: state.district, coords: state.coords };
    }
  }, [state.city, state.district, state.coords, state.hasPermission, saveLocationToDb]);

  // Check if location is stale
  const isLocationStale = useCallback((): boolean => {
    if (!state.timestamp) return true;
    return Date.now() - state.timestamp > LOCATION_MAX_AGE;
  }, [state.timestamp]);

  // Dismiss location request (user declined)
  const dismissLocationRequest = useCallback(() => {
    localStorage.setItem(LOCATION_ASKED_KEY, "dismissed");
    setState(prev => ({
      ...prev,
      hasPermission: false,
      city: DEFAULT_CITY,
    }));
  }, []);

  // Check if we should show location prompt
  const shouldShowLocationPrompt = useCallback((): boolean => {
    const hasAsked = localStorage.getItem(LOCATION_ASKED_KEY);
    return !hasAsked && state.hasPermission === null;
  }, [state.hasPermission]);

  // Refresh location
  const refreshLocation = useCallback(async () => {
    if (state.hasPermission !== false) {
      await requestLocation();
    }
  }, [state.hasPermission, requestLocation]);

  return {
    city: state.city || DEFAULT_CITY,
    district: state.district,
    coords: state.coords,
    loading: state.loading,
    hasPermission: state.hasPermission,
    error: state.error,
    requestLocation,
    dismissLocationRequest,
    shouldShowLocationPrompt,
    refreshLocation,
    getFreshLocation,
    isLocationStale,
    defaultCity: DEFAULT_CITY,
  };
}
