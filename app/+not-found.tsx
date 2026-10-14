import { Link, Stack } from 'expo-router'
import { View, Text } from 'react-native'
import { FLX } from '@/lib/theme'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ikke fundet' }} />
      <View style={{ flex: 1, backgroundColor: FLX.green, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Siden findes ikke.</Text>
        <Link href="/">
          <Text style={{ color: FLX.gold, fontSize: 15 }}>Gå til forsiden</Text>
        </Link>
      </View>
    </>
  )
}
