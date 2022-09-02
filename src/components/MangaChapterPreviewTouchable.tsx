import { View, Text } from './Themed'
import React from 'react'
import { connect } from "react-redux";
import { Dimensions, FlatList, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IMangaChapter, IStoredMangaChapter } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { addPendingDownload, downloadChapter } from '../redux/slices/chaptersSlice';
import { store } from '../redux/store';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';

export type MangaChapterTouchableProps = { bIsDownloading: boolean; sourceId: string, mangaId: string; chapter: IStoredMangaChapter; chapterIndex: number, readChapter: (chapter: IMangaChapter) => void; hasReadChapter: boolean, dispatch: typeof store.dispatch; bIsLast: boolean };

export type MangaChapterTouchableState = { isOnline: boolean; }

export default class MangaChapterTouchable extends React.Component<MangaChapterTouchableProps, MangaChapterTouchableState> {
    unsubFromNetInfo: null | NetInfoSubscription;

    constructor(props: MangaChapterTouchableProps) {
        super(props);
        this.state = { isOnline: true }
        this.unsubFromNetInfo = null;
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

    onDownloadOrDeletePressed() {
        if (this.props.bIsDownloading) {
            console.log('downloading')
        }
        else {
            if (this.props.chapter.downloadedPages.length > 0) {
                console.log('cant delete yet')
            }
            else {
                console.log('downloading')
                this.props.dispatch(addPendingDownload(this.props.sourceId + this.props.mangaId + this.props.chapter.id));
                this.props.dispatch(downloadChapter({ sourceId: this.props.sourceId, mangaId: this.props.mangaId, chapterIndex: this.props.chapterIndex }))
            }
        }

    }

    render(): React.ReactNode {
        if (this.state.isOnline) {
            return (
                <>
                    <View style={styles.container} level={'level2'}>
                        <TouchableOpacity style={styles.readTouchable} onPress={() => { this.props.readChapter(this.props.chapter); }}>
                            < Text style={{ color: this.props.hasReadChapter ? 'red' : 'white', fontSize: 15 }}> {this.props.chapter.title}</Text >
                        </TouchableOpacity >
                        {this.props.bIsDownloading ? (<ActivityIndicator size={'small'} style={styles.icon} ></ActivityIndicator>) : (<TouchableOpacity onPress={this.onDownloadOrDeletePressed.bind(this)}>
                            {this.props.chapter.downloadedPages.length ? <MaterialIcons style={styles.icon} name="delete" size={25} color="white" /> : <MaterialIcons style={styles.icon} name="file-download" size={25} color="white" />}
                        </TouchableOpacity>)}
                    </View>
                    {this.props.bIsLast && <View style={{ height: 10 }}></View>}
                </>


            )
        }
        else {
            return (
                <>
                    <View style={styles.container} level={'level2'}>
                        <TouchableOpacity disabled={this.props.chapter.downloadedPages.length === 0} style={styles.readTouchable} onPress={() => { this.props.readChapter(this.props.chapter); }}>
                            < Text style={{ color: this.props.hasReadChapter ? 'red' : 'white', fontSize: 15 }}> {this.props.chapter.title}</Text >
                        </TouchableOpacity >
                        {this.props.chapter.downloadedPages.length ? <MaterialIcons style={styles.icon} name="delete" size={25} color="white" /> : <Ionicons style={styles.icon} name="ios-cloud-offline" size={24} color="white" />}
                    </View>
                    {this.props.bIsLast && <View style={{ height: 10 }}></View>}
                </>


            )
        }

    }

    shouldComponentUpdate(nextProps: Readonly<MangaChapterTouchableProps>, nextState: Readonly<MangaChapterTouchableState>) {
        if (this.state.isOnline !== nextState.isOnline) return true;
        return this.props.hasReadChapter !== nextProps.hasReadChapter || this.props.chapter.downloadedPages.length !== nextProps.chapter.downloadedPages.length || this.props.bIsDownloading !== nextProps.bIsDownloading;
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
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    readTouchable: {
        flex: 1,
    },
    icon: {
        margin: 5
    }
});