import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { ChaptersState, IMangaChapter, IMangaPreviewData, IStoredMangaChapter, MangaSource } from '../../types'
import axios from 'axios';
import { encode } from 'base64-arraybuffer';
import { downloadChapter as downloadUtil } from '../../utils';
import { resolveAllPromises } from '../../utils';
import { getChapters, setChapters, updateChapter } from '../../db';


async function commitInfoToStorage(sourceId: string, mangaId: string, data: IStoredMangaChapter[]) {
	const savePath = `${FileSystem.documentDirectory!}chapters/${sourceId}/${mangaId}/info.dat`;
	await FileSystem.writeAsStringAsync(savePath, JSON.stringify({ d: data, v: Constants.manifest!.version }), { encoding: 'utf8' });
}


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

		console.log('start chapter load')
		let data = [] as IStoredMangaChapter[];
		const [source, manga] = idAndManga.split('|');
		const { chapters } = (await getState()) as {
			chapters: ChaptersState;
		};

		if (!chapters.loadedChapters.includes(source + manga)) {

		}

		data = await getChapters(source, manga);

		console.log(data.length)


		try {

			console.log('url load')
			const url = `http://144.172.75.61:8089/${source}/${manga}/chapters/`
			const response: IMangaChapter[] | 'cancelled' = (await axios.get(url))?.data;

			if (response !== 'cancelled' && response[0]?.id !== data[0]?.id) {
				console.log(response[0]?.id, data[0]?.id)
				const chaptersAdded = [] as string[];
				console.log('recieved response')
				response.forEach((res) => {
					if (!chaptersAdded.includes(res.id)) {
						chaptersAdded.push(res.id);
						data.push({ ...res, offline: 0, read: 0 });
					}
				})

				console.log('saving response to storage')

				setChapters(source, manga, data);
			}
		} catch (error) {
			console.log(error)
		}

		console.log('end chapter load')

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
		console.log('download start');
		await downloadUtil(sourceId, mangaId, c.id, onProgress);
		console.log('download end')
		c.offline = 1;
		await updateChapter(sourceId, mangaId, c);
		console.log('chapter updated')

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

export const { addPendingAction } = chaptersSlice.actions
export { loadChapters, downloadChapter, deleteChapter }

export default chaptersSlice.reducer