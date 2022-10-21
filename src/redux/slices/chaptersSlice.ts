import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { ChaptersState, IMangaChapter, IMangaPreviewData, IStoredMangaChapter, MangaSource } from '../../types'
import axios from 'axios';
import { encode } from 'base64-arraybuffer';
import { downloadChapter as downloadUtil } from '../../utils';
import { resolveAllPromises } from '../../utils';
import { addChapters, getChapters, overwriteChapters, updateChapter } from '../../db';

// Define the initial state using that type
const initialState: ChaptersState = {
	chapters: {},
	loadedChapters: [],
	hasPendingAction: [],
}


// First, create the thunk
const loadChapters = createAsyncThunk(
	'chapters/load',
	async (idAndManga: string, { getState }) => {

		let data = [] as IStoredMangaChapter[];
		const [source, manga] = idAndManga.split('|');
		const { chapters } = (await getState()) as {
			chapters: ChaptersState;
		};

		data = await getChapters(source, manga);

		try {
			const url = `https://proxy.oyintare.dev/manga/${source}/chapters/${manga}`
			const response: IMangaChapter[] | 'cancelled' = (await axios.get(url))?.data;
			if (response !== 'cancelled' && response.length) {
				if (!data.length) {
					const chaptersAdded = [] as string[];
					response.forEach((res) => {
						if (!chaptersAdded.includes(res.id)) {
							chaptersAdded.push(res.id);
							data.push({ ...res, offline: 0, read: 0 });
						}
					})
					overwriteChapters(source, manga, data);
				} else if (response[0].id.trim() !== data[0].id.trim()) {
					const targetIndex = response.findIndex(a => a.id === data[0].id);
					const newItems = response.slice(0, targetIndex)
					const newData: IStoredMangaChapter[] = [];
					const chaptersAdded = [] as string[];
					newItems.forEach((n) => {
						if (!chaptersAdded.includes(n.id)) {
							chaptersAdded.push(n.id);
							newData.push({ ...n, offline: 0, read: 0 });
						}
					})
					data = [...newData, ...data];
					addChapters(source, manga, newData, newData.map((d, idx) => { return (data.length - 1) - idx }));

				}
			}

		} catch (error) {
			console.log(error)
		}
		return {
			id: source + manga, data
		}
	}
)

// First, create the thunk
const downloadChapter = createAsyncThunk(
	'chapters/download',
	async ({ sourceId, mangaId, chapterIndex, chapter, onProgress }: { sourceId: string; mangaId: string; chapterIndex: number; chapter: IStoredMangaChapter; onProgress: (progress: number) => void; }, { getState }) => {
		const c = { ...chapter };
		await downloadUtil(sourceId, mangaId, c.id, onProgress);
		c.offline = 1;
		await updateChapter(sourceId, mangaId, c);

		return {
			source: sourceId,
			manga: mangaId,
			id: sourceId + mangaId,
			index: chapterIndex,
			chapter: c
		}
	}
)


// First, create the thunk
const deleteChapter = createAsyncThunk(
	'chapters/delete',
	async ({ sourceId, mangaId, chapterIndex, chapter }: { sourceId: string; mangaId: string; chapterIndex: number, chapter: IStoredMangaChapter }) => {

		try {
			await FileSystem.deleteAsync(`${FileSystem.documentDirectory!}chapters/${sourceId}/${mangaId}/${chapter.id}`);
		} catch (error) {
			console.log(error);
		}

		const c = { ...chapter };
		c.offline = 0;
		await updateChapter(sourceId, mangaId, c);

		return {
			source: sourceId,
			manga: mangaId,
			id: sourceId + mangaId,
			index: chapterIndex,
			chapter: c
		}
	}
)

export const chaptersSlice = createSlice({
	name: 'chapters',
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		addPendingAction: (state, action: PayloadAction<string>) => {
			state.hasPendingAction.push(action.payload);
		},
		setChapterAsRead: (state, action: PayloadAction<[string, string, number, IStoredMangaChapter]>) => {
			const chapter = { ...action.payload[3] }
			chapter.read = 1;
			state.chapters[action.payload[0] + action.payload[1]][action.payload[2]] = chapter;
			updateChapter(action.payload[0], action.payload[1], chapter)
		}
	},
	extraReducers: (builder) => {
		builder.addCase(loadChapters.fulfilled, (state, action) => {
			state.chapters[action.payload.id] = action.payload.data;
		}),
			builder.addCase(downloadChapter.fulfilled, (state, action) => {
				console.log(action.payload.chapter)
				state.chapters[action.payload.id][action.payload.index] = action.payload.chapter;
				state.hasPendingAction.splice(state.hasPendingAction.indexOf(action.payload.id + action.payload.chapter.id), 1);
			}),
			builder.addCase(deleteChapter.fulfilled, (state, action) => {
				state.chapters[action.payload.id][action.payload.index] = action.payload.chapter;
				state.hasPendingAction.splice(state.hasPendingAction.indexOf(action.payload.id + action.payload.chapter.id), 1);
			})
	}
})

export const { addPendingAction, setChapterAsRead } = chaptersSlice.actions
export { loadChapters, downloadChapter, deleteChapter }

export default chaptersSlice.reducer