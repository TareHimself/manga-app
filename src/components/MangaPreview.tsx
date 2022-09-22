import { Text } from './Themed';
import { StyleSheet, Image, TouchableOpacity, ImageBackground, View as DefaultView } from 'react-native';
import React, { PureComponent } from 'react';
import { BaseStackParamList, IMangaPreviewData } from '../types';

export type MangaPreviewProps = { data: IMangaPreviewData, navigate: (route: keyof BaseStackParamList, params: BaseStackParamList[keyof BaseStackParamList]) => void; width: number; };

export default class MangaPreview extends PureComponent<MangaPreviewProps> {

  render(): React.ReactNode {
    const { data, navigate } = this.props;

    const coverUrl = data.cover;

    const scale = Math.min(width, 200) / 200;

    return (
      <TouchableOpacity onPress={() => { navigate('MangaPreview', { manga: data }) }} style={{ ...styles.container, width: this.props.width, maxWidth: this.props.width, padding: 5 * scale }}>
        <ImageBackground style={styles.img} source={{ uri: coverUrl }} />
        <DefaultView style={styles.titleContainer}><Text numberOfLines={2} style={styles.title}>{data.title}</Text></DefaultView>
      </TouchableOpacity>
    )
  }

}

const width = 190;
const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    flexDirection: 'column',
    width: width,
    maxWidth: width,
    aspectRatio: 0.65,
    overflow: 'hidden'
  },
  img: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 7,
    overflow: 'hidden'
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
    aspectRatio: 0.65
  },
  title: {
    position: 'relative',
    fontSize: 12,
    textShadowColor: 'black',
    textShadowRadius: 3,
    width: '100%'
  },
});