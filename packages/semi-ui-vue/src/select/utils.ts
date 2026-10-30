import { Text, type FunctionalComponent, type VNode } from 'vue';
import { optionListToRecords, toOptionRecord, type OptionRecord as BaseOptionRecord } from '@fibrae/semi-foundation/select/option-foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import elementType from '../_base/element-type';
import { childSlots, normalizeVNodeProps, toVNodes as toNodes } from '../_base/read-vnode';
import slotNodes from '../_base/slot-nodes';
import type { SelectOptionProps } from './interface';

/** An option's data as the Select keeps it: its props plus the slot of a markup label */
export interface OptionData extends SelectOptionProps {
    /** The default slot of a `SelectOption` whose content is not plain text */
    _slot?: FunctionalComponent;
}

export type OptionRecord = BaseOptionRecord<OptionData, GroupRecord>;

export interface GroupRecord extends Record<string, unknown> {
    key: string;
    label?: string | number;
    /** The `label` slot of a `SelectOptGroup` */
    _labelSlot?: FunctionalComponent;
}

const booleanProps = new Set(['disabled', 'showTick']);

const normalizeProps = (raw: Record<string, unknown> | null) => normalizeVNodeProps(raw, booleanProps);

function readOption(node: VNode, key: string, index: number, group?: GroupRecord) {
    const props = normalizeProps(node.props);
    const slot = childSlots(node).default;
    const content = slot ? slotNodes(toNodes(slot())) : [];
    const textOnly = content.every(([child]) => child.type === Text);
    const text = content.length && textOnly ? content.map(([child]) => child.children).join('') : undefined;
    // like React's label || children || value: an undefined or empty label does not hide the slot text
    const label = (props.label || undefined) ?? (text || undefined) ?? (props.value as string | number | undefined);
    const data = { ...props, label, _slot: content.length && !textOnly ? () => toNodes(slot?.()) : undefined };
    return toOptionRecord(data, index, group, key) as OptionRecord;
}

/**
 * The options of a Select: a non-empty `optionList`, otherwise the `SelectOption`s and `SelectOptGroup`s that are
 * direct children of the default slot (v-for, v-if and `<template>` are already unfolded). Called while the Select
 * renders or from a computed it reads, so the result tracks what the slot content reads.
 */
export function readOptions(nodes: VNode[], optionList?: SelectOptionProps[]) {
    const fromList = optionListToRecords(optionList);
    if (fromList) {
        return fromList as OptionRecord[];
    }
    const options: OptionRecord[] = [];
    for (const [node, key] of slotNodes(nodes)) {
        const type = elementType(node);
        if (type === 'Select.Option') {
            options.push(readOption(node, key, options.length));
        } else if (type === 'Select.OptGroup') {
            const slots = childSlots(node);
            const labelSlot = slots.label;
            const group: GroupRecord = {
                ...normalizeProps(node.props),
                key,
                _labelSlot: labelSlot ? () => toNodes(labelSlot()) : undefined,
            };
            for (const [child, childKey] of slotNodes(toNodes(slots.default?.()))) {
                if (elementType(child) === 'Select.Option') {
                    options.push(readOption(child, `${key}${childKey}`, options.length, group));
                } else {
                    warning(true, '[Semi Select] The children of `Select.OptGroup` should be `Select.Option`');
                }
            }
        } else {
            warning(true, '[Semi Select] The children of `Select` should be `Select.Option` or `Select.OptGroup`');
        }
    }
    return options;
}
