import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { loadChapters } from "../redux/slices/chaptersSlice";
import { IStoredMangaChapter } from "../types";

export default function useMangaChapters(chapterId: string, sourceId: string): IStoredMangaChapter[] {

    const loadedChapters = useAppSelector((state) => state.chapters.chapters);
    const dispatch = useAppDispatch();

    const index = `${sourceId}|${chapterId}`
    useEffect(() => {
        dispatch(loadChapters(index))
    }, [])

    return loadedChapters[index] || []
}