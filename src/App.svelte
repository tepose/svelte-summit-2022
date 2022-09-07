<script lang="ts">
    import { fade, fly, draw } from "svelte/transition";
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
    import { onMount } from "svelte";

    const categoryColors = interpolateRgb("#04AED4", "#011F26");

    let timing = {
        x: false,
        y: false,
        categories: false,
    };

    let x0 = -50;
    let y0 = -50;
    let w = 800;
    let h = 600;
    let gap = 50;
    let lines = 4;
    let x100 = w + x0 * 2;
    let y100 = h + y0 * 2;

    let yLabelPos = getYLabels(lines).map(
        (value) => y100 - (y100 / lines) * value
    );

    let getYPos = (value: number, ceil: number) =>
        (ceil - value) / (ceil / y100);

    let points = tweened<number[]>();
    let y1Labels = tweened<number[]>();
    let y2Labels = tweened<number[]>();
    let columns = tweened<number[]>(undefined, {
        easing: cubicInOut,
        duration: 500,
    });

    $: maxCategories = getMax($dataByCategory.map(({ value }) => value));
    $: maxTotal = getMax(Object.values($dataByDate));
    $: y1ceil = getCeil(maxCategories, 1000);
    $: y2ceil = getCeil(maxTotal);
    $: dates = Object.keys($dataByDate).sort(([dateA], [dateB]) =>
        dateA > dateB ? +1 : -1
    );
    $: xLabels = getXLabels(dates, lines);
    $: categories = $dataByCategory.map(({ category }) => category);
    $: columWidth = Math.floor(
        (x100 - gap * categories.length) / categories.length
    );
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

    $: if (y1ceil) y1Labels.set(getYLabels(y1ceil));
    $: if (y2ceil) y2Labels.set(getYLabels(y2ceil));

    const subscribeToLine = () => {
        dataByDate.subscribe(async (data) => {
            const d = Object.entries(data)
                .sort(([dateA], [dateB]) => (dateA > dateB ? +1 : -1))
                .map(([date, value]) => ({ date, value }));

            points.set(d.map(({ value }) => value));
        });
    };

    const subscribeToCategories = (): number => {
        dataByCategory.subscribe(async (data) => {
            const d = data.map(({ value }) => value);

            let values = $columns || new Array(d.length).fill(0);

            // If $columns is empty, set initial values to 0
            if (!$columns) {
                await columns.set(values);
                for (let i = 0; i < d.length; i++) {
                    values = [
                        ...values.slice(0, i),
                        d[i],
                        ...values.slice(i + 1),
                    ];
                    await columns.set(values);
                }
            } else {
                columns.set(d);
            }
        });

        return $dataByCategory.length;
    };

    onMount(async () => {
        timing.y = true;
        await sleep($y1Labels.length * 100);
        timing.x = true;
        await sleep(150);
        const cats = subscribeToCategories();
        await sleep(cats * 100);
        subscribeToLine();
    });
</script>

<section class="wrapper" style="--r: {w} / {h}">
    <figure class="figure">
        <svg width="100%" height="100%" viewBox="{x0} {y0} {w} {h}">
            <!-- Grids -->
            {#if timing.y}
                <g class="grids">
                    {#each $y1Labels as label, index}
                        <line
                            x1={0}
                            y1={getYPos(index, lines)}
                            x2={x100}
                            y2={getYPos(index, lines)}
                        />
                    {/each}
                </g>
            {/if}

            <!-- Labels -->
            <g class="labels">
                {#if timing.y}
                    {#each $y1Labels as label, index}
                        <g
                            class="y-labels"
                            in:fly={{
                                delay: ($y1Labels.length - index) * 50,
                                y: 20,
                            }}
                        >
                            <text class="y y-1" x={0} y={yLabelPos[index]}>
                                {Math.floor(label)}
                            </text>
                            <text class="y y-2" x={x100} y={yLabelPos[index]}>
                                {Math.floor($y2Labels[index])}
                            </text>
                        </g>
                    {/each}
                {/if}
                {#if timing.x}
                    <g class="x-labels" in:fade>
                        {#each xLabels as label}
                            <text class="x" y={y100} x={getXPos(label)}>
                                {label}
                            </text>
                        {/each}
                    </g>
                {/if}
            </g>

            <!-- Columns -->
            <g class="columns">
                {#if $columns}
                    {#each $dataByCategory as { category, value }, index}
                        {@const x = gap / 2 + index * columWidth + index * gap}
                        <rect
                            {x}
                            y={getY1Pos($columns[index])}
                            width={columWidth}
                            height={y100 - getY1Pos($columns[index])}
                            fill={categoryColors(index / categories.length)}
                        />

                        <text
                            class="value"
                            x={x + columWidth / 2}
                            y={getY1Pos($columns[index])}
                        >
                            {Math.floor($columns[index])}
                        </text>

                        {#if timing.categories}
                            <text
                                class="category"
                                x={x + columWidth / 2}
                                y={y100}
                                transition:fade
                            >
                                {category}
                            </text>
                        {/if}
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

    .grids line {
        stroke-width: 1;
        stroke: var(--grid-color);
    }

    .labels text {
        stroke: none;
        fill: var(--label-color);
    }

    .labels .y-1 {
        text-anchor: end;
        transform: translate(-5px, 4px);
    }

    .labels .y-2 {
        fill: var(--contrast-color);
        text-anchor: start;
        transform: translate(5px, 4px);
    }

    .labels .x {
        text-anchor: middle;
        transform: translateY(30px);
    }

    .columns rect {
        opacity: 0.9;
    }

    .columns text {
        stroke: none;
        fill: var(--inverted-label-color);
        text-anchor: middle;
    }

    .columns .category {
        transform: translateY(-10px);
    }

    .columns .value {
        transform: translateY(20px);
    }

    .lines polyline {
        stroke: var(--contrast-color);
        fill: none;
        stroke-width: 2;
    }
</style>
