import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { IMangaData, IMangaDexApiSearchResponse } from "../types";
import useMounted from "./useMounted";
import { useUniqueId } from "./useUniqueId";
import { compareTwoStrings } from "string-similarity";
export const DefaultMangaDexSearch = { "q": "" };

export default function useMangaDexSearch(search: Record<string, string> = DefaultMangaDexSearch): [IMangaData[], (search: Record<string, string>) => Promise<void>] {
    const [results, setResults] = useState<IMangaData[]>([]);
    const uniqueId = useUniqueId();
    const IsMounted = useMounted();
    const lastRequestController = useRef<AbortController | null>();

    const makeSearch = useCallback(async (search: Record<string, string> = DefaultMangaDexSearch) => {
        try {

            const url = `http://144.172.75.61:8089/search?${new URLSearchParams({ ...search }).toString()}`;
            console.log('Making Request', url)

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

                    const result: IMangaData[] = response.data;

                    if (search['q'].toLowerCase().trim() && search['q'].toLowerCase().trim().length > 3) {
                        result.sort((a, b) => {
                            const aRelavance = compareTwoStrings(a.name.toLowerCase().trim(), search['q'].toLowerCase().trim());
                            const bRelavance = compareTwoStrings(b.name.toLowerCase().trim(), search['q'].toLowerCase().trim());

                            if (aRelavance > bRelavance) return -1;

                            if (aRelavance < bRelavance) return 1;

                            return 0;
                        });
                    }

                    setResults(result);
                }).catch((error) => {
                    console.log(error, 'Ignore this ERROR')
                });
            }

        } catch (error) {
            console.log(error);
        }
    }, [results, uniqueId, lastRequestController.current])

    useEffect(() => {

        lastRequestController.current = new AbortController();
        makeSearch(search);

        return () => {
            if (lastRequestController.current) {
                lastRequestController.current.abort();
                lastRequestController.current = null;
            }

        }
    }, [])

    return [results, makeSearch]
} 