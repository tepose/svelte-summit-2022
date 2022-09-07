/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Datum {
    date: string;
    category: string;
    value: number;
}

interface ValueByKey<T> {
    [key: string]: T;
}

type Category = { category: string; value: number }[];
