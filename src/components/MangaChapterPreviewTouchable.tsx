import { View, Text } from './Themed'
import React from 'react'
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { IMangaDexApiChapter, MainStackParamList } from '../types';

export default function MangaChapterTouchable({ chapter, readChapter, hasReadChapter, addReadChapter }: { chapter: string; readChapter: (chapter: string) => void; hasReadChapter: (chapter: string) => boolean, addReadChapter: (chapter: string) => Promise<void> }) {
    return (
        <TouchableOpacity style={styles.container} onPress={() => { addReadChapter(chapter); readChapter(chapter); }}>
            < Text style={{ color: hasReadChapter(chapter) ? 'red' : 'white', fontSize: 15 }}> {chapter}</Text >
        </TouchableOpacity >
    )
}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        height: 35,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
