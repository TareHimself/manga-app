/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName } from 'react-native';
import { RootSiblingParent } from 'react-native-root-siblings';
import { Provider } from 'react-redux';
import useColorScheme from '../hooks/useColorScheme';
import { store } from '../redux/store';
import BookmarksScreen from '../screens/BookmarksScreen';
import HomeScreen from '../screens/HomeScreen';
import MangaPreviewScreen from '../screens/MangaPreviewScreen';
import ReadMangaModalScreen from '../screens/ReadMangaModalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BaseStackParamList, RootTabParamList } from '../types';
export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {

  return (
    <Provider store={store}>
      <NavigationContainer
        theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <RootSiblingParent>
          <RootNavigator />
        </RootSiblingParent>
      </NavigationContainer>
    </Provider>


  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const RootTab = createBottomTabNavigator<RootTabParamList>();

function RootNavigator() {

  return (
    <RootTab.Navigator screenOptions={{ tabBarActiveTintColor: 'white', tabBarInactiveTintColor: 'grey' }}>
      <RootTab.Screen name="Discover" component={SearchNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="search1" size={size} color={color} />
          ),
        }} />
      <RootTab.Screen name="Bookmarks" component={BookmarksNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="bookmark" size={size} color={color} />
          ),
        }} />
      <RootTab.Screen name="Settings" component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" size={size} color={color} />
          ),
        }} />
    </RootTab.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */

const SearchStack = createNativeStackNavigator<BaseStackParamList>();

const BookmarksStack = createNativeStackNavigator<BaseStackParamList>();

function SearchNavigator() {
  const colorScheme = useColorScheme();

  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Group>
        <SearchStack.Screen name="Root" component={HomeScreen} options={{ headerShown: false }} />
        <SearchStack.Screen name="MangaPreview" component={MangaPreviewScreen} options={{ headerShown: false }} initialParams={undefined} />
      </SearchStack.Group>
      <SearchStack.Group screenOptions={{ presentation: 'fullScreenModal', headerShown: false }} >
        <SearchStack.Screen name="ReadMangaModal" component={ReadMangaModalScreen} />
      </SearchStack.Group>
    </SearchStack.Navigator >
  );
}

function BookmarksNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BookmarksStack.Navigator screenOptions={{ headerShown: false }}>
      <BookmarksStack.Group>
        <BookmarksStack.Screen name="Root" component={BookmarksScreen} options={{ headerShown: false }} />
        <BookmarksStack.Screen name="MangaPreview" component={MangaPreviewScreen} options={{ headerShown: false }} initialParams={undefined} />
      </BookmarksStack.Group>
      <BookmarksStack.Group screenOptions={{ presentation: 'fullScreenModal', headerShown: false }} >
        <BookmarksStack.Screen name="ReadMangaModal" component={ReadMangaModalScreen} />
      </BookmarksStack.Group>
    </BookmarksStack.Navigator >
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
