import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const UserPointsBadge: React.FC = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setPoints(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    const fetchPoints = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('points')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setPoints(data?.points || 0);
      } catch (err) {
        console.error('Error fetching points:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();

    // Subscribe to changes
    const channel = supabase
      .channel('user_points_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setPoints(payload.new.points);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || loading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full shadow-sm">
      <div className="p-1 bg-amber-100 rounded-full">
        <Trophy className="w-3.5 h-3.5 text-amber-600" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">Points</span>
        <span className="text-sm font-bold text-amber-900">{points?.toLocaleString()}</span>
      </div>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
    </div>
  );
};
