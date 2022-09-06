/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Datum {
    date: string;
    category: string;
    value: number;
}

interface DataByDate {
    [date: string]: {
        [category: string]: number;
        total: number;
    };
}

interface DataByCategory {
    [category: string]: number;
}
