/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import React from 'react';
import { Text as DefaultText, View as DefaultView, SafeAreaView as DefaultSafeAreaView } from 'react-native';

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

export function SafeAreaView(props: SafeAreaViewProps) {
  const { style, level, ...otherProps } = props;

  if (props.level) {
    return <DefaultSafeAreaView style={[{ backgroundColor: Colors[useColorScheme()][props.level] }, style]} {...otherProps} />;
  }

  return <DefaultSafeAreaView style={[style]} {...otherProps} />;

}