import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, MapPin, User } from 'lucide-react-native';
import { mockChildren } from '@/data/mockData';

interface Event {
  id: string;
  title: string;
  start_ts: string;
  end_ts: string;
  location?: string;
  child_id?: string;
  prep_items?: string[];
  status: string;
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const child = event.child_id ? mockChildren.find(c => c.id === event.child_id) : null;
  const startDate = new Date(event.start_ts);
  const endDate = new Date(event.end_ts);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Date and Time */}
        <View style={styles.infoRow}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            {formatDate(startDate)} at {formatTime(startDate)}
            {endDate && endDate.getTime() !== startDate.getTime() && 
              ` - ${formatTime(endDate)}`
            }
          </Text>
        </View>

        {/* Location */}
        {event.location && (
          <View style={styles.infoRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
          </View>
        )}

        {/* Child */}
        {child && (
          <View style={styles.infoRow}>
            <View style={[styles.childIndicator, { backgroundColor: child.colour_hex }]} />
            <Text style={styles.infoText}>{child.name}</Text>
            {child.school_name && (
              <Text style={styles.schoolText}>• {child.school_name}</Text>
            )}
          </View>
        )}

        {/* Prep Items */}
        {event.prep_items && event.prep_items.length > 0 && (
          <View style={styles.prepItems}>
            <Text style={styles.prepTitle}>Prep needed:</Text>
            <Text style={styles.prepText} numberOfLines={2}>
              {event.prep_items.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  childIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  schoolText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  prepItems: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prepTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  prepText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
});