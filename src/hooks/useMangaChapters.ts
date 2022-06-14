import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaDexApiChapter, IMangaDexApiChaptersResponse } from "../types";

export default function useMangaDexChapters(id: string): [string[]] {
    const [chapters, setChapters] = useState<string[]>([]);

    useEffect(() => {
        async function fetchChapters() {
            const url = `http://144.172.75.61:8089/chapters/${id}`
            console.log(url)
            const response: string[] = (await axios.get(url))?.data;

            setChapters(response.reverse())

        }

        fetchChapters()
    }, [])

    return [chapters]
}