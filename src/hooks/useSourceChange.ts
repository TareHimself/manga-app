import { useRef, useEffect } from "react";
import { useAppSelector } from "../redux/hooks";
import { MangaSource } from "../types";

export type MangaSourceChangedCallback = (old: MangaSource, current: MangaSource) => void;

export default function useSourceChange(callback: MangaSourceChangedCallback) {

	const lastSource = useRef(useAppSelector(state => state.source.source));
	const currentSource = useAppSelector(state => state.source.source);

	useEffect(() => {
		if (lastSource.current.id !== currentSource.id) {
			if (callback) callback(lastSource.current, currentSource);
			lastSource.current = currentSource;
		}
	}, [currentSource]);
}