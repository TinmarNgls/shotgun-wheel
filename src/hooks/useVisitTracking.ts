import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique session identifier
const generateSessionId = (): string => {
  const stored = localStorage.getItem('shotgun_session_id');
  if (stored) {
    return stored;
  }
  
  // Create fingerprint from browser characteristics
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    Math.random().toString(36).substring(2)
  ].join('|');
  
  const sessionId = btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  localStorage.setItem('shotgun_session_id', sessionId);
  return sessionId;
};

export const useVisitTracking = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const sessionId = generateSessionId();
        
        const { data, error } = await supabase.functions.invoke('track-visit', {
          body: {
            session_id: sessionId,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null
          }
        });

        if (error) {
          console.warn('Visit tracking failed:', error);
        } else {
          console.log('Visit tracked successfully');
        }
      } catch (error) {
        console.warn('Visit tracking error:', error);
      }
    };

    // Track visit on page load
    trackVisit();
  }, []);
};