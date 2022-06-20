import { View, Text } from './Themed';
import { Dimensions, StyleSheet, Image, TouchableOpacity, ImageBackground, View as DefaultView } from 'react-native';
import React, { PureComponent } from 'react';
import { IMangaData, MainStackParamList } from '../types';

export type MangaPreviewProps = { data: IMangaData, navigate: (route: keyof MainStackParamList, params: MainStackParamList[keyof MainStackParamList]) => void; width: number; };

export default class MangaPreview extends PureComponent<MangaPreviewProps> {

  render(): React.ReactNode {
    const { data, navigate } = this.props;

    const coverUrl = data.cover;

    const scale = Math.min(width, 200) / 200;
    return (
      <TouchableOpacity onPress={() => { navigate('MangaPreview', { manga: data }) }} style={{ ...styles.container, width: width, margin: 5 * scale }}>
        <ImageBackground style={styles.img} source={{ uri: coverUrl }} />
        <DefaultView style={styles.titleContainer}><Text numberOfLines={2} style={styles.title}>{data.name}</Text></DefaultView>
      </TouchableOpacity>
    )
  }

}

const width = 190;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'column',
    width: width,
    maxWidth: width,
    aspectRatio: 0.65,
    borderRadius: 7,
    overflow: 'hidden',
    margin: 5
  },
  img: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '100%',
    aspectRatio: 0.65
  },
  title: {
    position: 'relative',
    fontSize: 12,
    textShadowColor: 'black',
    textShadowRadius: 3,
    marginBottom: 10,
    marginLeft: 5,
    marginRight: 5,
    width: '100%'
  },
});