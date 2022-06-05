import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { IMangaData, IMangaDexApiSearchResponse } from "../types";

export const DefaultMangaDexSearch = { "limit": "30", "order[followedCount]": "desc", "offset": "0", "title": "" };

export default function useMangaDexSearch(): () => boolean {
    const [results, setResults] = useState<IMangaData[]>([]);

    const isMounted = useRef<boolean>(true)

    const IsMounted = useCallback(() => {
        return isMounted.current;
    }, [isMounted.current])

    useEffect(() => {
        isMounted.current = true;

        return () => { isMounted.current = false }
    }, [])

    return IsMounted
} 