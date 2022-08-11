import axios from "axios";
import { useCallback, useEffect, useState, } from "react";
import { IMangaChapter } from "../types";
import useMounted from "./useMounted";
import useSource from "./useSource";

export default function useMangaChapters(id: string): IMangaChapter[] {
    const [chapters, setChapters] = useState<IMangaChapter[]>([]);
    const IsMounted = useMounted();

    const { source } = useSource();

    const fetchChapters = useCallback(async () => {

        const url = `http://144.172.75.61:8089/${source.id}/${id}/chapters/`
        const response: IMangaChapter[] | 'cancelled' = (await axios.get(url))?.data;
        if (response !== 'cancelled' && IsMounted()) {
            setChapters(response)
        }

    }, [source]);

    useEffect(() => {


        fetchChapters();
    }, [])

    return chapters
}