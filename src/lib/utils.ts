export const getMax = (values: number[]) => Math.max(...values);

export const getCeil = (max: number, denominator = 100) =>
    Math.ceil(max / denominator) * denominator;

export const random = (min = 70, max = 90): number => {
    const diff = max - min;
    const rand = Math.random();
    return Math.floor(rand * diff) + min;
};

export const getYLabels = (ceil, lines = 4) => {
    return new Array(lines + 1)
        .fill(0)
        .map((_, index) => index)
        .map((index) => (ceil / lines) * index);
};

export const getXLabels = (labels, columns = 4) => {
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
