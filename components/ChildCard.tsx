import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { School, Calendar, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface Child {
  id: string;
  name: string;
  colour_hex: string;
  school_name?: string;
}

interface ChildCardProps {
  child: Child;
  eventCount: number;
}

export default function ChildCard({ child, eventCount }: ChildCardProps) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.childHeader}>
          <View style={styles.childInfo}>
            <View style={[styles.colorIndicator, { backgroundColor: child.colour_hex }]} />
            <View style={styles.childDetails}>
              <Text style={styles.childName}>{child.name}</Text>
              {child.school_name && (
                <View style={styles.schoolRow}>
                  <School size={14} color="#6B7280" />
                  <Text style={styles.schoolName}>{child.school_name}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MoreHorizontal size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Calendar size={16} color="#8B5CF6" />
            <Text style={styles.statValue}>{eventCount}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </View>
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
  },
  cardContent: {
    padding: 16,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  childDetails: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  schoolName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 6,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
});