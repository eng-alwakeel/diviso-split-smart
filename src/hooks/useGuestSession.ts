import { useContext } from 'react';
import { GuestSessionContext } from '@/contexts/GuestSessionContext';

export const useGuestSession = () => {
  const context = useContext(GuestSessionContext);
  
  if (!context) {
    throw new Error('useGuestSession must be used within a GuestSessionProvider');
  }
  
  return context;
};
