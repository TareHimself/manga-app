import React, { useEffect, useRef } from 'react';
import { ImageURISource, StyleSheet, } from 'react-native';
import { MangaReaderNavigation } from '../components/MangaReader';
import { SafeAreaView, ScrollView } from '../components/Themed';
import useMangaDexChapterCdn from '../hooks/useMangaChapterCdn';
import { BaseStackScreenProps } from '../types';
import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import useReadChapters from '../hooks/useReadChapters';
import MangaReader from '../components/MangaReader';
import Toast from 'react-native-root-toast';
import { setChapterAsRead } from '../redux/slices/chaptersSlice';
import useSource from '../hooks/useSource';
import { useAppDispatch } from '../redux/hooks';

export default function ReadMangaModalScreen({ route, navigation }: BaseStackScreenProps<'ReadMangaModal'>) {

  const { manga, startChapter, chapters } = route.params;
  const { id: sourceId } = useSource().source;
  const currentChapterIndex = useRef(chapters.findIndex(c => c.id === startChapter.id));

  const [isLoadingChapter, loadedChapter, fetchChapter] = useMangaDexChapterCdn(manga.id)

  const dispatch = useAppDispatch();

  const onReaderNavigate = useCallback(async (op: MangaReaderNavigation) => {

    switch (op) {
      case 'previous':
        // go to previous chapter
        if (currentChapterIndex.current + 1 < chapters.length) {
          currentChapterIndex.current++;;
          if (!await fetchChapter(currentChapterIndex.current)) {
            currentChapterIndex.current--;
          }

          if (!chapters[currentChapterIndex.current].read) {
            dispatch(setChapterAsRead([sourceId, manga.id, currentChapterIndex.current, chapters[currentChapterIndex.current]]))
          }

          Toast.show('Loading Previous Chapter', {
            duration: Toast.durations.SHORT,
            position: -80
          });
        }
        break;
      case 'info':
        console.log('show ui here')
        navigation.navigate('MangaPreview', { manga: manga });
        break;

      case 'next':
        // go to next chapter
        if (currentChapterIndex.current !== 0) {
          currentChapterIndex.current--;
          if (!await fetchChapter(currentChapterIndex.current)) {
            currentChapterIndex.current++;
          }

          if (!chapters[currentChapterIndex.current].read) {
            dispatch(setChapterAsRead([sourceId, manga.id, currentChapterIndex.current, chapters[currentChapterIndex.current]]))
          }

          Toast.show('Loading Next Chapter', {
            duration: Toast.durations.SHORT,
            position: -80
          });
        }
        else {
          Toast.show('No More Chapters', {
            duration: Toast.durations.SHORT,
            position: -80
          });
          navigation.navigate('MangaPreview', { manga: manga });
        }

        break;
    }
  }, [loadedChapter, chapters, currentChapterIndex, manga])

  useEffect(() => {
    fetchChapter(currentChapterIndex.current)
  })

  const images: ImageURISource[] = loadedChapter?.map((c) => { return { uri: c } }) || [];

  return (
    <SafeAreaView style={styles.container}>
      <MangaReader onNavigate={onReaderNavigate} images={loadedChapter || []} style={{ backgroundColor: '#1f1f1f' }} />
    </SafeAreaView>
  );
}

/*

<ZoomableView
        style={styles.imageViewer}
        scrollSpeed={(getDiagonalScreenSize() / 6.16) * 20}
        zoomMin={1}
        zoomMax={4}
        onTouched={onReaderTouched}
      >
        
      </ZoomableView>

      */

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
