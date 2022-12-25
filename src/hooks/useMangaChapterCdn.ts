import axios from "axios";
import * as FileSystem from 'expo-file-system';
import { useCallback, useRef, useState } from "react";
import { ApiBaseUrl } from "../constants/Urls";
import useMounted from '../hooks/useMounted';
import { useAppSelector } from "../redux/hooks";
import { clamp, resolveAllPromises } from "../utils";

export default function useMangaDexChapterCdn(mangaId: string, sourceId: string): [boolean, string[] | undefined, (chapterIndex: number) => Promise<boolean>] {
    const loadedChapters = useRef(new Map<string, string[]>());
    const [loadedChapter, setLoadedChapter] = useState<string[] | undefined>(undefined);
    const IsMounted = useMounted();
    const [isLoadingChapter, setIsLoadingChapter] = useState(false);

    const downloads = useAppSelector(state => state.chapters.hasPendingAction);

    const allMangaChapters = useAppSelector(state => state.chapters.chapters[sourceId + mangaId]);

    const fetchChapter = useCallback(async (chapterIndex: number) => {
        const targetChapter = allMangaChapters[clamp(chapterIndex, 0, allMangaChapters.length - 1)];

        const chapterInPool = loadedChapters.current.get(targetChapter.id);
        setIsLoadingChapter(true);
        if (chapterInPool) {
            setLoadedChapter(chapterInPool);
            return true;
        }
        else {
            if (!downloads.includes(sourceId + mangaId + targetChapter.id) && targetChapter.offline) {
                const files = await FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory!}chapters/${sourceId}/${mangaId}/${targetChapter.id}/`);

                const pages = (await resolveAllPromises(files.map((f) => {
                    return new Promise<[string, number]>(async (resolve) => {
                        const result: [string, number] = [await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory!}chapters/${sourceId}/${mangaId}/${targetChapter.id}/${f}`), parseInt(f.slice(0, -5), 10)];
                        resolve(result);
                    })
                }))).sort((a, b) => a[1] - b[1]).map(a => a[0])
                loadedChapters.current.set(targetChapter.id, pages);
                if (IsMounted()) setLoadedChapter(pages);
                return true;
            }

            try {
                const url = `${ApiBaseUrl}${sourceId}/chapters/${mangaId}/${targetChapter.id}`;

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
    }, [loadedChapters.current, loadedChapter, IsMounted, isLoadingChapter, allMangaChapters])

    return [isLoadingChapter, loadedChapter, fetchChapter]
}