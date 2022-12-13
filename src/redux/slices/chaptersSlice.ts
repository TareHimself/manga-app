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
import { ApiBaseUrl } from '../../constants/Urls';

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
			const url = `${ApiBaseUrl}${source}/chapters/${manga}`
			const response = (await axios.get<IMangaChapter[] | 'cancelled'>(url))?.data;
			if (response !== 'cancelled' && response.length) {
				console.log("Chapters from storage", data.length, "Chapters from api", response.length)
				const currentData = data.reduce((t, d) => {
					t[d.id] = d
					return t
				}, {} as { [key: string]: IStoredMangaChapter });

				data = response.map((r) => {
					const existing = currentData[r.id]
					return { id: r.id, title: r.title, offline: existing?.offline || 0, read: existing?.read || 0 }
				})
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