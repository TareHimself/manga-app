import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Image, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView, Text, View, ScrollView } from '../components/Themed';
import useMangaDexChapters from '../hooks/useMangaChapters';
import { BaseStackParamList, BaseStackScreenProps, IMangaChapter, IMangaData } from '../types';
import MangaChapterPreviewTouchable from '../components/MangaChapterPreviewTouchable';
import { isTablet } from '../utils';
import useReadChapters from '../hooks/useReadChapters';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import useBookmarks from '../hooks/useBookmarks';
import useManga from '../hooks/useManga';
import usePersistence from '../hooks/usePersistence';
import { useAppSelector } from '../redux/hooks';

function ChaptersList({ manga, chapters, navigation }: { manga: IMangaData, chapters: IMangaChapter[]; navigation: NativeStackNavigationProp<BaseStackParamList, "MangaPreview", undefined> }) {

  const { readChapters, hasReadChapter, addReadChapter } = useReadChapters(manga.id);



  const onReadChapter = (chapter: IMangaChapter) => {
    if (manga) {
      if (!hasReadChapter(chapter.id)) addReadChapter(chapter.id);

      navigate('ReadMangaModal', { manga: manga, chapters: chapters, startChapter: chapter });
    }
  }

  const navigate = useCallback((route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => {
    navigation.navigate(route, params)
  }, []);

  /*
  <FlatList
      level={'level1'}
      style={[styles.scroll]}
      contentContainerStyle={{ alignItems: 'stretch' }}
      key={readChapters.length}
      data={chapters}
      renderItem={({ item, index }) => <MangaChapterPreviewTouchable chapter={item} key={item} readChapter={onReadChapter} hasReadChapter={hasReadChapter(item)} />}
      onEndReachedThreshold={0.6} />
      */
  return (
    <ScrollView
      level={'level1'}
      style={[styles.scroll]}
    >
      {chapters.map((item) => <MangaChapterPreviewTouchable chapter={item} key={item.id} readChapter={onReadChapter} hasReadChapter={hasReadChapter(item.id)} />)}
    </ScrollView>

  )
}

export default function MangaPreviewScreen({ navigation, route }: BaseStackScreenProps<'MangaPreview'>) {

  const { manga: mangaPreview } = route.params;

  const bIsTablet = isTablet();

  const manga = useManga(mangaPreview.id) || { ...mangaPreview, description: 'loading', status: 'loading', tags: [] };

  const { title, cover, description, status } = manga;

  const [isOnInfo, setIsOnInfo] = useState(true);

  const { width } = useWindowDimensions();

  const chapters = useMangaDexChapters(manga.id || '');

  const { IsBookmarked, addBookmark, removeBookmark } = useBookmarks();


  const bIsBookmarked = IsBookmarked(mangaPreview.id);

  const lastSource = useRef(useAppSelector(state => state.source.source.id));
  const currentSource = useAppSelector(state => state.source.source.id);
  useEffect(() => {
    if (lastSource.current !== currentSource) {
      lastSource.current = currentSource;
      navigation.pop();
    }
  }, [currentSource]);

  return (
    <SafeAreaView style={styles.container} level={'level0'}>

      <View style={[styles.standardContainer, { height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }]} level={'level1'}>
        <TouchableOpacity onPress={() => {
          navigation.goBack();
        }}>
          <Ionicons name="ios-chevron-back-circle-outline" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          if (bIsBookmarked) {
            removeBookmark(mangaPreview.id);
          }
          else {
            addBookmark({ id: manga.id, cover: manga.cover, title: manga.title });
          }
        }}>
          {bIsBookmarked ? <Ionicons name="bookmark" size={30} color="white" /> : <Ionicons name="bookmark-outline" size={30} color="white" />}

        </TouchableOpacity>
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

          <View style={{ width: '100%', alignItems: 'flex-end' }}>


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

      {isOnInfo ?
        <ScrollView style={[styles.infoContainer, { flex: 1 }]}>
          <View level={'level1'} style={[styles.infoSubContainer]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', width: '100%', textAlign: 'center', marginBottom: 20 }}>Description</Text>
            <Text style={{ fontSize: 15 }}>{manga.description}</Text>
          </View>
        </ScrollView> :
        <ChaptersList manga={manga} navigation={navigation} chapters={chapters} />
      }

    </SafeAreaView>

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
    justifyContent: 'space-between'
  },
  imageContainer: {
    minWidth: 100,
    width: '20%',
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
    paddingVertical: 10,
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
  }
});
