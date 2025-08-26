import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const RateLimitTester = () => {
  const [attempts, setAttempts] = React.useState(0);
  const [rateLimited, setRateLimited] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const generateSessionId = (): string => {
    const stored = localStorage.getItem('shotgun_session_id');
    if (stored) {
      return stored;
    }
    
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

  const testRateLimit = async () => {
    setLoading(true);
    try {
      const sessionId = generateSessionId();
      
      const { data, error } = await supabase.functions.invoke('check-spin-rate-limit', {
        body: { session_id: sessionId }
      });

      console.log('Rate limit test result:', { data, error });

      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }

      if (data?.rateLimited) {
        setRateLimited(true);
        setMessage(data.message);
      } else {
        setAttempts(data?.totalAttempts || 0);
        setMessage(`✅ Rate limit check passed. Total attempts: ${data?.totalAttempts || 0}. Remaining: ${data?.attemptsRemaining || 'unknown'}`);
        setRateLimited(false);
      }
    } catch (err) {
      console.error('Rate limit test error:', err);
      setMessage(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    localStorage.removeItem('shotgun_session_id');
    setAttempts(0);
    setRateLimited(false);
    setMessage('Session reset. You can test again.');
  };

  return (
    <Card className="p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Rate Limit Tester</h3>
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Current session ID: {localStorage.getItem('shotgun_session_id')?.substring(0, 8)}...
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={testRateLimit} 
            disabled={loading}
            variant={rateLimited ? "destructive" : "default"}
          >
            {loading ? 'Testing...' : 'Test Rate Limit'}
          </Button>
          <Button onClick={resetSession} variant="outline">
            Reset Session
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded text-sm ${
            rateLimited ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 Try clicking "Test Rate Limit" 6+ times quickly to trigger the rate limit
        </div>
      </div>
    </Card>
  );
};