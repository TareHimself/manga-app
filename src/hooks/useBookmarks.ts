import { useCallback, useEffect, useRef } from "react";
import 'react-native-get-random-values';
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { IMangaPreviewData } from "../types";

import usePersistence from "./usePersistence";
import useSource from "./useSource";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { add, load, remove } from "../redux/slices/bookmarksSlice";

export type BookmarksPersistencePayload = { op: 'add' | 'remove' | 'refresh', data?: IMangaPreviewData | string };

export default function useBookmarks(): { IsBookmarked: (id: string) => boolean; bookmarks: IMangaPreviewData[], addBookmark: (manga: IMangaPreviewData) => Promise<void>, removeBookmark: (id: string) => Promise<void> } {

	const { source } = useSource();

	const dispatch = useAppDispatch();
	const hasInit = useAppSelector((state) => state.bookmarks.init);
	const bookmarks = useAppSelector((state) => state.bookmarks.data)

	const addBookmark = useCallback(async (manga: IMangaPreviewData) => {
		dispatch(add({ sourceId: source.id, item: manga }));
		return;
	}, [dispatch]);

	const removeBookmark = useCallback(async (id: string) => {
		dispatch(remove({ sourceId: source.id, id }));
		return;
	}, [dispatch]);

	const IsBookmarked = useCallback((id: string) => {
		return Object.keys(bookmarks).includes(id);
	}, [bookmarks]);

	useEffect(() => {
		if (!hasInit) dispatch(load(source.id));
	}, [hasInit])
	return { IsBookmarked, bookmarks: Object.values(bookmarks), addBookmark, removeBookmark }
}