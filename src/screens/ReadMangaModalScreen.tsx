import React, { useEffect, useRef, useState } from 'react';
import ReactNative, { ImageURISource, Platform, StyleSheet, Image, Animated } from 'react-native';
import AutoResizeImage from '../components/AutoResizeImage';
import ZoomableView, { ZoomableViewHandlers } from '../components/ZoomableView';
import { SafeAreaView } from '../components/Themed';
import useMangaDexChapterCdn from '../hooks/useMangaChapterCdn';
import { BaseStackScreenProps } from '../types';
import { getDiagonalScreenSize } from '../utils';
import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import useReadChapters from '../hooks/useReadChapters';

export default function ReadMangaModalScreen({ route, navigation }: BaseStackScreenProps<'ReadMangaModal'>) {

  const { manga, startChapter, chapters } = route.params;

  const { hasReadChapter, addReadChapter } = useReadChapters(manga.id);
  const [isLoadingChapter, loadedChapter, fetchChapter] = useMangaDexChapterCdn(manga.id, startChapter)
  const currentChapterIndex = useRef(chapters.indexOf(startChapter));

  const { width, height } = useWindowDimensions();



  const onReaderTouched = useCallback((e: ReactNative.GestureResponderEvent, gestureState: ReactNative.PanResponderGestureState, handlers: ZoomableViewHandlers) => {
    const position = Math.ceil((gestureState.x0 - 0) / (width) * (3 - 0)); // result is 1-3 i.e. the part of the screen
    switch (position) {
      case 1:
        // go to previous chapter
        if (currentChapterIndex.current + 1 < chapters.length) {
          currentChapterIndex.current += 1;
          fetchChapter(manga.id, chapters[currentChapterIndex.current])

          if (!hasReadChapter(chapters[currentChapterIndex.current])) {
            addReadChapter(chapters[currentChapterIndex.current]);
          }

          Animated.timing(handlers.scrollY, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false
          }).start();

          Animated.timing(handlers.scrollX, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false
          }).start();

          Animated.timing(handlers.zoom, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false
          }).start();
        }
        break;
      case 2:
        console.log('show ui here')
        navigation.navigate('MangaPreview', { manga: manga });
        break;

      case 3:
        // go to next chapter
        if (currentChapterIndex.current !== 0) {
          currentChapterIndex.current -= 1;
          fetchChapter(manga.id, chapters[currentChapterIndex.current])

          if (!hasReadChapter(chapters[currentChapterIndex.current])) {
            addReadChapter(chapters[currentChapterIndex.current]);
          }

          Animated.timing(handlers.scrollY, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false
          }).start();

          Animated.timing(handlers.scrollX, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false
          }).start();

          Animated.timing(handlers.zoom, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false
          }).start();
        }

        break;
    }
  }, [loadedChapter, chapters, currentChapterIndex, manga, hasReadChapter, addReadChapter])

  const images: ImageURISource[] = [];
  if (loadedChapter) {
    console.log(loadedChapter)
    for (let i = 0; i < loadedChapter.total; i++) {
      images.push({ uri: loadedChapter.base.replace('{index}', `${i + 1}`) })
    }
  }

  const imageElements = isLoadingChapter ? null : images.map(image => <AutoResizeImage source={image} key={image.uri || ''} style={styles.images} />);
  return (
    <SafeAreaView style={styles.container}>
      <ZoomableView
        style={styles.imageViewer}
        scrollSpeed={(getDiagonalScreenSize() / 6.16) * 20}
        zoomMin={1}
        zoomMax={4}
        onTouched={onReaderTouched}
      >
        {imageElements}
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
    width: '100%',
    height: '100%'
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  images: {
    width: '100%',
    resizeMode: 'contain',
    marginVertical: 5
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
