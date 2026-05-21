import { Link, Stack } from 'expo-router'
import { View, Text } from 'react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ikke fundet' }} />
      <View style={{ flex: 1, backgroundColor: '#0c0c0c', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Siden findes ikke.</Text>
        <Link href="/">
          <Text style={{ color: '#16a34a', fontSize: 15 }}>Gå til forsiden</Text>
        </Link>
      </View>
    </>
  )
}
