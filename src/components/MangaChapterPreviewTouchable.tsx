import { View, Text } from './Themed'
import React from 'react'
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { IMangaChapter } from '../types';

export type MangaChhapterTouchableProps = { chapter: IMangaChapter; readChapter: (chapter: IMangaChapter) => void; hasReadChapter: boolean };

export default class MangaChapterTouchable extends React.Component<MangaChhapterTouchableProps> {

    constructor(props: MangaChhapterTouchableProps) {
        super(props);
    }
    render(): React.ReactNode {
        return (
            <TouchableOpacity style={styles.container} onPress={() => { this.props.readChapter(this.props.chapter); }}>
                < Text style={{ color: this.props.hasReadChapter ? 'red' : 'white', fontSize: 15 }}> {this.props.chapter.title}</Text >
            </TouchableOpacity >
        )
    }

    shouldComponentUpdate(nextProps: Readonly<MangaChhapterTouchableProps>, nextState: Readonly<{}>) {
        return this.props.hasReadChapter !== nextProps.hasReadChapter;
    }

}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        height: 35,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
