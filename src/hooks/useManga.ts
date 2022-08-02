import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaData } from "../types";
import useMounted from "./useMounted";
import { useUniqueId } from "./useUniqueId";

export default function useManga(id: string): IMangaData | null {
    const [manga, setManga] = useState<IMangaData | null>(null);
    const IsMounted = useMounted();

    useEffect(() => {
        async function fetchChapters() {
            const url = `http://144.172.75.61:8089/mc/${id}/`
            const response: IMangaData | 'cancelled' = (await axios.get(url))?.data;

            if (response !== 'cancelled' && IsMounted()) {
                setManga(response)
            }

        }

        fetchChapters();
    }, [])

    return manga
}