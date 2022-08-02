/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import React from 'react';
import { Text as DefaultText, View as DefaultView, SafeAreaView as DefaultSafeAreaView, FlatList as DefaultFlatList, Platform, StatusBar, ScrollView as DefaultScrollView } from 'react-native';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import { viewLevel } from '../types';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = { level?: viewLevel } & DefaultView['props'];
export type SafeAreaViewProps = { level?: viewLevel } & DefaultSafeAreaView['props'];
export type FlatlistProps = { level?: viewLevel } & DefaultFlatList['props'];
export type ScrollViewProps = { level?: viewLevel } & DefaultScrollView['props']

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = Colors[useColorScheme()]['text'];

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, level, ...otherProps } = props;

  if (props.level) {
    return <DefaultView style={[{ backgroundColor: Colors[useColorScheme()][props.level] }, style]} {...otherProps} />;
  }

  return <DefaultView style={[style]} {...otherProps} />;

}

export function FlatList(props: FlatlistProps) {
  const { style, level, ...otherProps } = props;

  if (props.level) {
    return <DefaultFlatList style={[{ backgroundColor: Colors[useColorScheme()][props.level] }, style]} {...otherProps} />;
  }

  return <DefaultFlatList style={[style]} {...otherProps} />;

}

export function SafeAreaView(props: SafeAreaViewProps) {
  const { style, level, ...otherProps } = props;

  const topPadding = { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }

  if (props.level) {
    return <DefaultSafeAreaView style={[{ backgroundColor: Colors[useColorScheme()][props.level] }, style, topPadding]} {...otherProps} />;
  }

  return <DefaultSafeAreaView style={[style, topPadding]} {...otherProps} />;
}

export function ScrollView(props: ScrollViewProps) {
  const { style, level, ...otherProps } = props;

  if (props.level) {
    return <DefaultScrollView style={[{ backgroundColor: Colors[useColorScheme()][props.level] }, style]} {...otherProps} />;
  }

  return <DefaultScrollView style={[style]} {...otherProps} />;
}