import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaChapter } from "../types";
import useMounted from "./useMounted";
import { useUniqueId } from "./useUniqueId";

export default function useMangaChapters(id: string): IMangaChapter[] {
    const [chapters, setChapters] = useState<IMangaChapter[]>([]);
    const uniqueId = useUniqueId();
    const IsMounted = useMounted();

    useEffect(() => {
        async function fetchChapters() {
            const url = `http://144.172.75.61:8089/mc/${id}/chapters/`
            const response: IMangaChapter[] | 'cancelled' = (await axios.get(url))?.data;
            if (response !== 'cancelled' && IsMounted()) {
                setChapters(response)
            }

        }

        fetchChapters();
    }, [])

    return chapters
}