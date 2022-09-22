import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView, Text, View, ScrollView, FlatList } from '../components/Themed';
import useMangaChapters from '../hooks/useMangaChapters';
import { BaseStackParamList, BaseStackScreenProps, IMangaChapter, IMangaData, IStoredMangaChapter } from '../types';
import MangaChapterPreviewTouchable from '../components/MangaChapterPreviewTouchable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import useBookmarks from '../hooks/useBookmarks';
import useManga from '../hooks/useManga';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import useSourceChange from '../hooks/useSourceChange';
import useSource from '../hooks/useSource';

function MangaTag({ tag }: { tag: string }) {
  return (
    <View level={'level2'} style={{ borderRadius: 10, margin: 2 }} >
      <Text style={{ padding: 5, fontSize: 10 }}>
        {tag}
      </Text>
    </View>)
}

function ChaptersList({ manga, chapters, navigation }: { manga: IMangaData, chapters: IStoredMangaChapter[]; navigation: NativeStackNavigationProp<BaseStackParamList, "MangaPreview", undefined> }) {

  const { source } = useSource();

  const dispatch = useAppDispatch();

  const downloads = useAppSelector(state => state.chapters.hasPendingAction)

  const onReadChapter = useCallback((chapter: IStoredMangaChapter) => {
    if (manga) {
      navigate('ReadMangaModal', { manga: manga, chapters: chapters, startChapter: chapter });
    }
  }, [manga])

  //useReadChapters(manga.id);

  const navigate = useCallback((route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => {
    navigation.navigate(route, params)
  }, []);
  /*
  */
  return (
    <FlatList
      initialNumToRender={10}
      level={'level1'}
      style={[styles.scroll]}
      contentContainerStyle={{ alignItems: 'stretch' }}
      data={chapters}
      renderItem={({ item, index }) => <MangaChapterPreviewTouchable
        bIsDownloading={downloads.includes(source.id + manga.id + item.id)}
        dispatch={dispatch}
        sourceId={source.id}
        mangaId={manga.id}
        chapterIndex={index}
        chapter={item}
        key={index}
        readChapter={onReadChapter}
        bIsLast={index === chapters.length - 1}
      />}
    />

  )
}

export default function MangaPreviewScreen({ navigation, route }: BaseStackScreenProps<'MangaPreview'>) {

  const { manga: mangaPreview } = route.params;

  const mangaFromApi = useManga(mangaPreview.id);

  const manga = mangaFromApi || { ...mangaPreview, description: 'loading', status: 'loading', tags: [] };

  const { title, cover, description, status, id, tags } = manga;

  const [isOnInfo, setIsOnInfo] = useState(true);

  const { width } = useWindowDimensions();

  const chapters = useMangaChapters(manga.id || '');

  const { IsBookmarked, addBookmark, removeBookmark } = useBookmarks();

  const bIsBookmarked = IsBookmarked(manga.id);

  const onSourceChanged = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  useSourceChange(onSourceChanged)

  return (
    <SafeAreaView style={styles.container} level={'level0'}>

      <View style={[styles.standardContainer, { height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }]} level={'level1'}>
        <TouchableOpacity onPress={() => {
          navigation.goBack();
        }}>
          <Ionicons name="ios-chevron-back-circle-outline" size={30} color="white" />
        </TouchableOpacity>
        {mangaFromApi && <TouchableOpacity onPress={() => {
          if (bIsBookmarked) {
            removeBookmark(mangaPreview.id);
          }
          else {
            addBookmark({ id: manga.id, cover: manga.cover, title: manga.title });
          }
        }}>
          {bIsBookmarked ? <Ionicons name="bookmark" size={30} color="white" /> : <Ionicons name="bookmark-outline" size={30} color="white" />}

        </TouchableOpacity>}
      </View>

      <View style={[styles.standardContainer, { flexDirection: 'row' }]} level={'level1'}>
        <View style={styles.imageContainer}>
          <Image style={styles.coverImg} source={{ uri: cover }} />
        </View>
        <View style={styles.textContainer}>
          <View>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.status}>status | {status}</Text>
          </View>

          <View style={styles.tagsContainer}>
            {tags.map(t => <MangaTag tag={t} />)}
          </View>
        </View>
      </View>

      <View style={[styles.standardContainer, { flexDirection: 'row', height: 60 }]} level={'level1'}>
        <View style={[styles.selectOptionBackground, { left: isOnInfo ? 0 : (((width * 0.9) - 20) / 2) }]} level={'level2'} />
        <TouchableOpacity style={styles.selectOptionButton} onPress={() => { setIsOnInfo(true) }}>
          <Text style={styles.readShortcourtButtonText}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectOptionButton} onPress={() => { setIsOnInfo(false) }}>
          <Text style={styles.readShortcourtButtonText}>Read</Text>
        </TouchableOpacity>
      </View>

      {
        isOnInfo ?
          <ScrollView style={[styles.infoContainer, { flex: 1 }]}>
            <View level={'level1'} style={[styles.infoSubContainer]}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', width: '100%', textAlign: 'center', marginBottom: 20 }}>Description</Text>
              <Text style={{ fontSize: 15 }}>{description}</Text>
            </View>
          </ScrollView> :
          <ChaptersList manga={manga} navigation={navigation} chapters={chapters} />
      }

    </SafeAreaView >

  );

}

const width = Dimensions.get('window').width;
const height = 230;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  standardContainer: {
    width: '95%',
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginLeft: '2.5%',
    borderRadius: 15,
    height: 'auto'
  },
  infoContainer: {
    width: '95%',
    marginBottom: 10,
    marginLeft: '2.5%'
  },
  infoSubContainer: {
    width: '100%',
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden'
  },
  topBar: {
    flex: 1,
    height: 50,
    maxHeight: 100,
    width: width * 0.8
  },
  informationView: {
    flexDirection: 'row',
    width: '90%',
    marginLeft: '5%',
    marginBottom: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15
  },
  textContainer: {
    width: '65%',
    justifyContent: 'flex-start'
  },
  imageContainer: {
    minWidth: 100,
    width: '30%',
    maxWidth: 150,
    aspectRatio: 0.65,
    marginRight: 10
  },
  coverImg: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
    borderRadius: 15
  },
  title: {
    fontSize: 17,
    marginTop: 15,
    marginBottom: 15,
    fontWeight: 'bold'
  },
  status: {
    fontSize: 15,
    marginBottom: 15
  },
  scroll: {
    flex: 1,
    width: '95%',
    marginVertical: 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: '2.5%'
  },
  contentView: {
    flex: 1,
    width: '95%',
    marginLeft: '2.5%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  description: {
    fontSize: 15,
  },
  text: {

  },
  readShortcourt: {
    width: '95%',
    marginLeft: '2.5%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    height: 60,
    borderRadius: 15,
  },
  selectOptionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15
  },
  selectOptionBackground: {
    flex: 1,
    width: '50%',
    borderRadius: 15,
    marginRight: '-50%',
    right: '-450%'
  },
  readShortcourtButtonText: {
    fontSize: 20
  },
  tagsContainer: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    flexDirection: 'row'
  },
  tag: {

  }
});
