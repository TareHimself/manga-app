import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import Constants from "expo-constants"
import * as FileSystem from 'expo-file-system';
import { MangaSource, SourceState } from '../../types'
import Toast from 'react-native-root-toast';
import axios from 'axios';

const DEFAULT_SOURCE: MangaSource = { id: 'mc', name: 'mangaclash' };

// Define the initial state using that type
const initialState: SourceState = {
	sources: [],
	source: DEFAULT_SOURCE,
	init: false
}

async function commitToStorage(id: string) {
	const savePath = `${FileSystem.documentDirectory!}global.dat`;
	const tmp = await FileSystem.getInfoAsync(savePath);
	if (tmp.exists) {
		const existingData = JSON.parse(await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' })) as any;
		existingData['source'] = id;
		await FileSystem.writeAsStringAsync(savePath, JSON.stringify(existingData), { encoding: 'utf8' });
	}
	else {
		const existingData = {} as any;
		existingData['source'] = id;
		await FileSystem.writeAsStringAsync(savePath, JSON.stringify(existingData), { encoding: 'utf8' });
	}
}

// First, create the thunk
const loadSource = createAsyncThunk(
	'source/loadSource',
	async (sourceId: string, thunkAPI) => {
		const response = await axios.get('https://manga.oyintare.dev/');
		const sourcesFromApi: MangaSource[] = response.data || [];
		let currentSource: MangaSource = sourcesFromApi[0] || DEFAULT_SOURCE;

		const savePath = `${FileSystem.documentDirectory!}global.dat`;

		const tmp = await FileSystem.getInfoAsync(savePath);
		if (tmp.exists) {
			const existingData = JSON.parse(await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' })) as any;
			if (existingData['source']) {
				const indexInApi = sourcesFromApi.findIndex(d => d.id === existingData['source'])
				if (indexInApi > -1) {
					currentSource = sourcesFromApi[indexInApi];
				}
			}
		}

		return { sources: sourcesFromApi, source: currentSource };
	}
)

export const sourceSlice = createSlice({
	name: 'source',
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		incrementSource: (state) => {
			const currentIndex = state.sources.findIndex(s => s.id === state.source.id);
			const newIndex = currentIndex + 1 >= state.sources.length ? 0 : currentIndex + 1;
			state.source = state.sources[newIndex];
			commitToStorage(state.source.id);

			Toast.show(`Source Changed To ${state.source.name}`, {
				duration: Toast.durations.SHORT,
				position: -80
			});

		},
		setSourceByIndex: (state, action: PayloadAction<number>) => {
			state.source = state.sources[action.payload];
			commitToStorage(state.source.id);

			Toast.show(`Source Changed To ${state.source.name}`, {
				duration: Toast.durations.SHORT,
				position: -80
			});
		},
		setSource: (state, action: PayloadAction<string>) => {
			state.source = state.sources.find(s => s.id === action.payload) || state.sources[0];
		}
	},
	extraReducers: (builder) => {
		builder.addCase(loadSource.fulfilled, (state, action) => {
			state.source = action.payload.source;
			state.sources = action.payload.sources;
			state.init = true;
		})
	}
})

export const { incrementSource, setSourceByIndex, setSource } = sourceSlice.actions
export { loadSource }

export default sourceSlice.reducer