import { useCallback, useEffect, useRef } from "react";
import 'react-native-get-random-values';
import Constants from "expo-constants"
import { IMangaPreviewData } from "../types";
import * as FileSystem from 'expo-file-system';
import usePersistence from "./usePersistence";
import useSource from "./useSource";

export type BookmarksPersistencePayload = { op: 'add' | 'remove' | 'refresh', data?: IMangaPreviewData | string };

export default function useBookmarks(): { IsBookmarked: (id: string) => boolean; bookmarks: IMangaPreviewData[], addBookmark: (manga: IMangaPreviewData) => Promise<void>, removeBookmark: (id: string) => Promise<void> } {

	const { tryUpdateState, sendEvent, addCallback } = usePersistence<BookmarksPersistencePayload>('bookmarks');

	const { source } = useSource();

	const savePath = `${FileSystem.documentDirectory!}${source.id}_bookmarks.dat`;

	const bookmarks = useRef<Map<string, IMangaPreviewData>>(new Map<string, IMangaPreviewData>()).current;

	async function commitToStorage() {
		await FileSystem.writeAsStringAsync(savePath, JSON.stringify({ s: source.id, d: Array.from(bookmarks.values()), v: Constants.manifest!.version }), { encoding: 'utf8' });
	}

	const fetchFromStorage = useCallback(async () => {
		console.log(savePath, source.id)
		bookmarks.clear();
		const tmp = await FileSystem.getInfoAsync(savePath);
		if (tmp.exists) {
			const bookmarksAsString = await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' });

			if (bookmarksAsString) {
				(JSON.parse(bookmarksAsString).d as IMangaPreviewData[]).forEach((bookmark) => {
					bookmarks.set(bookmark.id, { id: bookmark.id, cover: bookmark.cover, title: bookmark.title });
				})
			}
		}

		tryUpdateState();
	}, [tryUpdateState, source.id])

	const addBookmark = useCallback(async (manga: IMangaPreviewData, bRecievedFromInstance: boolean = false) => {
		const bAlreadyExists = bookmarks.get(manga.id) !== undefined;

		bookmarks.set(manga.id, manga);
		//console.log('adding bookmark', manga.id, bookmarks.size)
		if (!bAlreadyExists) {
			tryUpdateState();

		}

		if (!bRecievedFromInstance) {
			sendEvent('change', { op: 'add', data: manga })
			await commitToStorage();
		}

	}, [sendEvent, tryUpdateState, bookmarks]);

	const removeBookmark = useCallback(async (id: string, bRecievedFromInstance: boolean = false) => {
		if (bookmarks.get(id)) {
			bookmarks.delete(id);

			tryUpdateState();

			if (!bRecievedFromInstance) {
				sendEvent('change', { op: 'remove', data: id })
				await commitToStorage();
			}
		}
	}, [sendEvent, tryUpdateState, bookmarks]);

	const IsBookmarked = useCallback((id: string) => {
		return bookmarks.get(id) !== undefined;
	}, [bookmarks]);

	useEffect(() => {
		async function onBookmarksUpdated({ op, data }: BookmarksPersistencePayload) {
			console.log('recieved update', op)
			switch (op) {
				case 'add':
					addBookmark((data as IMangaPreviewData), true);
					break;

				case 'remove':
					removeBookmark((data as string), true);
					break;

				case 'refresh':
					bookmarks.clear();
					await fetchFromStorage();
					break;
			}
		}
		return addCallback('change', onBookmarksUpdated)
	}, [addBookmark, removeBookmark, fetchFromStorage]);

	useEffect(() => {
		fetchFromStorage();
	}, [source.id])

	return { IsBookmarked, bookmarks: (Array.from(bookmarks.values())), addBookmark, removeBookmark }
}