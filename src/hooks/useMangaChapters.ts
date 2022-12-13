import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { loadChapters } from "../redux/slices/chaptersSlice";
import { IStoredMangaChapter } from "../types";
import useSource from "./useSource";

export default function useMangaChapters(id: string): IStoredMangaChapter[] {

    const loadedChapters = useAppSelector((state) => state.chapters.chapters);
    const dispatch = useAppDispatch();

    const { source } = useSource();

    useEffect(() => {

        dispatch(loadChapters(`${source.id}|${id}`))
    }, [])

    return loadedChapters[source.id + id] || []
}