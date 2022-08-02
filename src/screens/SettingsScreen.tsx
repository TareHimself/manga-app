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
export default function SettingsScreen({ navigation }: RootTabScreenProps<'Settings'>) {
  const savePath = `${FileSystem.documentDirectory!}bookmarks.dat`;
  const exportBookmarks = useCallback(async () => {

    if (await Sharing.isAvailableAsync() && await SecureStore.isAvailableAsync()) {

      await Sharing.shareAsync(savePath);
    }
  }, [savePath]);

  const exportBookmarksOld = useCallback(async () => {

    if (await Sharing.isAvailableAsync() && await SecureStore.isAvailableAsync()) {
      const savePath = `${FileSystem.documentDirectory!}bookmarks.dat`;
      await FileSystem.writeAsStringAsync(savePath, await SecureStore.getItemAsync(`bookmarks`) || JSON.stringify({ d: [], v: Constants.manifest!.version }), { encoding: 'utf8' });
      await Sharing.shareAsync(savePath);
    }
  }, [savePath]);

  const importBookmarks = useCallback(async () => {
    if (await SecureStore.isAvailableAsync()) {
      const file = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (file && file.type === 'success' && file.name.endsWith('.dat')) {
        const fileReadIn = await FileSystem.readAsStringAsync(file.uri, { encoding: 'utf8' });
        await FileSystem.writeAsStringAsync(savePath, fileReadIn, { encoding: 'utf8' })
        getBookmarksEmitter().emit('update', 'settings-op', 'refresh');
      }
    }

  }, [savePath]);

  const deleteBookmarks = useCallback(async () => {
    if (await SecureStore.isAvailableAsync()) {
      const tmp = await FileSystem.getInfoAsync(savePath);
      if (tmp.exists) {
        await FileSystem.deleteAsync(savePath);
        getBookmarksEmitter().emit('update', 'settings-op', 'refresh');
      }

    }
  }, [savePath]);

  return (
    <SafeAreaView level={'level0'} style={{ height: '100%' }}>
      <ScrollView style={styles.standardContainer} level={'level1'}>

        <TouchableOpacity style={styles.touchableStyle} onPress={exportBookmarksOld}><Text style={styles.text}>Export bookmarks (MD)</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={exportBookmarks}><Text style={styles.text}>Export bookmarks</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={importBookmarks}><Text style={styles.text}>Import bookmarks</Text></TouchableOpacity>
        <TouchableOpacity style={styles.touchableStyle} onPress={deleteBookmarks}><Text style={styles.text}>Delete bookmarks</Text></TouchableOpacity>
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
