import { useCallback } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import FlexGridView from '../components/FlexGridView';
import MangaPreview from '../components/MangaPreview';
import { Text, View } from '../components/Themed';
import useMangaDexSearch from '../hooks/useMangaDexSearch';

export default function HomeScreen({ navigation }: MainStackProps) {

  const [results, makeSearch] = useMangaDexSearch();

  const navigate = useCallback((route: keyof MainStackParamList, params: MainStackParamList[keyof MainStackParamList]) => {
    navigation.navigate(route, params)
  }, [])
  return (
    <View style={styles.container} >
      <FlexGridView
        styleY={styles.items_y}
        styleX={styles.items_x}
        columns={2}
        items={results}
        createElement={element => <MangaPreview data={element} key={element.id} navigate={navigate} />}
      />
    </View>
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
    width: Dimensions.get('window').width * 0.97,
    marginBottom: 20

  },
  items_x: {
    flex: 1,
    flexDirection: 'row',
    width: "100%",
    alignItems: 'flex-start'
  },
});
