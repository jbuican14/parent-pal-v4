import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Baby, School, Calendar } from 'lucide-react-native';
import { mockChildren, mockEvents } from '@/data/mockData';
import ChildCard from '@/components/ChildCard';

export default function Children() {
  const getChildEventCount = (childId: string) => {
    return mockEvents.filter(event => event.child_id === childId).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Children</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Children List */}
      <ScrollView style={styles.childrenList} showsVerticalScrollIndicator={false}>
        {mockChildren.length > 0 ? (
          mockChildren.map((child) => (
            <ChildCard 
              key={child.id} 
              child={child} 
              eventCount={getChildEventCount(child.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Baby size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No children added yet</Text>
            <Text style={styles.emptySubtext}>Add your first child to get started</Text>
            <TouchableOpacity style={styles.addFirstButton}>
              <Text style={styles.addFirstButtonText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childrenList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
});