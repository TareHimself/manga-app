import React, { useRef } from 'react';
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

export default function ReadMangaModalScreen({ route, navigation }: BaseStackScreenProps<'ReadMangaModal'>) {

  const { manga, startChapter, chapters } = route.params;

  const { hasReadChapter, addReadChapter } = useReadChapters(manga.id);
  const [isLoadingChapter, loadedChapter, fetchChapter] = useMangaDexChapterCdn(manga.id, startChapter.id)
  const currentChapterIndex = useRef(chapters.indexOf(startChapter));

  const { width, height } = useWindowDimensions();



  const onReaderNavigate = useCallback((op: MangaReaderNavigation) => {

    switch (op) {
      case 'previous':
        // go to previous chapter
        if (currentChapterIndex.current + 1 < chapters.length) {
          currentChapterIndex.current += 1;
          fetchChapter(manga.id, chapters[currentChapterIndex.current].id)

          if (!hasReadChapter(chapters[currentChapterIndex.current].id)) {
            addReadChapter(chapters[currentChapterIndex.current].id);
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
          currentChapterIndex.current -= 1;
          fetchChapter(manga.id, chapters[currentChapterIndex.current].id)

          if (!hasReadChapter(chapters[currentChapterIndex.current].id)) {
            addReadChapter(chapters[currentChapterIndex.current].id);
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
  }, [loadedChapter, chapters, currentChapterIndex, manga, hasReadChapter, addReadChapter])

  const images: ImageURISource[] = loadedChapter?.map((c) => { return { uri: c } }) || [];

  return (
    <SafeAreaView style={styles.container}>
      <MangaReader onNavigate={onReaderNavigate} images={loadedChapter || []} />
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
