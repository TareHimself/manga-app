import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { ChaptersState, IMangaChapter, IMangaPreviewData, IStoredMangaChapter, MangaSource } from '../../types'
import axios from 'axios';
import { encode } from 'base64-arraybuffer';
import { resolveAllPromises } from '../../utils';


async function commitToStorage(sourceId: string, mangaId: string, data: IStoredMangaChapter[]) {
	const savePath = `${FileSystem.documentDirectory!}${sourceId}_${mangaId}.dat`;
	await FileSystem.writeAsStringAsync(savePath, JSON.stringify({ d: data, v: Constants.manifest!.version }), { encoding: 'utf8' });

}

// Define the initial state using that type
const initialState: ChaptersState = {
	chapters: {},
	loadedChapters: [],
	chaptersBeingDownloaded: [],
}



async function downloadPageFromUrl(url: string, index: number): Promise<[string, number]> {
	try {
		const imageResponse = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
		const result = ["data:image/png;base64, " + encode(imageResponse.data), index] as [string, number];
		return result;
	} catch (error) {
		console.log('error while downloading page', (error as any).message);

		return await downloadPageFromUrl(url, index);
	}

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

		const savePath = `${FileSystem.documentDirectory!}${source}_${manga}.dat`;


		if (!chapters.loadedChapters.includes(source + manga)) {
			const tmp = await FileSystem.getInfoAsync(savePath);
			if (tmp.exists) {
				const loadedFile = await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' });
				data = (JSON.parse(loadedFile) as any).d
			}
		}

		try {
			const url = `http://10.200.4.16:8089/${source}/${manga}/chapters/`
			const response: IMangaChapter[] | 'cancelled' = (await axios.get(url))?.data;

			if (response !== 'cancelled' && response[0]?.id !== data[0]?.id) {
				const chaptersAdded = [] as string[];
				response.forEach((res) => {
					if (!chaptersAdded.includes(res.id)) {
						chaptersAdded.push(res.id);
						data.push({ ...res, downloadedPages: [] });
					}
				})

				commitToStorage(source, manga, data);
			}
		} catch (error) {

		}

		return {
			id: source + manga, data
		}
	}
)

// First, create the thunk
const downloadChapter = createAsyncThunk(
	'chapters/download',
	async ({ sourceId, mangaId, chapterIndex }: { sourceId: string; mangaId: string; chapterIndex: number }, { getState }) => {

		let result: string[] = [];

		const { chapters } = (await getState()) as {
			chapters: ChaptersState;
		};

		const chapter = chapters.chapters[sourceId + mangaId][chapterIndex];

		const url = `http://10.200.4.16:8089/${sourceId}/${mangaId}/chapters/${chapter.id}`;
		const response: string[] | 'cancelled' = (await axios.get(url))?.data;
		if (response !== 'cancelled') {
			result = (await resolveAllPromises(response.map((res, idx) => { return downloadPageFromUrl(res, idx) }))).sort((a, b) => a[1] - b[1]).map(a => a[0]);
		}

		const dataToStore = [...chapters.chapters[sourceId + mangaId]];
		dataToStore[chapterIndex].downloadedPages = result;
		commitToStorage(sourceId, mangaId, dataToStore);

		return {
			id: sourceId + mangaId,
			index: chapterIndex,
			chapter: { ...chapter, downloadedPages: result }
		}
	}
)

export const chaptersSlice = createSlice({
	name: 'chapters',
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		addPendingDownload: (state, action: PayloadAction<string>) => {
			state.chaptersBeingDownloaded.push(action.payload);
		}
	},
	extraReducers: (builder) => {
		builder.addCase(loadChapters.fulfilled, (state, action) => {
			state.chapters[action.payload.id] = action.payload.data;
		}),
			builder.addCase(downloadChapter.fulfilled, (state, action) => {
				state.chapters[action.payload.id][action.payload.index] = action.payload.chapter;
				state.chaptersBeingDownloaded.splice(state.chaptersBeingDownloaded.indexOf(action.payload.id + action.payload.chapter.id));
			})
	}
})

export const { addPendingDownload } = chaptersSlice.actions
export { loadChapters, downloadChapter }

export default chaptersSlice.reducer