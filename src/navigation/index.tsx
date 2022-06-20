/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName } from 'react-native';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import NotFoundScreen from '../screens/NotFoundScreen';
import HomeScreen from '../screens/HomeScreen';
import MangaPreviewScreen from '../screens/MangaPreviewScreen';
import { RootStackParamList, MainStackParamList } from '../types';
import ReadMangaModalScreen from '../screens/ReadMangaModalScreen';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  return (
    <NavigationContainer
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Main" component={MainNaivator} options={{ headerShown: false }} />
      <RootStack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
    </RootStack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */

const MainStack = createNativeStackNavigator<MainStackParamList>();

function MainNaivator() {
  const colorScheme = useColorScheme();


  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Group>
        <MainStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <MainStack.Screen name="MangaPreview" component={MangaPreviewScreen} options={{ headerShown: false }} initialParams={undefined} />
      </MainStack.Group>
      <MainStack.Group screenOptions={{ presentation: 'fullScreenModal', headerShown: false }} >
        <MainStack.Screen name="ReadMangaModal" component={ReadMangaModalScreen} />
      </MainStack.Group>
    </MainStack.Navigator >
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
