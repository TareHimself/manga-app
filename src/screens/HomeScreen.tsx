import React, { useEffect } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import WebView from 'react-native-webview';
import MangaPreview from '../components/MangaPreview';
import { View, SafeAreaView } from '../components/Themed';
import useMangaDexSearch, { DefaultMangaSearch } from '../hooks/useMangaSearch';
import useSourceChange from '../hooks/useSourceChange';
import useThrottle from '../hooks/useThrottle';
import { BaseStackParamList, BaseStackScreenProps } from '../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function HomeScreen({ navigation }: BaseStackScreenProps<'Root'>) {

  const { width, height } = useWindowDimensions();

  const scale = width / 400;

  const [itemWidth, setItemWidth] = useState(200)

  if (width < itemWidth * 2) {
    setItemWidth(width / 2);
  }

  const [isSearching, setIsSearching] = useState(false);

  const rows = Math.max(Math.floor(width / itemWidth), 1);

  const columns = Math.max(Math.floor(height / itemWidth * 0.65), 1) + 2;

  const latestSearch = useRef('');

  const onSearchCompleted = useCallback(() => {
    setIsSearching(false);
  }, [isSearching, setIsSearching])

  const [results, makeSearch] = useMangaDexSearch(latestSearch.current, onSearchCompleted);

  const onSearchCommited = useCallback((search: string) => {
    latestSearch.current = search;
    makeSearch(latestSearch.current)
    setIsSearching(true)
  }, [latestSearch, makeSearch]);

  const updateSearch = useThrottle<string>(500, onSearchCommited, '');

  const onRefresh = useCallback(() => {
    setIsSearching(true);
    makeSearch(latestSearch.current);
  }, [makeSearch, setIsSearching]);

  const navigate = useCallback((route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => {
    navigation.navigate(route, params)
  }, [navigation])

  const textInputRef = useRef<TextInput | null>()


  const onSourceChanged = useCallback(() => {
    if (textInputRef.current) {
      textInputRef.current.clear();
      onSearchCommited('');
    }
  }, [textInputRef, onSearchCommited])
  useSourceChange(onSourceChanged)

  return (
    <SafeAreaView style={styles.container} level={'level0'}>
      <View
        style={[styles.searchContainer, { marginHorizontal: (Math.min(itemWidth, 200) / 200) * 5 }]
        }>
        <TextInput ref={(r) => { textInputRef.current = r }} style={styles.searchBar} onChangeText={updateSearch} placeholder={`What's Your Poison ?`} placeholderTextColor={'white'} />
      </View>
      <FlatList

        style={{ ...styles.items_y, width: rows * itemWidth }}
        key={rows + itemWidth}
        numColumns={rows}
        columnWrapperStyle={{ ...styles.items_x, width: rows * itemWidth }}
        data={isSearching ? [] : results}
        renderItem={({ item, index }) => <MangaPreview data={item} key={item.id + item.cover + item.title} navigate={navigate} width={itemWidth} />}
        onRefresh={onRefresh}
        refreshing={isSearching}
        onEndReachedThreshold={0.6}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  items_y: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: 20

  },
  items_x: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  searchBar: {
    width: '100%',
    height: '40%',
    color: 'white',
    borderRadius: 20,
    paddingHorizontal: 10,
    borderColor: 'white',
    borderWidth: 1,
    textAlign: 'center',

  },
  searchContainer: {
    height: 100,
    width: '95%',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
