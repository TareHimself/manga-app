import { useCallback, useEffect, useRef, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import useMounted from "./useMounted";
import { IMangaData } from "../types";
import { getBookmarksEmitter, getChaptersEmitter } from "../emitters";

export default function useBookmarks(): { IsBookmarked: (id: string) => boolean; bookmarks: IMangaData[], addBookmark: (manga: IMangaData) => Promise<void>, removeBookmark: (id: string) => Promise<void> } {

	const instanceId = useRef(uuidv4()).current;

	const IsMounted = useMounted();

	const bookmarks = useRef<Map<string, IMangaData>>(new Map<string, IMangaData>()).current;

	const [forcedRenders, setForcedRenders] = useState(0);

	async function commitToStorage() {
		await SecureStore.setItemAsync(`bookmarks`, JSON.stringify({ d: Array.from(bookmarks.values()) }));
	}

	async function fetchFromStorage() {
		const bookmarksAsString = await SecureStore.getItemAsync(`bookmarks`);

		if (bookmarksAsString) {
			(JSON.parse(bookmarksAsString).d as IMangaData[]).forEach((bookmark) => {
				bookmarks.set(bookmark.id, bookmark);
			})
		}
	}

	const addBookmark = useCallback(async (manga: IMangaData, broadcast: boolean = true) => {
		const bAlreadyExists = bookmarks.get(manga.id) !== undefined;

		bookmarks.set(manga.id, manga);

		if (IsMounted() && !bAlreadyExists) {
			setForcedRenders(forcedRenders + 1);
		}

		if (broadcast) {
			getBookmarksEmitter().emit('update', instanceId, 'add', manga);
			await commitToStorage();
		}

	}, [instanceId, forcedRenders, setForcedRenders, bookmarks, IsMounted]);

	const removeBookmark = useCallback(async (id: string, broadcast: boolean = true) => {
		if (bookmarks.get(id)) {
			bookmarks.delete(id);

			if (IsMounted()) {
				setForcedRenders(forcedRenders + 1);
			}

			if (broadcast) {
				getBookmarksEmitter().emit('update', instanceId, 'remove', id);
				await commitToStorage();
			}
		}
	}, [instanceId, forcedRenders, setForcedRenders, bookmarks, IsMounted]);

	const IsBookmarked = useCallback((id: string) => {
		return bookmarks.get(id) !== undefined;
	}, [instanceId, forcedRenders, setForcedRenders, bookmarks, IsMounted]);

	useEffect(() => {
		function onBookmarksUpdated(causer: string, method: 'add' | 'remove', update: IMangaData | string) {

			if (causer !== instanceId && IsMounted()) {
				switch (method) {
					case 'add':
						addBookmark((update as IMangaData), false);
						break;

					case 'remove':
						removeBookmark((update as string), false);
						break;
				}
			}
		}

		getBookmarksEmitter().addListener('update', onBookmarksUpdated);
		return () => { getBookmarksEmitter().removeListener('update', onBookmarksUpdated) }
	}, [forcedRenders]);

	useEffect(() => {

		async function loadBookmarks() {
			await fetchFromStorage();

			if (IsMounted()) {
				setForcedRenders(forcedRenders + 1);
			}
		}

		loadBookmarks();
	}, [instanceId])

	return { IsBookmarked, bookmarks: (Array.from(bookmarks.values())), addBookmark, removeBookmark }
}