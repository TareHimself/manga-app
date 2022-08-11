import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaData } from "../types";
import useMounted from "./useMounted";
import useSource from "./useSource";

export default function useManga(id: string): IMangaData | null {
    const [manga, setManga] = useState<IMangaData | null>(null);
    const IsMounted = useMounted();
    const { source } = useSource();
    useEffect(() => {
        async function fetchChapters() {
            const url = `http://144.172.75.61:8089/${source.id}/${id}/`
            console.log(url);
            const response: IMangaData | 'cancelled' = (await axios.get(url))?.data;

            if (response !== 'cancelled' && IsMounted()) {
                setManga(response)
            }

        }

        fetchChapters();
    }, [source])

    return manga
}