import React from 'react';
import { type OptionRecord, toOptionRecord } from '@fibrae/semi-foundation/select/option-foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import elementTypeOf from '../_base/element-type';
import flattenChildren from '../_base/flatten-children';
import type { OptionProps } from './option';
import type { OptionGroupProps } from './option-group';

function readOption(child: React.ReactElement<any>): OptionProps {
    const childProps = child.props;
    return { value: childProps.value, label: childProps.label || childProps.children || childProps.value, ...childProps };
}

export function getOptionsFromGroup(selectChildren: React.ReactNode) {
    const options: OptionRecord<OptionProps, OptionGroupProps & { key?: React.Key }>[] = [];
    let optionIndex = -1;

    flattenChildren(selectChildren)
        .filter((child): child is React.ReactElement<any> => React.isValidElement(child))
        .forEach((child) => {
            if (elementTypeOf(child) === 'Select.Option') {
                optionIndex++;
                // flattenChildren keys every child, so key is never null here
                options.push(toOptionRecord(readOption(child), optionIndex, undefined, child.key as string));
            } else if (elementTypeOf(child) === 'Select.OptGroup') {
                // keeping the children ReactNode on every group is a performance problem
                let { children, ...restGroupProps } = child.props;
                restGroupProps.key = child.key;
                flattenChildren(children).forEach((option) => {
                    if (!isSelectOption(option)) {
                        warning(true, '[Semi Select] The children of `Select.OptGroup` should be `Select.Option`');
                        return;
                    }
                    optionIndex++;
                    // the group key prefix keeps toArray's generated keys (.0, .1) unique across groups
                    options.push(toOptionRecord(readOption(option), optionIndex, restGroupProps, `${child.key}${option.key}`));
                });
            } else {
                warning(true, '[Semi Select] The children of `Select` should be `Select.Option` or `Select.OptGroup`');
            }
        });
    return options;
}

function isSelectOption(node: React.ReactNode): node is React.ReactElement<any> {
    return React.isValidElement(node) && elementTypeOf(node) === 'Select.Option';
}
