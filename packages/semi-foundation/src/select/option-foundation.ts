export interface BasicOptionProps {
    [x: string]: any;
    value?: string | number;
    label?: string | number | unknown;
    children?: unknown;
    disabled?: boolean;
    showTick?: boolean;
    className?: string;
    style?: Record<string, any>;
}

/**
 * What Select keeps for an option. `data` is what the host read from an optionList item or an option child, and is
 * all that callbacks and the selections receive; the rest is Select's own state, kept off the user's object.
 */
export interface OptionRecord<D = BasicOptionProps, G = { label?: unknown }> {
    data: D;
    /** Position among all collected options, which keeps a row's key while filtering moves it */
    index: number;
    group?: G;
    /** Only an option child has one: its key prefixed with the group's, so options in different groups stay apart */
    childKey?: string;
    show: boolean;
    selected: boolean;
    /** The option the search text would create under allowCreate, until it is selected */
    create?: boolean;
}

export function toOptionRecord<D, G>(data: D, index: number, group?: G, childKey?: string): OptionRecord<D, G> {
    return { data, index, group, childKey, show: true, selected: false };
}

export interface OptionRun<R extends { group?: unknown }> {
    group: R['group'];
    first: number;
    rows: { option: R; index: number }[];
}

/** Splits the visible options into runs of adjacent options of the same group, keeping each option's visible index */
export function getOptionRuns<R extends { group?: { key?: unknown } }>(options: readonly R[]) {
    const runs: OptionRun<R>[] = [];
    options.forEach((option, index) => {
        const last = runs.at(-1);
        if (last && last.group?.key === option.group?.key) {
            last.rows.push({ option, index });
        } else {
            runs.push({ group: option.group, first: index, rows: [{ option, index }] });
        }
    });
    return runs;
}

/** The records of a non-empty `optionList`; undefined when the hosts must read their option children instead */
export function optionListToRecords<D>(optionList?: readonly D[]): OptionRecord<D>[] | undefined {
    return optionList?.length ? optionList.map((item, index) => toOptionRecord(item, index)) : undefined;
}
