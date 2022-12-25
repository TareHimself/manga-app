import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { ApiBaseUrl } from "../constants/Urls";
import { IMangaData } from "../types";
import useMounted from "./useMounted";

export default function useManga(id: string, sourceId: string): IMangaData | null {
    const [manga, setManga] = useState<IMangaData | null>(null);
    const IsMounted = useMounted();

    const fetchManga = useCallback(async () => {
        try {
            const url = `${ApiBaseUrl}${sourceId}/manga/${id}/`
            const response: IMangaData | 'cancelled' = (await axios.get(url))?.data;

            if (response !== 'cancelled' && IsMounted()) {
                setManga(response)
            }
        } catch (error) {

        }
    }, []);

    useEffect(() => {
        fetchManga();
    }, [])

    return manga
}