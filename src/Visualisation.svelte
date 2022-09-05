<script lang="ts">
    import { fade, draw } from "svelte/transition";
    import { tweened } from "svelte/motion";
    import { cubicInOut } from "svelte/easing";
    import { interpolateRgb } from "d3-interpolate";
    import { dataByDate, dataByCategory } from "./lib/store";
    import {
        getCeil,
        getMax,
        getXLabels,
        getYLabels,
        sleep,
    } from "./lib/utils";

    const categoryColors = interpolateRgb("#03A678", "#014040");

    let x0 = -50;
    let y0 = -50;
    let w = 800;
    let h = 600;
    let gap = 50;
    let lines = 4;
    let x100 = w + x0 * 2;
    let y100 = h + y0 * 2;
    let duration = 100;

    let yLabelPos = getYLabels(lines).map(
        (value) => y100 - (y100 / lines) * value
    );

    const getYPos = (value: number, ceil: number) =>
        value ? (ceil - value) / (ceil / y100) : y100;

    const columnOptions = {
        easing: cubicInOut,
        duration: 500,
    };

    let points = tweened<number[]>();
    let y1Labels = tweened<number[]>();
    let y2Labels = tweened<number[]>();
    let columns = tweened<number[]>(undefined, columnOptions);

    // Values
    $: maxCategories = getMax(Object.values($dataByCategory));
    $: maxTotal = getMax(
        Object.values($dataByDate).map((datum) => datum.total)
    );
    $: y1ceil = getCeil(maxCategories, 1000);
    $: y2ceil = getCeil(maxTotal);
    $: dates = Object.keys($dataByDate).sort(([dateA], [dateB]) =>
        dateA > dateB ? +1 : -1
    );
    $: categories = Object.keys($dataByCategory);
    $: xPosByDate = dates
        .sort((a, b) => (a > b ? +1 : -1))
        .reduce<{ [date: string]: number }>(
            (ds, date, index) => ({
                ...ds,
                [date]: gap / 2 + index * ((x100 - gap) / dates.length),
            }),
            {}
        );

    let getY1Pos = (value: number) => getYPos(value, y1ceil);
    let getY2Pos = (value: number) => getYPos(value, y2ceil);
    let getXPos = (date: string) => xPosByDate[date];

    // Labels
    $: xLabels = getXLabels(dates, lines);

    // Columns
    let getColumnHeight = (value: number) => y100 - getY1Pos(value);

    $: columWidth = Math.floor(
        (x100 - gap * categories.length) / categories.length
    );

    $: if (y1ceil) y1Labels.set(getYLabels(y1ceil));
    $: if (y2ceil) y2Labels.set(getYLabels(y2ceil));

    dataByDate.subscribe(async (data) => {
        const d = Object.entries(data)
            .sort(([dateA], [dateB]) => (dateA > dateB ? +1 : -1))
            .map(([date, datum]) => ({ date, value: datum.total }));

        if (!$points) {
            await sleep(3000);
        }

        points.set(d.map(({ value }) => value));
    });

    dataByCategory.subscribe(async (data) => {
        const d = Object.entries(data)
            .sort(([catA], [catB]) => (catA > catB ? +1 : -1))
            .map(([category, value]) => value);

        let values = $columns || new Array(d.length).fill(0);

        // If $columns is empty, set initial values to 0
        if (!$columns) {
            await columns.set(values);
            await sleep(1500);
        }

        for (let i = 0; i < d.length; i++) {
            values = [...values.slice(0, i), d[i], ...values.slice(i + 1)];
            await columns.set(values);
        }
    });
</script>

