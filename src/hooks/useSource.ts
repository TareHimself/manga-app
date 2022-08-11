import axios from "axios";
import { useCallback, useEffect, useRef } from "react";
import 'react-native-get-random-values';
import { MangaSource } from "../types";
import * as FileSystem from 'expo-file-system';
import usePersistence from "./usePersistence";

const DEFAULT_SOURCE: MangaSource = { id: 'mc', name: 'mangaclash' };
export default function useSource(): { setSource: (source: MangaSource) => Promise<void>; getSources: () => Promise<MangaSource[]>; source: MangaSource; getSourceIndex: (id: string) => Promise<number> } {

	const sourceRef = useRef(DEFAULT_SOURCE);

	const sourcesRef = useRef<MangaSource[]>([]);
	const savePath = `${FileSystem.documentDirectory!}global.dat`;
	const { tryUpdateState, sendEvent, addCallback } = usePersistence<MangaSource>('mangaSource');



	const getSources = useCallback(async () => {
		if (!sourcesRef.current.length) {
			const response = await axios.get('http://144.172.75.61:8089/');
			const result: MangaSource[] | null = response.data;
			sourcesRef.current = result || [] as MangaSource[];
		}
		return sourcesRef.current;
	}, [sendEvent, tryUpdateState, sourceRef.current]);

	const getSourceFromId = useCallback(async (id: string) => {
		const sources = await getSources();
		return sources.find(s => s.id === id);
	}, [getSources]);

	const getSourceIndex = useCallback(async (id: string) => {
		const source = await getSourceFromId(id);
		if (!source) return -1;
		return sourcesRef.current.indexOf(source);
	}, [getSources]);

	const commitToStorage = useCallback(async () => {
		const tmp = await FileSystem.getInfoAsync(savePath);
		if (tmp.exists) {
			const existingData = JSON.parse(await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' })) as any;
			existingData['source'] = sourceRef.current.id;
			await FileSystem.writeAsStringAsync(savePath, JSON.stringify(existingData), { encoding: 'utf8' });
		}
		else {
			const existingData = {} as any;
			existingData['source'] = sourceRef.current.id;
			await FileSystem.writeAsStringAsync(savePath, JSON.stringify(existingData), { encoding: 'utf8' });
		}
	}, [savePath, getSources])

	const setSource = useCallback(async (source: MangaSource) => {
		const bAlreadyExists = sourceRef.current.id === source.id;

		sourceRef.current = source;

		if (!bAlreadyExists) {
			tryUpdateState();
		}

		await commitToStorage();
		sendEvent('change', source)
	}, [sendEvent, tryUpdateState, sourceRef.current]);

	const fetchFromStorage = useCallback(async () => {
		const tmp = await FileSystem.getInfoAsync(savePath);
		if (tmp.exists) {
			const existingData = JSON.parse(await FileSystem.readAsStringAsync(savePath, { encoding: 'utf8' })) as any;
			const sources = await getSources();
			const source = sources.filter(s => s.id === existingData['source'])[0];
			if (source) {
				const bAlreadyExists = sourceRef.current.id === source.id;
				console.log('update to', source);
				sourceRef.current = source;

				if (!bAlreadyExists) {
					tryUpdateState();
				}
			}
		}
		console.log('fethed from storage')
	}, [tryUpdateState])

	useEffect(() => {
		async function onSourceUpdated(newSource: MangaSource) {
			const bAlreadyExists = sourceRef.current.id === newSource.id;
			console.log('update to', newSource);
			sourceRef.current = newSource;

			if (!bAlreadyExists) {
				tryUpdateState();
			}
		}

		return addCallback('change', onSourceUpdated)
	}, []);
	useEffect(() => {
		fetchFromStorage()
	}, [fetchFromStorage])

	return { setSource, getSources, source: sourceRef.current, getSourceIndex }
}