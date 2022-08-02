import React from 'react';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { compareTwoStrings } from 'string-similarity';
import MangaPreview from '../components/MangaPreview';
import { View, SafeAreaView } from '../components/Themed';
import useBookmarks from '../hooks/useBookmarks';
import { useValueThrottle } from '../hooks/useValueThrottle';
import { BaseStackParamList, BaseStackScreenProps } from '../types';

type SearchFilterProps = { onSearchChanged?: (search: string) => void; }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BookmarksScreen({ navigation, route }: BaseStackScreenProps<'Root'>) {

  const { width, height } = useWindowDimensions();

  const { bookmarks } = useBookmarks();

  const [query, setQuery] = useState('');

  const [itemWidth, setItemWidth] = useState(200)
  if (width < itemWidth * 2) {
    setItemWidth(width / 2);
  }


  const rows = Math.max(Math.floor(width / itemWidth), 1);

  const columns = Math.max(Math.floor(height / itemWidth * 0.65), 1) + 2;

  const [isRefreshing, SetIsRefreshing] = useState(false);

  function onSearchCommited(search: string) {
    setQuery(search);
  }

  const updateSearch = useValueThrottle<string>(150, onSearchCommited, '');

  async function onReloadResults() {
    SetIsRefreshing(true);

    SetIsRefreshing(false);
  }

  const navigate = useCallback((route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => {
    navigation.navigate(route, params)
  }, [])

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (query.trim().length === 0) {
      return true;
    }

    return bookmark.title.toLowerCase().includes(query.toLowerCase().trim());
  }).sort((a, b) => {
    const aRelavance = compareTwoStrings(a.title.toLowerCase().trim(), query.toLowerCase().trim());
    const bRelavance = compareTwoStrings(b.title.toLowerCase().trim(), query.toLowerCase().trim());

    if (aRelavance > bRelavance) return -1;

    if (aRelavance < bRelavance) return 1;

    return 0;
  });

  return (
    <SafeAreaView style={styles.container} level={'level0'}>
      <View
        style={[styles.searchContainer, { marginHorizontal: (Math.min(itemWidth, 200) / 200) * 5 }]
        }>
        <TextInput style={styles.searchBar} onChangeText={updateSearch} placeholder={`Search Your Bookmarks`} placeholderTextColor={'white'} />
      </View>
      <FlatList

        style={{ ...styles.items_y, width: rows * itemWidth }}
        key={rows + itemWidth}
        numColumns={rows}
        columnWrapperStyle={{ ...styles.items_x, width: rows * itemWidth }}
        data={filteredBookmarks}
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
    flexDirection: 'column',
    marginBottom: 20

  },
  items_x: {
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
