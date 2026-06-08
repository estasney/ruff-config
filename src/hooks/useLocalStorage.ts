import {useState} from "react";

interface IUseLocalStorageProps<T> {
    key: string;
    initialValue: T;
}

type TSetStoredValue<T> = (value: T | ((prev: T) => T)) => void;
type TUseLocalStorage<T> = [T, TSetStoredValue<T>];

export const useLocalStorage = <T,>(props: IUseLocalStorageProps<T>): TUseLocalStorage<T> => {
    const {key, initialValue} = props;
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue: TSetStoredValue<T> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};