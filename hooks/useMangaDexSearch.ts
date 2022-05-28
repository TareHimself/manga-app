import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { IMangaData, IMangaDexApiSearchResponse } from "../types";

export const DefaultMangaDexSearch = { "limit": "30", "order[followedCount]": "desc", "offset": "0" };

export default function useMangaDexSearch(search: Record<string, string> = DefaultMangaDexSearch, bShouldReplaceLastSearch: boolean = true): [IMangaData[], (search: Record<string, string>, bShouldReplaceLastSearch: boolean) => Promise<void>] {
    const [results, setResults] = useState<IMangaData[]>([]);

    const lastQuery = useRef<string>()
    const makeSearch = useCallback(async (search: Record<string, string> = DefaultMangaDexSearch, bShouldReplaceLastSearch = true) => {
        try {

            const url = `https://api.mangadex.org/manga?includes[]=cover_art&${new URLSearchParams(search).toString()}`;
            console.log('Making Request', url)

            const response: IMangaDexApiSearchResponse = (await axios.get(url))?.data;



            if (bShouldReplaceLastSearch) {
                setResults(response.data);
            }
            else {
                setResults([...results, ...response.data])
            }
        } catch (error) {
            console.log(error);
        }
    }, [results])

    useEffect(() => {
        makeSearch(search);
    }, [])

    return [results, makeSearch]
} 