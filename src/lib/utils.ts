import { timeDays } from "d3-time";

export const getMax = (values: number[]): number => Math.max(...values);

export const getCeil = (max: number, denominator = 100): number =>
    Math.ceil(max / denominator) * denominator;

export const random = (min = 70, max = 90): number => {
    const diff = max - min;
    const rand = Math.random();
    return Math.floor(rand * diff) + min;
};

export const getYLabels = (ceil: number, lines = 4): number[] => {
    return new Array(lines + 1)
        .fill(0)
        .map((_, index) => index)
        .map((index) => (ceil / lines) * index);
};

export const getXLabels = (labels: any[], columns = 4): number[] => {
    return new Array(columns + 1)
        .fill("")
        .map((_, index) => index)
        .map((index) => {
            let label = Math.floor((labels.length / columns) * index);
            if (label >= labels.length) label = labels.length - 1;
            return labels[label];
        });
};

export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getData = (
    fromDate: Date,
    toDate: Date,
    categories: number = 4,
    factor = 1
): Datum[] => {
    const dates = timeDays(fromDate, toDate).map((date: Date) => {
        const [day, month, year] = date.toLocaleDateString("nb-no").split(".");
        return `${year}-${String(month).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")}`;
    });

    const data = dates.reduce((arr: Datum[], date: string, index) => {
        return [
            ...arr,
            ...new Array(categories).fill(null).map((_, category) => ({
                date,
                category: `cat_${category + 1}`,
                value: Math.round(random(30, 80) * (index * 0.01) * factor),
            })),
        ];
    }, []);

    return data;
};