<section class="wrapper" style="--r: {w} / {h}">
    <figure class="figure">
        <svg width="100%" height="100%" viewBox="{x0} {y0} {w} {h}">
            <!-- Grids -->
            <g class="grids">
                {#each $y1Labels as label, index}
                    <line
                        x1={0}
                        y1={yLabelPos[index]}
                        x2={x100}
                        y2={yLabelPos[index]}
                    />
                    <text
                        class="y y-1"
                        x={0}
                        y={yLabelPos[index]}
                        style="--delay: {($y1Labels.length - index) *
                            duration}ms"
                    >
                        {Math.floor(label)}
                    </text>
                {/each}

                {#each xLabels as label, index}
                    <text
                        class="x"
                        y={y100}
                        x={getXPos(label)}
                        style="--delay: {$y1Labels.length * duration +
                            index * duration}ms"
                    >
                        {label}
                    </text>
                {/each}

                {#each $y2Labels as label, index}
                    <text
                        class="y y-2"
                        x={x100}
                        y={yLabelPos[index]}
                        style="--delay: {($y1Labels.length + xLabels.length) *
                            duration +
                            index * duration}ms"
                    >
                        {Math.floor(label)}
                    </text>
                {/each}
            </g>

            <!-- Columns -->
            <g class="columns">
                {#if $columns}
                    {#each Object.keys($dataByCategory).sort( (catA, catB) => (catA > catB ? +1 : -1) ) as category, index}
                        {@const x = gap / 2 + index * columWidth + index * gap}
                        <rect
                            {x}
                            y={getY1Pos($columns[index])}
                            width={columWidth}
                            height={getColumnHeight($columns[index])}
                            fill={categoryColors(index / categories.length)}
                        />

                        <text class="category" x={x + columWidth / 2} y={y100}>
                            {category}
                        </text>

                        <text
                            class="value"
                            x={x + columWidth / 2}
                            y={getY1Pos($columns[index])}
                        >
                            {Math.floor($columns[index])}
                        </text>
                    {/each}
                {/if}
            </g>
            <!-- Lines -->
            <g class="lines">
                {#if $points}
                    <polyline
                        transition:draw={{ duration: 1000 }}
                        points={$points
                            .map(
                                (value, index) =>
                                    `${getXPos(dates[index])},${getY2Pos(
                                        value
                                    )}`
                            )
                            .join(" ")}
                    />
                {/if}
            </g>
        </svg>
    </figure>
</section>

<style>
    .wrapper {
        display: grid;
        width: 100%;
        height: 100%;
        place-items: center;
    }

    .figure {
        aspect-ratio: var(--r);
        width: min(100%, max(960px, 90vh * (var(--r))));
    }

    .grids text {
        opacity: 0;
        stroke: none;
        animation-fill-mode: forwards;
        animation-duration: 500ms;
        animation-delay: var(--delay);
    }

    .grids .y-1 {
        text-anchor: end;
        animation-name: fade, fly-y1;
    }

    .grids .y-2 {
        fill: var(--10);
        text-anchor: start;
        animation-name: fade, fly-y2;
    }

    .grids .x {
        text-anchor: middle;
        transform: translateY(30px);
        animation-name: fade, fly-x;
    }

    .grids line {
        stroke-width: 1;
        stroke: #cacaca;
    }

    @keyframes fade {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    @keyframes fly-y1 {
        0% {
            transform: translate(-5px, 35px);
        }
        100% {
            transform: translate(-5px, 5px);
        }
    }

    @keyframes fly-y2 {
        0% {
            transform: translate(5px, 35px);
        }
        100% {
            transform: translate(5px, 5px);
        }
    }

    @keyframes fly-x {
        0% {
            transform: translate(-30px, 30px);
        }
        100% {
            transform: translate(0px, 30px);
        }
    }

    .columns rect {
        opacity: 0.8;
    }

    .columns text {
        stroke: none;
        fill: white;
        text-anchor: middle;
    }

    .columns .category {
        transform: translateY(-10px);
    }

    .columns .value {
        transform: translateY(20px);
    }

    .lines polyline {
        stroke: var(--10);
        fill: none;
        stroke-width: 2;
    }
</style>
