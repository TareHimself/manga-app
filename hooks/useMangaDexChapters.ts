import axios from "axios";
import { useEffect, useState } from "react";
import { IMangaDexApiChapter, IMangaDexApiChaptersResponse } from "../types";

export default function useMangaDexChapters(id: string): [IMangaDexApiChapter[]] {
    const [chapters, setChapters] = useState<IMangaDexApiChapter[]>([]);

    useEffect(() => {
        async function fetchChapters() {
            const url = `https://api.mangadex.org/manga/${id}/feed?order[chapter]=desc&translatedLanguage[]=en&limit=500`
            console.log(url)
            const response: IMangaDexApiChaptersResponse = (await axios.get(url))?.data;
            const chapters = response.data;

            const chaptersFiltered: string[] = [];

            const hasMoreToLoad = response.total - response.limit > 0

            setChapters(chapters.filter((chapter) => {
                if (chaptersFiltered.includes(chapter.attributes.chapter)) {
                    return false
                }

                chaptersFiltered.push(chapter.attributes.chapter)
                return true;
            }))

        }

        fetchChapters()
    }, [])

    return [chapters]
}