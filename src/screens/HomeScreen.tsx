import React from 'react';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import MangaPreview from '../components/MangaPreview';
import { Text, View, SafeAreaView } from '../components/Themed';
import useMangaDexSearch, { DefaultMangaSearch } from '../hooks/useMangaSearch';
import { useValueThrottle } from '../hooks/useValueThrottle';
import { BaseStackParamList, BaseStackScreenProps } from '../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function HomeScreen({ navigation }: BaseStackScreenProps<'Root'>) {

  const { width, height } = useWindowDimensions();

  const scale = width / 400;

  const [itemWidth, setItemWidth] = useState(200)
  if (width < itemWidth * 2) {
    setItemWidth(width / 2);
  }


  const rows = Math.max(Math.floor(width / itemWidth), 1);

  const columns = Math.max(Math.floor(height / itemWidth * 0.65), 1) + 2;

  const initiaLimit = useRef(rows * columns);

  const defaultSearch = { ...DefaultMangaSearch };

  const latestSearch = useRef(defaultSearch);

  const [results, makeSearch] = useMangaDexSearch(latestSearch.current);

  const [isRefreshing, SetIsRefreshing] = useState(false);

  function onSearchCommited(search: string) {
    latestSearch.current = { ...defaultSearch, "s": search };
    makeSearch(latestSearch.current)
  }

  const updateSearch = useValueThrottle<string>(500, onSearchCommited, '');

  async function onReloadResults() {
    SetIsRefreshing(true);
    await makeSearch({ ...defaultSearch, q: latestSearch.current.s });
    latestSearch.current = { ...defaultSearch, s: latestSearch.current.s };
    SetIsRefreshing(false);
  }



  const navigate = useCallback((route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => {
    navigation.navigate(route, params)
  }, [])
  return (
    <SafeAreaView style={styles.container} level={'level0'}>
      <View
        style={[styles.searchContainer, { marginHorizontal: (Math.min(itemWidth, 200) / 200) * 5 }]
        }>
        <TextInput style={styles.searchBar} onChangeText={updateSearch} placeholder={`What's Your Poison ?`} placeholderTextColor={'white'} />
      </View>
      <FlatList

        style={{ ...styles.items_y, width: rows * itemWidth }}
        key={rows + itemWidth}
        numColumns={rows}
        columnWrapperStyle={{ ...styles.items_x, width: rows * itemWidth }}
        data={results}
        renderItem={({ item, index }) => <MangaPreview data={item} key={item.id} navigate={navigate} width={itemWidth} />}
        onRefresh={onReloadResults}
        refreshing={isRefreshing}

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
