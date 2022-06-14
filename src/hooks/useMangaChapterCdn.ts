import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IMangaDexApiChapter, IMangaDexApiChaptersResponse, IMangaReadableChapter } from "../types";
import useMounted from '../hooks/useMounted';

export default function useMangaDexChapterCdn(mangaId: string, chapter: string): [IMangaReadableChapter | undefined, (mangaId: string, chapter: string) => Promise<void>] {
    const loadedChapters = useRef(new Map<string, IMangaReadableChapter>());
    const [loadedChapter, setLoadedChapter] = useState<IMangaReadableChapter | undefined>(undefined);
    const IsMounted = useMounted();

    const fetchChapter = useCallback(async (mangaId: string, chapter: string) => {
        const chapterInPool = loadedChapters.current.get(chapter);
        if (chapterInPool) {
            setLoadedChapter(chapterInPool);
        }
        else {
            const url = `http://144.172.75.61:8089/chapters/${mangaId}/${chapter}`;

            console.log(url)
            const response: IMangaReadableChapter = (await axios.get(url)).data;
            loadedChapters.current.set(chapter, response);

            if (IsMounted()) {
                setLoadedChapter(response);
            }
        }
    }, [loadedChapters.current, loadedChapter, IsMounted])

    useEffect(() => {
        fetchChapter(mangaId, chapter);
    }, [])

    return [loadedChapter, fetchChapter]
}