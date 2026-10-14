import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FLX } from '@/lib/theme'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={24}
      color={focused ? FLX.gold : FLX.mistDim}
    />
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: FLX.green,
          borderTopColor: FLX.line,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Barlow_600SemiBold',
          fontWeight: 'normal',
          marginBottom: 4,
        },
        tabBarActiveTintColor: FLX.gold,
        tabBarInactiveTintColor: FLX.mistDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hjem',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Kort',
          tabBarIcon: ({ focused }) => <TabIcon name="card" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Klubber',
          tabBarIcon: ({ focused }) => <TabIcon name="golf" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Præstationer',
          tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Konto',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
