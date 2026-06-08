import {useEffect, useState} from "react";


export const useDebouncedState = <T>(initialValue: T, delay: number): [T, T, (value: T) => void] => {
    const [value, setValue] = useState<T>(initialValue);
    const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return [value, debouncedValue, setValue];
}
