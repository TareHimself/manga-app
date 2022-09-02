import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { IMangaData } from "../types";
import useMounted from "./useMounted";
import useSource from "./useSource";

export default function useManga(id: string): IMangaData | null {
    const [manga, setManga] = useState<IMangaData | null>(null);
    const IsMounted = useMounted();
    const { source } = useSource();

    const fetchManga = useCallback(async () => {
        try {
            const url = `http://10.200.4.16:8089/${source.id}/${id}/`
            const response: IMangaData | 'cancelled' = (await axios.get(url))?.data;

            if (response !== 'cancelled' && IsMounted()) {
                setManga(response)
            }
        } catch (error) {

        }
    }, [source]);

    useEffect(() => {
        fetchManga();
    }, [])

    return manga
}