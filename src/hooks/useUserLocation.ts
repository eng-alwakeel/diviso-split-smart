import { useState, useEffect, useCallback } from "react";
import { getCurrentLocation, LocationCoords } from "@/lib/native";
import { supabase } from "@/integrations/supabase/client";

interface UserLocationState {
  city: string | null;
  coords: LocationCoords | null;
  loading: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

const LOCATION_STORAGE_KEY = "diviso_user_location";
const LOCATION_ASKED_KEY = "diviso_location_asked";

// Fallback city based on Saudi Arabia (most users)
const DEFAULT_CITY = "Riyadh";

// Reverse geocoding using a free API
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Extract city name from response
    const city = data.address?.city || 
                 data.address?.town || 
                 data.address?.municipality ||
                 data.address?.state ||
                 data.address?.county;
    
    return city || null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    city: null,
    coords: null,
    loading: false,
    hasPermission: null,
    error: null,
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
          coords: parsed.coords,
          hasPermission: true,
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
      const city = await reverseGeocode(coords.latitude, coords.longitude);
      const finalCity = city || DEFAULT_CITY;

      // Save to localStorage
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
        city: finalCity,
        coords,
        timestamp: Date.now(),
      }));
      localStorage.setItem(LOCATION_ASKED_KEY, "granted");

      // Save to database
      await saveLocationToDb(finalCity, coords);

      setState({
        city: finalCity,
        coords,
        loading: false,
        hasPermission: true,
        error: null,
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
    if (state.hasPermission) {
      await requestLocation();
    }
  }, [state.hasPermission, requestLocation]);

  return {
    city: state.city || DEFAULT_CITY,
    coords: state.coords,
    loading: state.loading,
    hasPermission: state.hasPermission,
    error: state.error,
    requestLocation,
    dismissLocationRequest,
    shouldShowLocationPrompt,
    refreshLocation,
    defaultCity: DEFAULT_CITY,
  };
}
