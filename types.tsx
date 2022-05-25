/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }

  enum EMangaState {
    MANGA = "manga",
  }

  enum EMangaContentRating {
    MANGA = "manga",
  }

  interface IMangaDexSearch {
    title?: string;
    page?: number;
  }

  interface IMangaDexApiSearch extends IMangaDexSearch {
    limit?: number;
    offset?: number;
  }

  interface IMangaData {
    id: string;
    type: "manga";
    state: EMangaState;
    createdAt: string;
    updatedAt: string;
    contentRating: EMangaContentRating;
    lastVolume: string;
    lastChapter: string;
    attributes: {
      title?: Record<string, string>;
      altTitles?: Record<string, string>[];
      description: Record<string, string>;
    };
    relationships: {
      id: string; type: 'author' | 'artist' | 'cover_art'; attributes?: { fileName: string }
    }[]

  }

  interface IMangaVolume {

  }


  interface IMangaDexApiSearchResponse {
    result: "ok";
    response: string;
    data: IMangaData[];
    limit: number;
    offset: number;
    total: number;

  }

  type RootStackParamList = {
    Main: undefined;
    Modal: undefined;
    NotFound: undefined;
  };

  type MainStackParamList = {
    Home: undefined;
    MangaPreview: { manga: IMangaData } | undefined;
  };

  type RootStackProps = NativeStackScreenProps<RootStackParamList, keyof RootStackParamList>;

  type MainStackProps = NativeStackScreenProps<MainStackParamList, keyof MainStackParamList>;

}



type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type RootTabParamList = {
  name: string;
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = NativeStackScreenProps<RootStackParamList>;
