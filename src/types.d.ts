/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleProp, ViewStyle } from 'react-native';


export type languages = 'en' | 'ru';
export type mangaRelationshipType = 'scanlation_group' | 'manga' | 'user';
export type viewLevel = 'level0' | 'level1' | 'level2'

enum EMangaState {
  MANGA = "manga",
}

enum EMangaContentRating {
  MANGA = "manga",
}

export interface IMangaPreviewData {
  id: string;
  title: string;
  cover: string;
}

export interface IMangaChapter {
  id: string;
  title: string;
}

export interface IMangaData {
  id: string;
  title: string;
  cover: string;
  tags: string[];
  status: string;
  description: string;
}

export type RootTabParamList = {
  Discover: undefined;
  Bookmarks: undefined;
  Settings: undefined;
};

export type BaseStackParamList = {
  Root: undefined;
  MangaPreview: { manga: IMangaPreviewData };
  ReadMangaModal: { manga: IMangaData; chapters: IMangaChapter[]; startChapter: IMangaChapter; hasReadChapter: (chapterId: string) => boolean, addReadChapter: (chapterId: string) => Promise<void> };
};


export type RootTabScreenProps<T extends keyof RootTabParamList> = NativeStackScreenProps<RootTabParamList, T>;

export type BaseStackScreenProps<T extends keyof BaseStackParamList> = NativeStackScreenProps<BaseStackParamList, T>;

export type FlexGridViewProps = {
  listStyle?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  incompleteRowStyle?: StyleProp<ViewStyle>;
  columns: number;
  items: any[];
  createElement: (element: any) => JSX.Element;
}

export type RootTabParamList = {
  name: string;
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = NativeStackScreenProps<RootTabParamList>;

export type Vector2 = { x: number, y: number };
export type Vector3 = {}

