import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { ImageURISource, Platform, StyleSheet, Image } from 'react-native';
import AutoResizeImage from '../components/AutoResizeImage';

import EditScreenInfo from '../components/EditScreenInfo';
import ZoomableView from '../components/ZoomableView';
import { SafeAreaView, Text, View } from '../components/Themed';
import useMangaDexChapterCdn from '../hooks/useMangaDexChapterCdn';
import { IMangaDexReadableChapter, MainStackScreenProps } from '../types';
import { getDiagonalScreenSize } from '../utils';

export default function ReadMangaModalScreen({ route, navigation }: MainStackScreenProps<'ReadMangaModal'>) {

  const { manga, startChapter, chapters } = route.params;

  const [loadedChapter, fetchChapter] = useMangaDexChapterCdn(startChapter.id)
  const [chapter, setChapter] = useState(startChapter);




  const images: ImageURISource[] = loadedChapter ? loadedChapter.chapter.data.map((chapter) => {
    return { uri: `${loadedChapter.baseUrl}/data/${loadedChapter.chapter.hash}/${chapter}` }
  }) : []

  return (
    <SafeAreaView style={styles.container}>
      <ZoomableView
        style={styles.imageViewer}
        scrollSpeed={(getDiagonalScreenSize() / 6.16) * 20}
        zoomMin={1}
        zoomMax={4}
      >
        {images.map(image => <AutoResizeImage source={image} key={image.uri || ''} style={styles.images} />)}
      </ZoomableView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewer: {
    position: 'absolute',
    minHeight: '100%'
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  images: {
    width: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  }
});
