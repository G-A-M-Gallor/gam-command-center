"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type LangKey = "he" | "en" | "ru";

export interface TeamMemberStatus {
  id: string;
  name: string;
  role: Record<LangKey, string>;
  status: "online" | "busy" | "away" | "offline";
  activity?: Record<LangKey, string>;
  lastSeen?: Date;
}

interface PresenceState {
  user_id: string;
  name: string;
  role: Record<LangKey, string>;
  status: "online" | "busy" | "away";
  activity?: Record<LangKey, string>;
  online_at: string;
}

// Demo data as fallback
const DEMO_TEAM: TeamMemberStatus[] = [
  { id: "1", name: "גל", role: { he: "מנהל פרויקטים", en: "Project Manager", ru: "Менеджер проектов" }, status: "online", activity: { he: "עובד על vBrain.io", en: "Working on vBrain.io", ru: "Работает над vBrain.io" } },
  { id: "2", name: "חני", role: { he: "מנהלת תפעול", en: "Operations Manager", ru: "Операционный менеджер" }, status: "online", activity: { he: "סקירת לקוחות", en: "Client review", ru: "Обзор клиентов" } },
  { id: "3", name: "יואב", role: { he: "מפתח", en: "Developer", ru: "Разработчик" }, status: "busy", activity: { he: "פגישה", en: "In a meeting", ru: "На встрече" } },
  { id: "4", name: "נועה", role: { he: "עיצוב", en: "Design", ru: "Дизайн" }, status: "away" },
  { id: "5", name: "רון", role: { he: "מכירות", en: "Sales", ru: "Продажи" }, status: "offline" },
];

export function useTeamPresence() {
  const [team, setTeam] = useState<TeamMemberStatus[]>(DEMO_TEAM);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const updateStatus = useCallback(async (status: "online" | "busy" | "away", activity?: Record<LangKey, string>) => {
    if (!user || !isConnected) return;

    const supabase = createClient();
    const channel = supabase.channel('team-presence');

    try {
      await channel.track({
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        role: { he: "משתמש", en: "User", ru: "Пользователь" },
        status,
        activity,
        online_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to update presence status:', err);
    }
  }, [user, isConnected]);

  useEffect(() => {
    if (!user) {
      setTeam(DEMO_TEAM);
      return;
    }

    const supabase = createClient();
    let channel: any;

    const setupPresence = async () => {
      try {
        channel = supabase
          .channel('team-presence', {
            config: {
              presence: {
                key: user.id,
              },
            },
          })
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const presenceUsers: TeamMemberStatus[] = [];

            // Convert presence state to team members
            for (const userId in state) {
              const presences = state[userId];
              if (presences?.length > 0) {
                const presence = presences[0] as PresenceState;
                presenceUsers.push({
                  id: presence.user_id,
                  name: presence.name,
                  role: presence.role,
                  status: presence.status,
                  activity: presence.activity,
                  lastSeen: new Date(presence.online_at),
                });
              }
            }

            // If we have real presence data, use it; otherwise fall back to demo
            if (presenceUsers.length > 0) {
              setTeam(presenceUsers);
              setIsConnected(true);
            } else {
              setTeam(DEMO_TEAM);
            }
            setError(null);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('User joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('User left:', key, leftPresences);
          });

        const { error: subscribeError } = await channel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Track current user presence
            await channel.track({
              user_id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
              role: { he: "משתמש", en: "User", ru: "Пользователь" },
              status: 'online' as const,
              activity: { he: "פעיל במערכת", en: "Active in system", ru: "Активен в системе" },
              online_at: new Date().toISOString(),
            });
            setIsConnected(true);
          }
        });

        if (subscribeError) {
          throw subscribeError;
        }
      } catch (err) {
        console.warn('Failed to setup team presence:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect');
        setTeam(DEMO_TEAM);
        setIsConnected(false);
      }
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user]);

  // Auto-update status to away after 5 minutes of inactivity
  useEffect(() => {
    if (!isConnected) return;

    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        updateStatus('away', { he: "לא פעיל", en: "Inactive", ru: "Неактивен" });
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (isConnected) {
        updateStatus('online', { he: "פעיל במערכת", en: "Active in system", ru: "Активен в системе" });
      }
      resetTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isConnected, updateStatus]);

  return {
    team,
    isConnected,
    error,
    updateStatus,
  };
}