import axios from "axios";
import { useCallback, useEffect, useRef } from "react";


export default function useMounted(): () => boolean {

    const isMounted = useRef<boolean>(true)

    const IsMounted = useCallback(() => {
        return isMounted.current;
    }, [isMounted.current])

    useEffect(() => {
        isMounted.current = true;

        return () => { isMounted.current = false }
    }, [])

    return IsMounted;
} 