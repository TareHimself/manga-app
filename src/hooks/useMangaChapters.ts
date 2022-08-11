import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaChapter } from "../types";
import useMounted from "./useMounted";
import useSource from "./useSource";
import { useUniqueId } from "./useUniqueId";

export default function useMangaChapters(id: string): IMangaChapter[] {
    const [chapters, setChapters] = useState<IMangaChapter[]>([]);
    const uniqueId = useUniqueId();
    const IsMounted = useMounted();

    const { source } = useSource();

    useEffect(() => {
        async function fetchChapters() {
            const url = `http://144.172.75.61:8089/${source.id}/${id}/chapters/`
            const response: IMangaChapter[] | 'cancelled' = (await axios.get(url))?.data;
            if (response !== 'cancelled' && IsMounted()) {
                setChapters(response)
            }

        }

        fetchChapters();
    }, [source])

    return chapters
}