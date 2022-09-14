import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { BookmarksState, IMangaPreviewData, MangaSource } from '../../types'
import { getBookmarks, setBookmarks } from '../../db';


async function commitToStorage(sourceId: string, data: { [id: string]: IMangaPreviewData }) {
	const savePath = `${FileSystem.documentDirectory!}${sourceId}_bookmarks.dat`;
	await FileSystem.writeAsStringAsync(savePath, JSON.stringify({ s: sourceId, d: Object.values(data), v: Constants.manifest!.version }), { encoding: 'utf8' });

}

// Define the initial state using that type
const initialState: BookmarksState = {
	data: [],
	init: false
}

// First, create the thunk
const load = createAsyncThunk(
	'bookmarks/load',
	async (sourceId: string, thunkAPI) => {
		return await getBookmarks(sourceId);
	}
)

// First, create the thunk
const addBookmark = createAsyncThunk(
	'bookmarks/add',
	async ({ sourceId, manga }: { sourceId: string, manga: IMangaPreviewData }, { getState }) => {
		const { data } = (getState() as any).bookmarks as BookmarksState;
		const newData = [...data]
		newData.unshift(manga);
		await setBookmarks(sourceId, newData);

		return newData;
	}
)

// First, create the thunk
const removeBookmark = createAsyncThunk(
	'bookmarks/remove',
	async ({ sourceId, id }: { sourceId: string, id: string }, { getState }) => {
		const { data } = (getState() as any).bookmarks as BookmarksState;
		const newData = [...data]
		newData.splice(newData.findIndex(b => b.id === id), 1);
		await setBookmarks(sourceId, newData);

		return newData;
	}
)

export const bookmarksSlice = createSlice({
	name: 'bookmarks',
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		resetBookmarksInit: (state) => {
			state.init = false;
		}
	},
	extraReducers: (builder) => {
		builder.addCase(load.fulfilled, (state, action) => {
			state.data = action.payload;
			state.init = true;
		}),
			builder.addCase(addBookmark.fulfilled, (state, action) => {
				state.data = action.payload;
			}),
			builder.addCase(removeBookmark.fulfilled, (state, action) => {
				state.data = action.payload;
			})
	}
})

export const { resetBookmarksInit } = bookmarksSlice.actions
export { load, addBookmark, removeBookmark }

export default bookmarksSlice.reducer