import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IMangaDexApiChapter, IMangaDexApiChaptersResponse, IMangaReadableChapter } from "../types";
import useMounted from '../hooks/useMounted';
import { useUniqueId } from "./useUniqueId";

export default function useMangaDexChapterCdn(mangaId: string, chapter: string): [boolean, IMangaReadableChapter | undefined, (mangaId: string, chapter: string) => Promise<void>] {
    const loadedChapters = useRef(new Map<string, IMangaReadableChapter>());
    const [loadedChapter, setLoadedChapter] = useState<IMangaReadableChapter | undefined>(undefined);
    const IsMounted = useMounted();
    const uniqueId = useUniqueId();
    const [isLoadingChapter, setIsLoadingChapter] = useState(false);

    const fetchChapter = useCallback(async (mangaId: string, chapter: string) => {
        const chapterInPool = loadedChapters.current.get(chapter);
        setIsLoadingChapter(true);
        if (chapterInPool) {
            setLoadedChapter(chapterInPool);
        }
        else {
            const url = `http://144.172.75.61:8089/chapters/${mangaId}/${chapter}?id=${uniqueId}`;

            console.log(url)

            const response: IMangaReadableChapter | 'cancelled' = (await axios.get(url)).data;


            if (response !== 'cancelled') {

                loadedChapters.current.set(chapter, response);
                if (IsMounted()) setLoadedChapter(response);

            }
        }
        setIsLoadingChapter(false);
    }, [loadedChapters.current, loadedChapter, IsMounted, uniqueId, isLoadingChapter])

    useEffect(() => {
        fetchChapter(mangaId, chapter);
    }, [])

    return [isLoadingChapter, loadedChapter, fetchChapter]
}