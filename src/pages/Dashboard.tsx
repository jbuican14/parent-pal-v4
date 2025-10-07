import React from 'react';
import { Calendar, Plus, Baby } from 'lucide-react';
import { mockEvents } from '../data/mockData';
import { colors, typography, spacing, borderRadius } from '../tokens/tokens';

export default function Dashboard() {
  const todayEvents = mockEvents.filter(event => {
    const today = new Date();
    const eventDate = new Date(event.start_ts);
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = mockEvents.slice(0, 3);

  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: '#F9FAFB',
      overflowY: 'auto',
      paddingBottom: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px 24px',
      }}>
        <div>
          <h1 style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.textPrimary,
            margin: 0,
          }}>
            Good morning!
          </h1>
          <p style={{
            fontSize: typography.fontSize.md,
            color: colors.textSecondary,
            marginTop: '4px',
          }}>
            Never miss a moment
          </p>
        </div>
        <img
          src="https://images.pexels.com/photos/1526814/pexels-photo-1526814.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
          alt="Profile"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '24px',
          }}
        />
      </div>

      {/* Today's Events */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semiBold,
          color: colors.textPrimary,
          marginBottom: '16px',
        }}>
          Today's Events
        </h2>
        {todayEvents.length > 0 ? (
          todayEvents.map((event) => (
            <div key={event.id} style={{
              backgroundColor: colors.surface,
              padding: spacing.base,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
              border: `1px solid ${colors.border}`,
            }}>
              <h3 style={{ 
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semiBold,
                marginBottom: '8px',
              }}>
                {event.title}
              </h3>
              <p style={{ 
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
              }}>
                {event.location}
              </p>
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 0',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
          }}>
            <Calendar size={48} color="#9CA3AF" />
            <p style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.medium,
              color: colors.textSecondary,
              marginTop: '12px',
            }}>
              No events today
            </p>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.textMuted,
              marginTop: '4px',
            }}>
              Enjoy your free time!
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semiBold,
          color: colors.textPrimary,
          marginBottom: '16px',
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            flex: 1,
            backgroundColor: colors.surface,
            padding: spacing.base,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Plus size={24} color="#8B5CF6" />
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
              Add Event
            </span>
          </button>
          <button style={{
            flex: 1,
            backgroundColor: colors.surface,
            padding: spacing.base,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Baby size={24} color="#3B82F6" />
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
              Add Child
            </span>
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semiBold,
            color: colors.textPrimary,
            margin: 0,
          }}>
            Upcoming Events
          </h2>
          <button style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
          }}>
            See All
          </button>
        </div>
        {upcomingEvents.map((event) => (
          <div key={event.id} style={{
            backgroundColor: colors.surface,
            padding: spacing.base,
            borderRadius: borderRadius.md,
            marginBottom: spacing.md,
            border: `1px solid ${colors.border}`,
          }}>
            <h3 style={{ 
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semiBold,
              marginBottom: '8px',
            }}>
              {event.title}
            </h3>
            <p style={{ 
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
            }}>
              {event.location}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
