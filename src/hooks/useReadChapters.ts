import { useCallback, useEffect, useRef, useState } from "react";
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import useMounted from "./useMounted";
import { getChaptersEmitter } from "../emitters";

export default function useReadChapters(mangaId: string): { readChapters: string[], hasReadChapter: (chapter: string) => boolean, addReadChapter: (chapter: string) => Promise<void> } {

	const instanceId = useRef(uuidv4()).current;

	const IsMounted = useMounted();
	const [chaptersRead, setChaptersRead] = useState<string[]>([]);

	const hasReadChapter = useCallback((chapter: string) => {
		return chaptersRead.includes(chapter.trim().toLowerCase());
	}, [chaptersRead, setChaptersRead, mangaId]);

	const addReadChapter = useCallback(async (chapter: string) => {
		const chapterFormatted = chapter.trim().toLowerCase();

		if (hasReadChapter(chapterFormatted)) return;

		const newReadChapters = [...chaptersRead, chapterFormatted]

		getChaptersEmitter().emit('update', instanceId, newReadChapters);
		setChaptersRead(newReadChapters);

		await SecureStore.setItemAsync(`${mangaId.toLowerCase()}-chapter-tracker`, newReadChapters.join('|'));
	}, [chaptersRead, setChaptersRead, mangaId]);




	useEffect(() => {
		async function loadChaptersRead(mangaId: string) {
			const chaptersAsString = await SecureStore.getItemAsync(`${mangaId}-chapter-tracker`);
			if (chaptersAsString) {

			}
			console.log(chaptersAsString)
		}

		function onChaptersReadUpdated(causer: string, update: string[]) {
			if (causer !== instanceId && IsMounted()) {
				setChaptersRead(update)
			}
		}

		getChaptersEmitter().addListener('update', onChaptersReadUpdated);

		loadChaptersRead(mangaId.toLowerCase());

		return () => { getChaptersEmitter().removeListener('update', onChaptersReadUpdated) }
	}, [])

	return { readChapters: chaptersRead, hasReadChapter, addReadChapter }
}