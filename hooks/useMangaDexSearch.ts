import axios from "axios";
import { useCallback, useEffect, useState } from "react";



export default function useMangaDexSearch(): [IMangaData[], (search: IMangaDexSearch) => Promise<void>] {
    const [results, setResults] = useState<IMangaData[]>([]);

    const makeSearch = useCallback(async (search: IMangaDexSearch) => {
        try {

            const response: IMangaDexApiSearchResponse = (await axios.get(`https://api.mangadex.org/manga?limit=12&includes%5B%5D=cover_art&order[followedCount]=desc`))?.data;

            setResults(response.data)

        } catch (error) {
            console.log(error);
        }
    }, [])

    useEffect(() => {
        makeSearch({});

        console.log('Making Request')
    }, [])

    return [results, makeSearch]
}