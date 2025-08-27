import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Eye } from 'lucide-react';

interface AnalyticsData {
  total_sessions: number;
  total_visits: number;
  recent_sessions: number;
}

export const VisitAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Call the secure analytics function
        const { data, error } = await supabase.functions.invoke('get-visitor-analytics');

        if (error) {
          console.error('Failed to fetch analytics:', error);
        } else if (data) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Unique Sessions</p>
            <p className="text-2xl font-bold">{analytics?.total_sessions || 0}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Eye className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Total Visits</p>
            <p className="text-2xl font-bold">{analytics?.total_visits || 0}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Recent (24h)</p>
            <p className="text-2xl font-bold">{analytics?.recent_sessions || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};