import { View, Text } from './Themed'
import React from 'react'
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { IMangaDexApiChapter } from '../types';

export type MangaChhapterTouchableProps = { chapter: string; readChapter: (chapter: string) => void; hasReadChapter: boolean };

export default class MangaChapterTouchable extends React.Component<MangaChhapterTouchableProps> {

    constructor(props: MangaChhapterTouchableProps) {
        super(props);
    }

    render(): React.ReactNode {
        return (
            <TouchableOpacity style={styles.container} onPress={() => { console.log('pressed'); this.props.readChapter(this.props.chapter); }}>
                < Text style={{ color: this.props.hasReadChapter ? 'red' : 'white', fontSize: 15 }}> {this.props.chapter}</Text >
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
