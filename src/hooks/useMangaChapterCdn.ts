import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useMounted from '../hooks/useMounted';
import useSource from "./useSource";
import { useUniqueId } from "./useUniqueId";

export default function useMangaDexChapterCdn(mangaId: string, chapterId: string): [boolean, string[] | undefined, (mangaId: string, chapter: string) => Promise<void>] {
    const loadedChapters = useRef(new Map<string, string[]>());
    const [loadedChapter, setLoadedChapter] = useState<string[] | undefined>(undefined);
    const IsMounted = useMounted();
    const uniqueId = useUniqueId();
    const [isLoadingChapter, setIsLoadingChapter] = useState(false);

    const { source } = useSource();

    const fetchChapter = useCallback(async (mangaId: string, chapterId: string) => {
        const chapterInPool = loadedChapters.current.get(chapterId);
        setIsLoadingChapter(true);
        if (chapterInPool) {
            setLoadedChapter(chapterInPool);
        }
        else {
            const url = `http://144.172.75.61:8089/${source.id}/${mangaId}/chapters/${chapterId}`;

            const response: string[] | 'cancelled' = (await axios.get(url)).data;

            if (response !== 'cancelled') {

                loadedChapters.current.set(chapterId, response);
                if (IsMounted()) setLoadedChapter(response);

            }
        }
        setIsLoadingChapter(false);
    }, [loadedChapters.current, loadedChapter, IsMounted, uniqueId, isLoadingChapter, source])

    useEffect(() => {
        fetchChapter(mangaId, chapterId);
    }, [])

    return [isLoadingChapter, loadedChapter, fetchChapter]
}