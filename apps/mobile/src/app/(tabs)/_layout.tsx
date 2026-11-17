import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ayos/tab-bar';
import { colors } from '@/constants/design';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="map" />
      <Tabs.Screen name="my-reports" />
      <Tabs.Screen name="updates" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
