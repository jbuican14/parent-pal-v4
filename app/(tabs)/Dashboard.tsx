import React, { useState, useEffect } from 'react';
import { GmailSyncCard } from '../components/GmailSyncCard';
import { CalendarSyncCard } from '../components/CalendarSyncCard';
import { EventCard } from '../components/EventCard';
import { TaskCard } from '../components/TaskCard';
import { useEvents } from '../hooks/useEvents';
import { useTasks } from '../hooks/useTasks';
import { useChildren } from '../hooks/useChildren';
import { useAuth } from '../hooks/useAuth';
import { useEventImport } from '../hooks/useEventImport';
import { apiCall } from '../lib/api';
import type { FilterState } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { hasImportedEvents } = useEventImport();

  const filters: FilterState = { assignee: null, child: null, eventType: null, status: 'active' };
  const { events } = useEvents(filters);
  const { tasks, toggleTaskStatus } = useTasks(filters);
  const { children } = useChildren();

  useEffect(() => {
    checkSyncStatus();
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const checkSyncStatus = async () => {
    try {
      const response = await apiCall('/integrations/status');

      if (response.ok) {
        const data = await response.json();
        setIsGmailConnected(data.gmail_connected || hasImportedEvents());
        setIsCalendarConnected(data.calendar_connected);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
      // Check if user has imported sample events as fallback
      setIsGmailConnected(hasImportedEvents());
      setIsCalendarConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const response = await apiCall('/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state }),
      });

      if (response.ok) {
        // Refresh sync status
        await checkSyncStatus();
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
    }
  };

  const handleGmailSyncComplete = () => {
    setIsGmailConnected(true);
  };

  const handleCalendarSyncComplete = () => {
    setIsCalendarConnected(true);
  };

  const upcomingEvents = events.slice(0, 3);
  const pendingTasks = tasks.filter(task => task.status === 'pending').slice(0, 3);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-earth-200 h-8 w-48 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-earth-200 h-48 rounded-2xl"></div>
            <div className="bg-earth-200 h-48 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-earth-800 mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-earth-600">
          Let's get your family organized and connected
        </p>
      </div>

      {/* Google Integration Cards - Show if not both connected */}
      {(!isGmailConnected || !isCalendarConnected) && (
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🔗</span>
            Connect Your Google Account
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gmail Sync Card - Show if not connected */}
            {!isGmailConnected && (
              <GmailSyncCard onSyncComplete={handleGmailSyncComplete} />
            )}
            
            {/* Calendar Sync Card - Show if Gmail connected but Calendar not */}
            {isGmailConnected && !isCalendarConnected && (
              <CalendarSyncCard 
                isGmailConnected={isGmailConnected} 
                onSyncComplete={handleCalendarSyncComplete} 
              />
            )}
          </div>
        </section>
      )}

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="zen-card p-6 text-center">
          <div className="text-3xl font-bold text-sage-700 mb-2">{events.length}</div>
          <div className="text-earth-600">Active Events</div>
        </div>
        <div className="zen-card p-6 text-center">
          <div className="text-3xl font-bold text-sage-700 mb-2">{pendingTasks.length}</div>
          <div className="text-earth-600">Pending Tasks</div>
        </div>
        <div className="zen-card p-6 text-center">
          <div className="text-3xl font-bold text-sage-700 mb-2">{children.length}</div>
          <div className="text-earth-600">Children</div>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">📅</span>
            Upcoming Events
          </h2>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">✅</span>
            Pending Tasks
          </h2>
          <div className="space-y-4">
            {pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTaskStatus}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {events.length === 0 && pendingTasks.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🌿</span>
          </div>
          <h3 className="text-xl font-semibold text-earth-800 mb-3">All peaceful here</h3>
          <p className="text-earth-600 mb-6 max-w-sm mx-auto leading-relaxed">
            {isGmailConnected && isCalendarConnected
              ? "Your family life is beautifully organized. Add your first event to get started."
              : "Connect your Google account to start automatically organizing your family events."
            }
          </p>
        </div>
      )}
    </div>
  );
};