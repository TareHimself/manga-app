import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useMounted from '../hooks/useMounted';
import { useAppSelector } from "../redux/hooks";
import useSource from "./useSource";
import { useUniqueId } from "./useUniqueId";

export default function useMangaDexChapterCdn(mangaId: string): [boolean, string[] | undefined, (chapterIndex: number) => Promise<boolean>] {
    const loadedChapters = useRef(new Map<string, string[]>());
    const [loadedChapter, setLoadedChapter] = useState<string[] | undefined>(undefined);
    const IsMounted = useMounted();
    const uniqueId = useUniqueId();
    const [isLoadingChapter, setIsLoadingChapter] = useState(false);

    const { source } = useSource();

    const downloads = useAppSelector(state => state.chapters.chaptersBeingDownloaded);

    const allMangaChapters = useAppSelector(state => state.chapters.chapters[source.id + mangaId]);

    const fetchChapter = useCallback(async (chapterIndex: number) => {
        const targetChapter = allMangaChapters[chapterIndex];

        const chapterInPool = loadedChapters.current.get(targetChapter.id);
        setIsLoadingChapter(true);
        if (chapterInPool) {
            setLoadedChapter(chapterInPool);
            return true;
        }
        else {
            if (!downloads.includes(source.id + mangaId + targetChapter.id) && targetChapter.downloadedPages.length > 0) {
                loadedChapters.current.set(targetChapter.id, targetChapter.downloadedPages);
                if (IsMounted()) setLoadedChapter(targetChapter.downloadedPages);
                return true;
            }

            try {
                const url = `http://10.200.4.16:8089/${source.id}/${mangaId}/chapters/${targetChapter.id}`;

                const response: string[] | 'cancelled' = (await axios.get(url)).data;

                if (response !== 'cancelled') {

                    loadedChapters.current.set(targetChapter.id, response);
                    if (IsMounted()) setLoadedChapter(response);
                    return true;
                }

                return false;
            } catch (error) {
                return false;
            }

        }
        setIsLoadingChapter(false);
    }, [loadedChapters.current, loadedChapter, IsMounted, uniqueId, isLoadingChapter, source, allMangaChapters])

    return [isLoadingChapter, loadedChapter, fetchChapter]
}