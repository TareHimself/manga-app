import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { IMangaData, IMangaPreviewData } from "../types";
import useMounted from "./useMounted";
import { useUniqueId } from "./useUniqueId";
import { compareTwoStrings } from "string-similarity";
import useSource from "./useSource";
import MangaPreview from "../components/MangaPreview";
export const DefaultMangaSearch = { "s": "" };

export default function useMangaDexSearch(search: Record<string, string> = DefaultMangaSearch): [IMangaPreviewData[], (search: Record<string, string>) => Promise<void>] {
    const [results, setResults] = useState<IMangaPreviewData[]>([]);
    const uniqueId = useUniqueId();
    const lastRequestController = useRef<AbortController | null>();

    const { source } = useSource();
    console.log(source.id)
    const makeSearch = useCallback(async (search: Record<string, string> = DefaultMangaSearch) => {
        try {

            const url = `http://144.172.75.61:8089/${source.id}/search?${new URLSearchParams({ ...search }).toString()}`;

            console.log(url)
            if (lastRequestController.current) {
                lastRequestController.current.abort();
                lastRequestController.current = new AbortController();
            }
            else {
                lastRequestController.current = new AbortController();
            }

            if (lastRequestController.current) {

                axios.get(url, {
                    signal: lastRequestController.current.signal
                }).then((response) => {
                    const result: IMangaPreviewData[] = response.data;
                    if (search['s'].toLowerCase().trim() && search['s'].toLowerCase().trim().length > 3) {
                        result.sort((a, b) => {
                            const aRelavance = compareTwoStrings(a.title.toLowerCase().trim(), search['s'].toLowerCase().trim());
                            const bRelavance = compareTwoStrings(b.title.toLowerCase().trim(), search['s'].toLowerCase().trim());

                            if (aRelavance > bRelavance) return -1;

                            if (aRelavance < bRelavance) return 1;

                            return 0;
                        });
                    }
                    console.log(result[0].cover)
                    setResults([...result]);
                }).catch((error) => {
                });
            }

        } catch (error) {
            console.log(error);
        }
    }, [results, uniqueId, lastRequestController.current, source.id])

    useEffect(() => {

        lastRequestController.current = new AbortController();

        return () => {
            if (lastRequestController.current) {
                lastRequestController.current.abort();
                lastRequestController.current = null;
            }

        }
    }, [])

    useEffect(() => {
        console.log('source changed', source.id)
        makeSearch(search);
    }, [source.id])

    return [results, makeSearch]
} 