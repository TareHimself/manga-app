import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaDexApiChapter, IMangaDexApiChaptersResponse } from "../types";
import useMounted from "./useMounted";
import { useUniqueId } from "./useUniqueId";

export default function useMangaDexChapters(id: string): [string[]] {
    const [chapters, setChapters] = useState<string[]>([]);
    const uniqueId = useUniqueId();
    const IsMounted = useMounted();

    useEffect(() => {
        async function fetchChapters() {
            const url = `http://144.172.75.61:8089/chapters/${id}?id=${uniqueId}`
            console.log(url)
            const response: string[] | 'cancelled' = (await axios.get(url))?.data;

            if (response !== 'cancelled' && IsMounted()) {
                setChapters(response.reverse())
            }

        }

        fetchChapters()
    }, [])

    return [chapters]
}