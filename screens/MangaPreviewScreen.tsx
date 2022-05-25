import { useCallback, useEffect } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Image } from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import FlexGridView from '../components/FlexGridView';
import MangaPreview from '../components/MangaPreview';
import { Text, View } from '../components/Themed';
import useMangaDexSearch from '../hooks/useMangaDexSearch';

export default function MangaPreviewScreen({ navigation, route }: MainStackProps) {



  const mangaData = route.params?.manga;

  console.log(mangaData?.id)
  const coverUrl = mangaData?.relationships.filter(r => r.type === 'cover_art')[0]?.attributes?.fileName;

  const description = mangaData?.attributes.description ? mangaData?.attributes.description['en'] : "No Description";

  const navigate = useCallback((route: keyof MainStackParamList, params: MainStackParamList[keyof MainStackParamList]) => {
    navigation.navigate(route, params)
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} >
        <Image style={styles.img} source={{ uri: coverUrl ? `https://uploads.mangadex.org/covers/${mangaData.id}/${coverUrl}` : "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fvector%2Fblack-blueprint-background-vector-illustration-gm543213826-97441037&psig=AOvVaw36KNugoF-gq8jV4XCZ59m6&ust=1653537486338000&source=images&cd=vfe&ved=0CAwQjRxqFwoTCKi_qKbh-fcCFQAAAAAdAAAAABAD" }} />
        <Text style={styles.heading}>Summary</Text>
        <Text>{description}</Text>
        <Text style={styles.heading}>Chapters</Text>
      </ScrollView>
    </View>

  );

}

const width = Dimensions.get('window').width * 0.8;
const height = 230;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20
  },
  scroll: {
    flex: 1,
    width: width
  },
  img: {
    flex: 1,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 15
  },
  text: {

  }
});
