import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ayos/button';
import { EmptyTab } from '@/components/ayos/empty-tab';

export default function ProfileScreen() {
  return (
    <EmptyTab title="Profile" icon="user" message="Account settings are coming soon.">
      <Button
        label="Sign out"
        variant="secondary"
        size="md"
        onPress={() => router.replace('/')}
        style={styles.signOut}
      />
    </EmptyTab>
  );
}

const styles = StyleSheet.create({
  signOut: { alignSelf: 'stretch', marginTop: 8 },
});
