import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView, Text, View } from '../components/Themed';
import useMangaDexChapters from '../hooks/useMangaChapters';
import { MainStackScreenProps, MainStackParamList, IMangaDexApiChapter } from '../types';
import MangaChapterPreviewTouchable from '../components/MangaChapterPreviewTouchable';
import { isTablet } from '../utils';
import useReadChapters from '../hooks/useReadChapters';
export default function MangaPreviewScreen({ navigation, route }: MainStackScreenProps<'MangaPreview'>) {

  const { manga } = route.params;

  const bIsTablet = isTablet();

  const coverUrl = manga.cover;
  const title = manga.name;
  const description = "Come along with me";
  const status = " unknown";

  const [chapters] = useMangaDexChapters(manga.id || '');

  const [wantsToRead, setWantsToRead] = useState(false);
  const [isOnInfo, setIsOnInfo] = useState(false);

  const onReadChapter = (chapter: string) => {
    if (manga) {
      navigate('ReadMangaModal', { manga: manga, chapters: chapters, startChapter: chapter })
    }
  }

  const navigate = useCallback((route: keyof MainStackParamList, params: MainStackParamList[keyof MainStackParamList]) => {
    navigation.navigate(route, params)
  }, [])

  const { hasReadChapter, addReadChapter } = useReadChapters(manga.id);

  const chaptersList = isOnInfo ? null : chapters.map(chapter => <MangaChapterPreviewTouchable chapter={chapter} key={chapter} readChapter={onReadChapter} hasReadChapter={hasReadChapter} addReadChapter={addReadChapter} />);

  return (
    <SafeAreaView style={styles.container} level={'level0'}>

      <View style={styles.previewContainer}></View>
      <View style={[styles.previewContainer, { flexDirection: 'row' }]} level={'level1'}>
        <View style={styles.imageContainer}>
          <Image style={styles.coverImg} source={{ uri: coverUrl }} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.status}>status | {status}</Text>
        </View>
      </View>

      <View style={[styles.previewContainer, { flexDirection: 'row', height: 60 }]} level={'level1'}>
        <View style={[styles.selectOptionBackground, { right: isOnInfo ? 0 : '-450%' }]} level={'level2'} />
        <TouchableOpacity style={styles.selectOptionButton} onPress={() => { setIsOnInfo(true) }}>
          <Text style={styles.readShortcourtButtonText}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectOptionButton} onPress={() => { setIsOnInfo(false) }}>
          <Text style={styles.readShortcourtButtonText}>Read</Text>
        </TouchableOpacity>
      </View>


      <View style={[styles.previewContainer, { flex: 1 }]} level={'level1'}>
        {isOnInfo ?
          null :
          <ScrollView style={styles.scroll} contentContainerStyle={{ alignItems: 'flex-start' }}>
            {chaptersList}
          </ScrollView>
        }

      </View>


    </SafeAreaView>

  );

}

const width = Dimensions.get('window').width;
const height = 230;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  previewContainer: {
    width: '90%',
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: '5%'
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
    width: '60%',
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
    fontSize: 20,
    marginTop: 15,
    marginBottom: 15
  },
  status: {
    fontSize: 15,
    marginBottom: 15
  },
  scroll: {
    flex: 1,
    width: '100%'
  },
  contentView: {
    flex: 1,
    width: '90%',
    marginLeft: '5%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  description: {
    fontSize: 15,
  },
  text: {

  },
  readShortcourt: {
    width: '90%',
    marginLeft: '5%',
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
