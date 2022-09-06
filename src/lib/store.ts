import { derived, writable, type Writable } from "svelte/store";
import { getData } from "./utils";

export const data = writable<Datum[]>(
    getData(new Date("2022-01-01"), new Date("2022-04-01"))
);

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
