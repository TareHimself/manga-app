import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { IMangaData, IMangaDexApiSearchResponse } from "../types";
import useDevieceId from "./useDeviceId";

export const DefaultMangaDexSearch = { "limit": "30", "order[followedCount]": "desc", "offset": "0", "q": "" };

export default function useMangaDexSearch(search: Record<string, string> = DefaultMangaDexSearch): [IMangaData[], (search: Record<string, string>) => Promise<void>] {
    const [results, setResults] = useState<IMangaData[]>([]);
    const deviceId = useDevieceId();
    const lastQuery = useRef<string>()
    const hasPendingSearch = useRef(false);
    const makeSearch = useCallback(async (search: Record<string, string> = DefaultMangaDexSearch) => {
        try {

            if (hasPendingSearch.current) return;

            const url = `http://144.172.75.61:8089/search?${new URLSearchParams({ ...search, id: deviceId }).toString()}`;
            console.log('Making Request', url)

            hasPendingSearch.current = true;
            const response: IMangaData[] = (await axios.get(url))?.data;
            hasPendingSearch.current = false;

            console.log(response)
            setResults(response);

        } catch (error) {
            console.log(error);
        }
    }, [results, deviceId])

    useEffect(() => {
        if (deviceId !== '') {
            makeSearch(search);
        }

    }, [deviceId])

    return [results, makeSearch]
} 