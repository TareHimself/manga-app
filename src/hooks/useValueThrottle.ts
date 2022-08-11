import { useCallback, useRef } from "react";

export function useValueThrottle<T>(delay: number, onValueCommited: (value: T) => void, initialValue: T) {

    const timeoutLength = useRef(delay).current;
    const timeoutHandle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const latestValue = useRef<T>(initialValue);

    const commitValue = useCallback(() => {
        onValueCommited(latestValue.current);
    }, [latestValue, onValueCommited])

    const setValue = useCallback((newValue: T) => {
        latestValue.current = newValue;

        if (timeoutHandle.current) {
            clearTimeout(timeoutHandle.current)
        }

        timeoutHandle.current = setTimeout(commitValue, timeoutLength);

    }, [timeoutHandle.current, latestValue, onValueCommited]);


    return setValue
}