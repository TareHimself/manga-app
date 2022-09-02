import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { BookmarksState, IMangaPreviewData, MangaSource } from '../../types'


async function commitToStorage(sourceId: string, data: { [id: string]: IMangaPreviewData }) {
	const savePath = `${FileSystem.documentDirectory!}${sourceId}_bookmarks.dat`;
	await FileSystem.writeAsStringAsync(savePath, JSON.stringify({ s: sourceId, d: Object.values(data), v: Constants.manifest!.version }), { encoding: 'utf8' });

}

// Define the initial state using that type
const initialState: BookmarksState = {
	data: {},
	init: false
}

// First, create the thunk
const load = createAsyncThunk(
	'bookmarks/load',
	async (sourceId: string, thunkAPI) => {
		const savePath = `${FileSystem.documentDirectory!}${sourceId}_bookmarks.dat`;
		const tmp = await FileSystem.getInfoAsync(savePath);
		if (tmp.exists) {
			const bookmarksAsString = await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' });

			if (bookmarksAsString) {
				return JSON.parse(bookmarksAsString).d as IMangaPreviewData[];
			}
		}

		return []
	}
)

export const bookmarksSlice = createSlice({
	name: 'bookmarks',
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		add: (state, action: PayloadAction<{ sourceId: string; item: IMangaPreviewData }>) => {
			state.data[action.payload.item.id] = action.payload.item;

			commitToStorage(action.payload.sourceId, state.data);
		},
		remove: (state, action: PayloadAction<{ sourceId: string; id: string }>) => {
			delete state.data[action.payload.id];
			commitToStorage(action.payload.sourceId, state.data);
		},
		resetBookmarksInit: (state) => {
			state.init = false;
		}
	},
	extraReducers: (builder) => {
		builder.addCase(load.fulfilled, (state, action) => {
			state.data = {};
			state.init = true;
			action.payload.forEach((d) => {
				state.data[d.id] = d;
			})
		})
	}
})

export const { add, remove, resetBookmarksInit } = bookmarksSlice.actions
export { load }

export default bookmarksSlice.reducer