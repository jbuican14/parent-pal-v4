import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailDigest, setEmailDigest] = React.useState(false);

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} color="#6B7280" />,
          title: 'Profile',
          subtitle: 'Manage your account details',
          onPress: () => {},
          showArrow: true,
        },
        {
          icon: <Bell size={20} color="#6B7280" />,
          title: 'Notifications',
          subtitle: 'Push notifications for events',
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          ),
        },
        {
          icon: <Bell size={20} color="#6B7280" />,
          title: 'Email Digest',
          subtitle: 'Daily summary of upcoming events',
          onPress: () => setEmailDigest(!emailDigest),
          rightElement: (
            <Switch
              value={emailDigest}
              onValueChange={setEmailDigest}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={emailDigest ? '#FFFFFF' : '#FFFFFF'}
            />
          ),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <Shield size={20} color="#6B7280" />,
          title: 'Privacy Policy',
          subtitle: 'How we protect your data',
          onPress: () => {},
          showArrow: true,
        },
        {
          icon: <HelpCircle size={20} color="#6B7280" />,
          title: 'Help & Support',
          subtitle: 'Get help with ParentPal',
          onPress: () => {},
          showArrow: true,
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          icon: <LogOut size={20} color="#EF4444" />,
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          onPress: () => {},
          titleColor: '#EF4444',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupItems}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === group.items.length - 1 && styles.settingItemLast
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingItemLeft}>
                    {item.icon}
                    <View style={styles.settingItemText}>
                      <Text style={[
                        styles.settingItemTitle,
                        item.titleColor && { color: item.titleColor }
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.settingItemRight}>
                    {item.rightElement || (item.showArrow && (
                      <ChevronRight size={16} color="#9CA3AF" />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.appVersion}>
          <Text style={styles.appVersionText}>ParentPal v1.0.0</Text>
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  settingsGroup: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  groupItems: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  settingItemSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  appVersion: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 20,
  },
});