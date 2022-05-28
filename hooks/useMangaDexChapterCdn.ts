import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IMangaDexApiChapter, IMangaDexApiChaptersResponse, IMangaDexReadableChapter } from "../types";

export default function useMangaDexChapterCdn(id: string): [IMangaDexReadableChapter | undefined, (id: string) => Promise<void>] {
    const loadedChapters = useRef(new Map<string, IMangaDexReadableChapter>());
    const [loadedChapter, setLoadedChapter] = useState<IMangaDexReadableChapter | undefined>(undefined);

    const fetchChapter = useCallback(async (id: string) => {
        const chapterInPool = loadedChapters.current.get(id);
        if (chapterInPool) {
            setLoadedChapter(chapterInPool);
        }
        else {
            const url = `https://api.mangadex.org/at-home/server/${id}`;

            const response: IMangaDexReadableChapter = (await axios.get(url)).data;

            loadedChapters.current.set(id, response);
            setLoadedChapter(response);
        }
    }, [loadedChapters.current, loadedChapter])

    useEffect(() => {
        fetchChapter(id);
    }, [])

    return [loadedChapter, fetchChapter]
}