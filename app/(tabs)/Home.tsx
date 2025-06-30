import React, { useState } from 'react';
import { EventCard } from '../components/EventCard';
import { FilterBar } from '../components/FilterBar';
import { useEvents } from '../hooks/useEvents';
import { useChildren } from '../hooks/useChildren';
import { useAuth } from '../hooks/useAuth';
import type { FilterState } from '../types';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    child: null,
    eventType: null,
    status: null,
  });

  const { events, loading, error } = useEvents(filters);
  const { children } = useChildren();

  const upcomingEvents = events.filter(event => 
    new Date(event.event_date) >= new Date() && event.status === 'active'
  );

  const todayEvents = events.filter(event => {
    const today = new Date().toDateString();
    return new Date(event.event_date).toDateString() === today && event.status === 'active';
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-earth-200 h-36 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="zen-card p-6 border-stone-300">
          <p className="text-stone-800">Error loading events: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        users={user ? [user] : []}
        children={children}
      />

      <div className="p-6 space-y-8">
        {todayEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
              <span className="text-2xl mr-3">🌅</span>
              Today's Events
            </h2>
            <div className="space-y-4">
              {todayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-earth-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">📅</span>
            {todayEvents.length > 0 ? 'Upcoming Events' : 'All Events'}
          </h2>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-sage-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🌿</span>
              </div>
              <h3 className="text-xl font-semibold text-earth-800 mb-3">All peaceful here</h3>
              <p className="text-earth-600 mb-6 max-w-sm mx-auto leading-relaxed">
                No events scheduled. Take a moment to breathe and plan your next family adventure.
              </p>
              <button className="zen-button">
                Add Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};