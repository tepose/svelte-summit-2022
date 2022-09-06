import { derived, writable, type Writable } from "svelte/store";
import { timeDays } from "d3-time";

import { random } from "./utils";

const dates = timeDays(new Date("2021-12-31"), new Date("2022-04-04")).map(
    (date: Date) => {
        const [day, month, year] = date.toLocaleDateString("nb-no").split(".");
        return `${year}-${String(month).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")}`;
    }
);

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

const getData = (d: string[], categories = 4) =>
    d.reduce((arr: Datum[], date: string, index) => {
        return [
            ...arr,
            ...new Array(categories).fill(null).map((_, category) => ({
                date,
                category: `cat_${category + 1}`,
                value: Math.round(random(30, 80) * (index * 0.01)),
            })),
        ];
    }, []);

export const data = writable<Datum[]>(getData(dates));

setTimeout(() => {
    data.set(getData(dates));
}, 10000);

export const dataByCategory = derived<[Writable<Datum[]>], DataByCategory>(
    [data],
    ([$data], set) => {
        const obj: DataByCategory = {};

        $data.forEach((datum) => {
            if (!(datum.category in obj)) {
                obj[datum.category] = 0;
            }

            obj[datum.category] = obj[datum.category] + datum.value;
        });

        set(obj);
    }
);

export const dataByDate = derived<[Writable<Datum[]>], DataByDate>(
    [data],
    ([$data], set) => {
        const obj: DataByDate = {};

        $data.forEach((datum) => {
            if (!obj[datum.date]) {
                obj[datum.date] = {
                    total: 0,
                };
            }

            obj[datum.date][datum.category] = datum.value;
            obj[datum.date].total += datum.value;
        });

        set(obj);
    }
);
