import type { JSX } from 'solid-js';
import { type OptionRecordKeys, optionListToRecords, toOptionRecord } from '@fibrae/semi-foundation/select/option-foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import { isToken } from '../_base/token';
import { OPTION, type OptionProps } from './option';
import { OPTGROUP, type OptionGroupProps } from './option-group';

export interface GroupRecord {
    [key: string]: unknown;
    key: string;
    label?: string | number;
}

/** An option as the Select keeps it: the record plus the foundation's `_` keys and the reader of its children */
export interface OptionRecord extends OptionProps, OptionRecordKeys<GroupRecord> {
    /** Reads the Option's children where they render, so each place creates its own nodes */
    _slot?: () => JSX.Element;
}

function resolve(node: unknown): unknown[] {
    if (typeof node === 'function' && node.length === 0) {
        return resolve((node as () => unknown)());
    }
    return Array.isArray(node) ? node.flatMap(resolve) : [node];
}

const isEmpty = (node: unknown) => node == null || typeof node === 'boolean' || node === '';

function copyProps(props: object, skip: string[]) {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
        if (!skip.includes(key)) {
            copy[key] = (props as Record<string, unknown>)[key];
        }
    }
    return copy;
}

function readOption(props: OptionProps, index: number, key: string, group?: GroupRecord) {
    // children are JSX: reading them creates nodes, so only the places that insert them read them, and `in` checks
    // the key without calling the getter
    const data = { ...copyProps(props, ['children', 'label']), label: props.label || props.value, _slot: 'children' in props ? () => props.children : undefined };
    return toOptionRecord(data, index, group, key) as OptionRecord;
}

/**
 * The options of a Select: a non-empty `optionList`, otherwise the `Select.Option` and `Select.OptGroup` tokens among
 * the resolved children. Called from a memo, so the result tracks every option prop it reads.
 */
export function readOptions(nodes: unknown[], optionList?: OptionProps[]) {
    const fromList = optionListToRecords(optionList);
    if (fromList) {
        return fromList as OptionRecord[];
    }
    const options: OptionRecord[] = [];
    nodes.forEach((node, position) => {
        if (isToken<OptionProps>(node, OPTION)) {
            options.push(readOption(node.props, options.length, `.${position}`));
        } else if (isToken<OptionGroupProps>(node, OPTGROUP)) {
            const group: GroupRecord = { ...copyProps(node.props, ['children']), key: `.${position}` };
            resolve(node.props.children).forEach((child, childPosition) => {
                if (isToken<OptionProps>(child, OPTION)) {
                    options.push(readOption(child.props, options.length, `${group.key}.${childPosition}`, group));
                } else if (!isEmpty(child)) {
                    warning(true, '[Semi Select] The children of `Select.OptGroup` should be `Select.Option`');
                }
            });
        } else if (typeof node === 'object' && node !== null) {
            warning(true, '[Semi Select] The children of `Select` should be `Select.Option` or `Select.OptGroup`');
        }
    });
    return options;
}

/** The option without the label reader, as callbacks receive it */
export function plain(option: OptionRecord): OptionProps {
    const { _slot, ...rest } = option;
    return rest;
}
