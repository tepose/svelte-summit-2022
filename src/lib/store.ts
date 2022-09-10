import { derived, writable, type Writable } from "svelte/store";
import { getData } from "./utils";

export const data = writable<Datum[]>(
    getData(new Date("2022-06-30"), new Date("2022-09-08"))
);

setTimeout(() => {
    data.set(getData(new Date("2022-06-30"), new Date("2022-09-08"), 4, 1.3));
}, 10000);

export const dataByCategory = derived<[Writable<Datum[]>], Category>(
    [data],
    ([$data], set) => {
        const obj: ValueByKey<number> = {};

        $data.forEach((datum) => {
            if (!(datum.category in obj)) {
                obj[datum.category] = 0;
            }

            obj[datum.category] = obj[datum.category] + datum.value;
        });

        const arr = Object.entries(obj).map(([category, value]) => ({
            category,
            value,
        }));

        set(arr);
    }
);

export const dataByDate = derived<[Writable<Datum[]>], ValueByKey<number>>(
    [data],
    ([$data], set) => {
        const obj: ValueByKey<number> = {};

        $data.forEach((datum) => {
            if (!(datum.date in obj)) {
                obj[datum.date] = 0;
            }

            obj[datum.date] = obj[datum.date] + datum.value;
        });

        set(obj);
    }
);
