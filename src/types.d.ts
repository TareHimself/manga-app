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

export interface IMangaData {
  id: string;
  name: string;
  cover: string;
  chapters: string;
  tags: string[]

}

export interface IMangaVolume {

}


export interface IMangaDexApiSearchResponse {
  result: "ok";
  response: string;
  data: IMangaData[];
  limit: number;
  offset: number;
  total: number;

}

export interface IMangaDexApiChapter {
  id: string;
  type: 'chapter';
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: languages;
    externalUrl: null,
    publishAt: string,
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
    version: number
  },
  relationships: { id: string; type: mangaRelationshipType }[];
}

export interface IMangaDexApiChaptersResponse {
  result: "ok";
  response: string;
  data: IMangaDexApiChapter[];
  limit: number;
  offset: number;
  total: number;
}

export interface IMangaReadableChapter {
  base: string;
  total: number
}

export type RootTabParamList = {
  Discover: undefined;
  Bookmarks: undefined;
  Settings: undefined;
};

export type BaseStackParamList = {
  Root: undefined;
  MangaPreview: { manga: IMangaData };
  ReadMangaModal: { manga: IMangaData; chapters: string[]; startChapter: string; hasReadChapter: (chapter: string) => boolean, addReadChapter: (chapter: string) => Promise<void> };
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

