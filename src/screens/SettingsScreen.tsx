import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, ScrollView, Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import Constants from "expo-constants"
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { getBookmarksEmitter } from '../emitters';
import useSource from '../hooks/useSource';
import usePersistence from '../hooks/usePersistence';
import { BookmarksPersistencePayload } from '../hooks/useBookmarks';
import Toast from 'react-native-root-toast';

export default function SettingsScreen({ navigation }: RootTabScreenProps<'Settings'>) {
  const { source, getSources, setSource, getSourceIndex } = useSource();

  const { sendEvent } = usePersistence<BookmarksPersistencePayload>('bookmarks');

  const savePath = `${FileSystem.documentDirectory!}${source.id}_bookmarks.dat`;


  const exportBookmarks = useCallback(async () => {
    if (await Sharing.isAvailableAsync() && await SecureStore.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(savePath);
      } catch (error: any) {
        Toast.show(error.message, {
          duration: Toast.durations.LONG,
        });
      }
    }
  }, [savePath]);

  const exportBookmarksOld = useCallback(async () => {
    if (await Sharing.isAvailableAsync() && await SecureStore.isAvailableAsync()) {
      try {
        await FileSystem.writeAsStringAsync(savePath, await SecureStore.getItemAsync(`bookmarks`) || JSON.stringify({ d: [], v: Constants.manifest!.version }), { encoding: 'utf8' });
        await Sharing.shareAsync(savePath);
      } catch (error: any) {
        Toast.show(error.message, {
          duration: Toast.durations.LONG,
        });
      }
    }
  }, [savePath]);

  const importBookmarks = useCallback(async () => {
    if (await SecureStore.isAvailableAsync()) {
      const file = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (file && file.type === 'success' && file.name.endsWith('.dat')) {
        try {
          const fileReadIn = await FileSystem.readAsStringAsync(file.uri, { encoding: 'utf8' });

          if (JSON.parse(fileReadIn).s !== source.id) { throw new Error('The bookmarks file is from a different source') }

          await FileSystem.writeAsStringAsync(savePath, fileReadIn, { encoding: 'utf8' })
          sendEvent('change', { op: 'refresh' });
        } catch (error: any) {
          Toast.show(error.message, {
            duration: Toast.durations.LONG,
          });
        }
      }
    }

  }, [savePath]);

  const deleteBookmarks = useCallback(async () => {
    if (await SecureStore.isAvailableAsync()) {
      const tmp = await FileSystem.getInfoAsync(savePath);
      if (tmp.exists) {
        await FileSystem.deleteAsync(savePath);
        sendEvent('change', { op: 'refresh' });
      }

    }
  }, [savePath]);

  const changeSource = useCallback(async () => {
    const sources = await getSources();
    const index = await getSourceIndex(source.id);
    const newIndex = index >= sources.length - 1 ? 0 : index + 1;

    console.log('change info | ', sources[index], sources[index + 1])
    setSource(sources[newIndex]);

    Toast.show(`Source Changed To ${sources[newIndex].name}`, {
      duration: Toast.durations.LONG,
    });
  }, [source.id, getSources]);

  return (
    <SafeAreaView level={'level0'} style={{ height: '100%' }}>
      <ScrollView style={styles.standardContainer} level={'level1'}>

        <TouchableOpacity style={styles.touchableStyle} onPress={exportBookmarksOld}><Text style={styles.text}>Export bookmarks (MD)</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={exportBookmarks}><Text style={styles.text}>Export bookmarks</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={importBookmarks}><Text style={styles.text}>Import bookmarks</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={deleteBookmarks}><Text style={styles.text}>Delete bookmarks</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={changeSource}><Text style={styles.text}>Change Source</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle}><Text style={styles.text}>Report a bug</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle}><Text style={styles.text}>Make a suggestion</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  standardContainer: {
    width: '95%',
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginLeft: '2.5%',
    borderRadius: 15,
    height: 'auto'
  },
  touchableStyle: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#3b3b3b',
    borderRadius: 15,
    marginVertical: 5
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
