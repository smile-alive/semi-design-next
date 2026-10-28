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

/** The keys Select adds to a collected option; SelectFoundation reads and writes them and strips them from callbacks */
export interface OptionRecordKeys<G extends { label?: unknown } = { label?: unknown }> {
    _show?: boolean;
    _selected?: boolean;
    /** Position among all collected options, which keeps a row's key while filtering moves it */
    _scrollIndex?: number;
    _parentGroup?: G;
    _keyInJsx?: string;
    _inputCreateOnly?: boolean;
    _notExist?: boolean;
}

/**
 * The record Select keeps for an option: `data` is what the host read from an optionList item or an option child.
 * Only a child has `keyInJsx`, its key prefixed with the group's so options in different groups stay apart; an
 * optionList item passes neither and keeps its own keys.
 */
export function toOptionRecord<D extends object, G extends { label?: unknown }>(data: D, index: number, group?: G, keyInJsx?: string): D & OptionRecordKeys<G> {
    const record = { _show: true, _selected: false, _scrollIndex: index, ...data };
    return keyInJsx === undefined ? record : { ...record, _parentGroup: group, _keyInJsx: keyInJsx };
}

export interface OptionRun<O extends { _parentGroup?: unknown }> {
    group: O['_parentGroup'];
    first: number;
    rows: { option: O; index: number }[];
}

/** Splits the visible options into runs of adjacent options of the same group, keeping each option's visible index */
export function getOptionRuns<O extends { _parentGroup?: { key?: unknown } }>(options: readonly O[]) {
    const runs: OptionRun<O>[] = [];
    options.forEach((option, index) => {
        const last = runs.at(-1);
        if (last && last.group?.key === option._parentGroup?.key) {
            last.rows.push({ option, index });
        } else {
            runs.push({ group: option._parentGroup, first: index, rows: [{ option, index }] });
        }
    });
    return runs;
}

/** The records of a non-empty `optionList`; undefined when the hosts must read their option children instead */
export function optionListToRecords<D extends object>(optionList?: readonly D[]): (D & OptionRecordKeys)[] | undefined {
    return optionList?.length ? optionList.map((item, index) => toOptionRecord(item, index)) : undefined;
}
