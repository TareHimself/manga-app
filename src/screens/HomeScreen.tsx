import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import MangaPreview from '../components/MangaPreview';
import { SafeAreaView, View } from '../components/Themed';
import useMangaDexSearch from '../hooks/useMangaSearch';
import useSourceChange from '../hooks/useSourceChange';
import useThrottle from '../hooks/useThrottle';
import { useAppSelector } from '../redux/hooks';
import { BaseStackParamList, BaseStackScreenProps } from '../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function HomeScreen({ navigation }: BaseStackScreenProps<'Root'>) {

  const { width, height } = useWindowDimensions();

  const scale = width / 400;

  const [itemWidth, setItemWidth] = useState(200)

  if (width < itemWidth * 2) {
    setItemWidth(width / 2);
  }

  const source = useAppSelector((state) => state.source.source)

  const [isSearching, setIsSearching] = useState(false);

  const rows = Math.max(Math.floor(width / itemWidth), 1);

  const currentSourceName = useAppSelector(s => s.source.source.name)

  const latestSearch = useRef('');

  const onSearchCompleted = useCallback(() => {
    setIsSearching(false);
  }, [isSearching, setIsSearching])

  const [results, makeSearch] = useMangaDexSearch(onSearchCompleted);

  const onSearchCommited = useCallback((search: string) => {
    latestSearch.current = search;
    makeSearch(latestSearch.current, source.id)
    setIsSearching(true)
  }, [latestSearch, makeSearch, source.id]);

  const updateSearch = useThrottle<string>(500, onSearchCommited, '');

  const onRefresh = useCallback(() => {
    setIsSearching(true);
    makeSearch(latestSearch.current, source.id);
  }, [makeSearch, setIsSearching, source.id]);

  const navigate = useCallback((route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => {
    navigation.navigate(route, params)
  }, [navigation])

  const textInputRef = useRef<TextInput | null>()


  const onSourceChanged = useCallback((last, current) => {
    if (textInputRef.current) {
      textInputRef.current.clear();
      onSearchCommited('');
    }
  }, [textInputRef, onSearchCommited])
  useSourceChange(onSourceChanged)

  if (!isSearching && results.length === 0 && latestSearch.current === '') {
    onSearchCommited('')
  }

  return (
    <SafeAreaView style={styles.container} level={'level0'}>
      <View
        style={[styles.searchContainer, { marginHorizontal: (Math.min(itemWidth, 200) / 200) * 5 }]
        }>
        <TextInput ref={(r) => { textInputRef.current = r }} style={styles.searchBar} onChangeText={updateSearch} placeholder={`Search ${currentSourceName}`} placeholderTextColor={'white'} />
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
