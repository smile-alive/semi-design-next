import { Text, type FunctionalComponent, type VNode } from 'vue';
import { optionListToRecords, toOptionRecord, type OptionRecord as BaseOptionRecord } from '@fibrae/semi-foundation/components/select/option-foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import elementType from '../../utils/element-type';
import { childSlots, normalizeVNodeProps, toVNodes as toNodes } from '../../utils/read-vnode';
import slotNodes from '../../utils/slot-nodes';
import type { SelectOptionProps } from './interface';

export interface OptionRecord extends BaseOptionRecord<SelectOptionProps, GroupRecord> {
    /** The markup in a `Select.Option`'s default slot, shown in place of `label`; kept off `data`, which reaches the user */
    slot?: FunctionalComponent;
}

export interface GroupRecord {
    key: string;
    /** Read by the foundation's search */
    label?: string | number;
    /** The `Select.OptGroup`'s props, which land on its title */
    attrs: Record<string, unknown>;
    labelSlot?: FunctionalComponent;
}

/** The slot of each option by value, for the selection, which holds the options' data */
export function slotsByValue(options: readonly OptionRecord[]) {
    return new Map(options.flatMap((option) => (option.slot ? [[option.data.value, option.slot] as const] : [])));
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
    const record = toOptionRecord({ ...props, label }, index, group, key) as OptionRecord;
    if (content.length && !textOnly) {
        record.slot = () => toNodes(slot?.());
    }
    return record;
}

/** Called while the Select renders or from a computed it reads, so the result tracks what the slot content reads. */
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
            const attrs = normalizeProps(node.props);
            const group: GroupRecord = {
                key,
                label: attrs.label as GroupRecord['label'],
                attrs,
                labelSlot: labelSlot ? () => toNodes(labelSlot()) : undefined,
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
