import { View, Text } from './Themed'
import React from 'react'
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { IMangaDexApiChapter, MainStackParamList } from '../types';

export default function MangaChapterTouchable({ chapter, readChapter }: { chapter: IMangaDexApiChapter; readChapter: (chapter: IMangaDexApiChapter) => void; }) {
    return (
        <TouchableOpacity style={styles.container} onPress={() => readChapter(chapter)}>
            < Text > {chapter.attributes.chapter}</Text >
        </TouchableOpacity >
    )
}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        height: 30
    }
});
