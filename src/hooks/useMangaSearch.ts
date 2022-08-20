import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { IMangaData, IMangaPreviewData } from "../types";
import useMounted from "./useMounted";
import { useUniqueId } from "./useUniqueId";
import { compareTwoStrings } from "string-similarity";
import useSource from "./useSource";
import MangaPreview from "../components/MangaPreview";
import Toast from "react-native-root-toast";
export const DefaultMangaSearch = '';

export default function useMangaDexSearch(search: string = DefaultMangaSearch, onSearchCompleted?: (results: IMangaPreviewData[]) => void): [IMangaPreviewData[], (search?: string) => Promise<void>] {
    const [results, setResults] = useState<IMangaPreviewData[]>([]);
    const uniqueId = useUniqueId();
    const lastRequestController = useRef<AbortController | null>();

    const { source } = useSource();

    const makeSearch = useCallback(async (search: string = DefaultMangaSearch) => {
        try {
            console.log(search)
            const url = `http://144.172.75.61:8089/${source.id}/search?${new URLSearchParams({ s: search }).toString()}`;

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
                    if (search.toLowerCase().trim() && search.toLowerCase().trim().length > 3) {
                        result.sort((a, b) => {
                            const aRelavance = compareTwoStrings(a.title.toLowerCase().trim(), search.toLowerCase().trim());
                            const bRelavance = compareTwoStrings(b.title.toLowerCase().trim(), search.toLowerCase().trim());

                            if (aRelavance > bRelavance) return -1;

                            if (aRelavance < bRelavance) return 1;

                            return 0;
                        });
                    }
                    setResults([...result]);
                    if (onSearchCompleted) onSearchCompleted(result);
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

    return [results, makeSearch]
} 