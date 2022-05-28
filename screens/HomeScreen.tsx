import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, useWindowDimensions, VirtualizedList } from 'react-native';
import { } from 'react-native-safe-area-context';

import EditScreenInfo from '../components/EditScreenInfo';
import FlexGridView from '../components/FlexGridView';
import MangaPreview from '../components/MangaPreview';
import { Text, View, SafeAreaView } from '../components/Themed';
import useMangaDexSearch, { DefaultMangaDexSearch } from '../hooks/useMangaDexSearch';
import { MainStackScreenProps, MainStackParamList } from '../types';



export default function HomeScreen({ navigation }: MainStackScreenProps<'Home'>) {

  const { width, height } = useWindowDimensions();

  const scale = width / 400;

  const [itemWidth, setItemWidth] = useState(200)
  if (width < itemWidth * 2) {
    setItemWidth(width / 2);
  }

  console.log(itemWidth * 0.65)

  const rows = Math.max(Math.floor(width / itemWidth), 1);

  const columns = Math.max(Math.floor(height / itemWidth * 0.65), 1) + 2;

  const initiaLimit = useRef(rows * columns);

  const defaultSearch = { ...DefaultMangaDexSearch, limit: `${initiaLimit.current}` };

  const [latestSearch, setLatestSearch] = useState(defaultSearch);

  const [results, makeSearch] = useMangaDexSearch(latestSearch);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const [isRefreshing, SetIsRefreshing] = useState(false);

  async function onReloadResults() {
    console.log('We need to reload results');
    SetIsRefreshing(true);
    console.log(defaultSearch)
    await makeSearch(defaultSearch, true);
    setLatestSearch(defaultSearch);
    SetIsRefreshing(false);
  }

  async function onLoadMoreResults() {

    const lastOffset = isNaN(parseInt(latestSearch.offset, 10)) ? 0 : parseInt(latestSearch.offset, 10);

    const newSearch = { ...latestSearch, "offset": `${lastOffset + (initiaLimit.current)}` };
    console.log(newSearch)
    if (JSON.stringify(latestSearch) !== JSON.stringify(newSearch)) {
      console.log('Loading more results');
      setLatestSearch(newSearch);
      makeSearch(newSearch, false);
    }
    else {
      console.log('ReachedApiLimit');
    }

  }

  const navigate = useCallback((route: keyof MainStackParamList, params: MainStackParamList[keyof MainStackParamList]) => {
    navigation.navigate(route, params)
  }, [])
  return (
    <SafeAreaView style={styles.container} level={'level0'}>
      <FlatList
        style={{ ...styles.items_y, width: rows * itemWidth }}
        key={rows + itemWidth}
        numColumns={rows}
        columnWrapperStyle={{ ...styles.items_x, width: rows * itemWidth }}
        data={results}
        renderItem={({ item }) => <MangaPreview data={item} key={item.id} navigate={navigate} width={itemWidth} />}
        onRefresh={onReloadResults}
        refreshing={isRefreshing}
        onEndReached={onLoadMoreResults}
        onEndReachedThreshold={0.6}

      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
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
});
