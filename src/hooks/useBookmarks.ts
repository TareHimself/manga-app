import { useCallback, useEffect, useRef, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import useMounted from "./useMounted";
import Constants from "expo-constants"
import { IMangaData, IMangaPreviewData } from "../types";
import { getBookmarksEmitter, getChaptersEmitter } from "../emitters";
import * as FileSystem from 'expo-file-system';

export default function useBookmarks(): { IsBookmarked: (id: string) => boolean; bookmarks: IMangaPreviewData[], addBookmark: (manga: IMangaPreviewData) => Promise<void>, removeBookmark: (id: string) => Promise<void> } {

	const savePath = `${FileSystem.documentDirectory!}bookmarks.dat`;

	const instanceId = useRef(uuidv4()).current;

	const IsMounted = useMounted();

	const bookmarks = useRef<Map<string, IMangaPreviewData>>(new Map<string, IMangaPreviewData>()).current;

	const [forcedRenders, setForcedRenders] = useState(0);

	async function commitToStorage() {
		await FileSystem.writeAsStringAsync(savePath, JSON.stringify({ d: Array.from(bookmarks.values()), v: Constants.manifest!.version }), { encoding: 'utf8' });
	}

	async function fetchFromStorage() {
		const tmp = await FileSystem.getInfoAsync(savePath);
		if (tmp.exists) {
			const bookmarksAsString = await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' });

			if (bookmarksAsString) {
				(JSON.parse(bookmarksAsString).d as IMangaPreviewData[]).forEach((bookmark) => {
					bookmarks.set(bookmark.id, { id: bookmark.id, cover: bookmark.cover, title: bookmark.title });
				})
			}
		}

		if (IsMounted()) {
			setForcedRenders(forcedRenders + 1);
		}
	}

	const addBookmark = useCallback(async (manga: IMangaPreviewData, broadcast: boolean = true) => {
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
		async function onBookmarksUpdated(causer: string, method: 'add' | 'remove' | 'refresh', update: IMangaPreviewData | string) {

			if (causer !== instanceId && IsMounted()) {
				switch (method) {
					case 'add':
						addBookmark((update as IMangaPreviewData), false);
						break;

					case 'remove':
						removeBookmark((update as string), false);
						break;

					case 'refresh':
						console.log('refresh recieved')
						bookmarks.clear();
						await fetchFromStorage();
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
		}

		loadBookmarks();
	}, [instanceId])

	return { IsBookmarked, bookmarks: (Array.from(bookmarks.values())), addBookmark, removeBookmark }
}