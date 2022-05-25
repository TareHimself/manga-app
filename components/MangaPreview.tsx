import { View, Text } from './Themed';
import { Dimensions, StyleSheet, Image, TouchableOpacity, ImageBackground, View as DefaultView } from 'react-native';
import React from 'react';

export default function MangaPreview({ data, navigate }: { data: IMangaData, navigate: (route: keyof MainStackParamList, params: MainStackParamList[keyof MainStackParamList]) => void; }) {

  const coverUrl = data.relationships.filter(r => r.type === 'cover_art')[0]?.attributes?.fileName;
  return (
    <TouchableOpacity onPress={() => { navigate('MangaPreview', { manga: data }) }} style={styles.container}>
      <ImageBackground style={styles.img} source={{ uri: coverUrl ? `https://uploads.mangadex.org/covers/${data.id}/${coverUrl}.512.jpg` : "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.istockphoto.com%2Fvector%2Fblack-blueprint-background-vector-illustration-gm543213826-97441037&psig=AOvVaw36KNugoF-gq8jV4XCZ59m6&ust=1653537486338000&source=images&cd=vfe&ved=0CAwQjRxqFwoTCKi_qKbh-fcCFQAAAAAdAAAAABAD" }} />
      <DefaultView style={styles.titleContainer}><Text numberOfLines={2} style={styles.title}>{data.attributes.title ? data.attributes.title[Object.keys(data.attributes.title)[0]] : "No Title"}</Text></DefaultView>
    </TouchableOpacity>


  )
}

const width = Dimensions.get('window').width * 0.97 * 0.475;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'column',
    width: width,
    minWidth: width,
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