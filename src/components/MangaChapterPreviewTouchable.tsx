import { View, Text } from './Themed'
import React from 'react'
import { connect } from "react-redux";
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { IMangaChapter, IStoredMangaChapter } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { addPendingAction, deleteChapter, downloadChapter, setChapterAsRead } from '../redux/slices/chaptersSlice';
import { store } from '../redux/store';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';

export type MangaChapterTouchableProps = { bIsDownloading: boolean; sourceId: string, mangaId: string; chapter: IStoredMangaChapter; chapterIndex: number, readChapter: (chapter: IStoredMangaChapter) => void; dispatch: typeof store.dispatch; bIsLast: boolean };

export type MangaChapterTouchableState = { isOnline: boolean; }

export default class MangaChapterTouchable extends React.Component<MangaChapterTouchableProps, MangaChapterTouchableState> {
    unsubFromNetInfo: null | NetInfoSubscription;
    DownloadProgress: Animated.Value;

    constructor(props: MangaChapterTouchableProps) {
        super(props);
        this.state = { isOnline: true }
        this.unsubFromNetInfo = null;
        this.DownloadProgress = new Animated.Value(1);
    }

    componentDidMount() {
        this.unsubFromNetInfo = NetInfo.addEventListener((state) => {
            this.setState({ isOnline: state.isInternetReachable || false });
        })

        NetInfo.fetch().then((val) => {
            this.setState({ isOnline: val.isInternetReachable || false });
        })
    }

    componentWillUnmount() {
        if (this.unsubFromNetInfo) {
            this.unsubFromNetInfo();
            this.unsubFromNetInfo = null;
        }
    }

    onDownloadProgress(progress: number) {
        this.DownloadProgress.setValue(progress);
    }

    onDownloadOrDeletePressed() {
        if (this.props.bIsDownloading) {
        }
        else {
            if (this.props.chapter.offline) {
                this.props.dispatch(addPendingAction(this.props.sourceId + this.props.mangaId + this.props.chapter.id));
                this.props.dispatch(deleteChapter({ sourceId: this.props.sourceId, mangaId: this.props.mangaId, chapterIndex: this.props.chapterIndex, chapter: this.props.chapter }))
                this.DownloadProgress.setValue(1);
            }
            else {
                this.DownloadProgress.setValue(0);
                this.props.dispatch(addPendingAction(this.props.sourceId + this.props.mangaId + this.props.chapter.id));
                this.props.dispatch(downloadChapter({ sourceId: this.props.sourceId, mangaId: this.props.mangaId, chapterIndex: this.props.chapterIndex, chapter: this.props.chapter, onProgress: this.onDownloadProgress.bind(this) }))
            }
        }

    }

    markAsRead() {
        if (!this.props.chapter.read) {
            this.props.dispatch(setChapterAsRead([this.props.sourceId, this.props.mangaId, this.props.chapterIndex, this.props.chapter]));
        }
    }

    render(): React.ReactNode {
        if (this.state.isOnline) {
            return (
                <>
                    <View style={styles.container}>
                        <Animated.View style={[styles.progressContainer, { width: this.DownloadProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), marginRight: this.DownloadProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '-100%'] }) }]} />
                        <TouchableOpacity style={styles.readTouchable} onPress={() => { this.markAsRead(); this.props.readChapter(this.props.chapter); }}>
                            < Text style={{ color: this.props.chapter.read ? 'red' : 'white', fontSize: 15 }}> {this.props.chapter.title}</Text >
                        </TouchableOpacity >
                        {this.props.bIsDownloading ? (<ActivityIndicator size={'small'} style={styles.icon} ></ActivityIndicator>) : (<TouchableOpacity onPress={this.onDownloadOrDeletePressed.bind(this)}>
                            {this.props.chapter.offline ? <MaterialIcons style={styles.icon} name="delete" size={25} color="white" /> : <MaterialIcons style={styles.icon} name="file-download" size={25} color="white" />}
                        </TouchableOpacity>)}
                    </View>
                    {this.props.bIsLast && <View style={{ height: 10 }} />}
                </>
            )
        }
        else {
            return (
                <>
                    <View style={styles.container}>
                        <Animated.View style={[styles.progressContainer]} />
                        <TouchableOpacity disabled={!this.props.chapter.offline} style={styles.readTouchable} onPress={() => { this.props.readChapter(this.props.chapter); }}>
                            < Text style={{ color: this.props.chapter.read ? 'red' : 'white', fontSize: 15 }}> {this.props.chapter.title}</Text >
                        </TouchableOpacity >
                        {this.props.chapter.offline ? <MaterialIcons style={styles.icon} name="delete" size={25} color="white" /> : <Ionicons style={styles.icon} name="ios-cloud-offline" size={24} color="white" />}
                    </View>
                    {this.props.bIsLast && <View style={{ height: 10 }} />}
                </>


            )
        }

    }

    shouldComponentUpdate(nextProps: Readonly<MangaChapterTouchableProps>, nextState: Readonly<MangaChapterTouchableState>) {
        return this.state.isOnline !== nextState.isOnline || this.props.chapter.read !== nextProps.chapter.read || this.props.chapter.offline !== nextProps.chapter.offline || this.props.bIsDownloading !== nextProps.bIsDownloading;
    }

}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        height: 50,
        marginVertical: 10,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden',
        borderColor: '#3b3b3b',
        borderWidth: 1,
        margin: -1
    },
    progressContainer: {
        width: '100%',
        marginRight: '-100%',
        height: 50,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#3b3b3b'
    },
    readTouchable: {
        flex: 1,
        marginLeft: 20
    },
    icon: {
        margin: 5,
        marginRight: 20
    }
});