import { useCallback, useEffect } from "react";
import 'react-native-get-random-values';
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addBookmark as dAddBookmark, load as dLoad, removeBookmark as dRemoveBookmark } from "../redux/slices/bookmarksSlice";
import { IMangaPreviewData } from "../types";
import useSource from "./useSource";

export type BookmarksPersistencePayload = { op: 'add' | 'remove' | 'refresh', data?: IMangaPreviewData | string };

export default function useBookmarks(): { IsBookmarked: (id: string) => boolean; bookmarks: IMangaPreviewData[], addBookmark: (manga: IMangaPreviewData) => Promise<void>, removeBookmark: (id: string) => Promise<void> } {

	const { source } = useSource();

	const dispatch = useAppDispatch();
	const hasInit = useAppSelector((state) => state.bookmarks.init);
	const bookmarks = useAppSelector((state) => state.bookmarks.data)
	const bookmarksItems = useAppSelector((state) => state.bookmarks.data.reduce((current, d) => { current.push(d.id); return current }, [] as string[]))

	const addBookmark = useCallback(async (manga: IMangaPreviewData) => {
		dispatch(dAddBookmark({ sourceId: source.id, manga }));
		return;
	}, [dispatch]);

	const removeBookmark = useCallback(async (id: string) => {
		dispatch(dRemoveBookmark({ sourceId: source.id, id }));
		return;
	}, [dispatch]);

	const IsBookmarked = useCallback((id: string) => {
		return bookmarksItems.includes(id);
	}, [bookmarks, bookmarksItems]);

	useEffect(() => {
		if (!hasInit) dispatch(dLoad(source.id));
	}, [hasInit])
	return { IsBookmarked, bookmarks: Object.values(bookmarks), addBookmark, removeBookmark }
}