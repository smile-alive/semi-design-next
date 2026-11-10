import type React from 'react';
import { type ReactNode, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/button/constants';
import { groupLineClass, inheritGroupLooks, resolveButtonLooks } from '@fibrae/semi-foundation/components/button/utils';
import '@fibrae/semi-foundation/components/button/button.scss';
import type { ElementProps } from '../../base/base';
import type { BaseProps } from '../../base/base-props';
import { usePopupLayer } from '../../base/popup-layer';
import useDefaultProps from '../../base/use-default-props';
import elementTypeOf from '../../utils/element-type';
import flattenChildren from '../../utils/flatten-children';
import { readGlobalDefaults } from '../../utils/semi-global';
import type { Type, Size, ButtonProps, Theme } from './base-button';
import { type ButtonGroupLooks, ButtonGroupContext, useInheritedButtonLooks } from './context';

export type { Theme };

export interface ButtonGroupProps extends BaseProps, ElementProps<'div'> {
    disabled?: boolean;
    type?: Type;
    size?: Size;
    theme?: Theme;
    colorful?: boolean;
    className?: string;
    children?: React.ReactNode;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const prefixCls = cssClasses.PREFIX;

// Resolves the looks in the order Button does, so the line matches the rendered button
function withLines(inner: ReactNode[], group: ButtonGroupLooks) {
    if (inner.length <= 1) {
        return inner;
    }
    const innerWithLine: ReactNode[] = [];
    inner.slice(0, -1).forEach((item, index) => {
        const kind = elementTypeOf(item);
        if (kind !== 'Button' && kind !== 'IconButton') {
            innerWithLine.push(item);
            return;
        }
        const looks = resolveButtonLooks(isValidElement<ButtonProps>(item) ? item.props : {}, group, readGlobalDefaults(kind));
        const lineCls = groupLineClass(prefixCls, looks);
        innerWithLine.push(item);
        if (lineCls) {
            innerWithLine.push(<span key={`line-${index}`} className={lineCls} />);
        }
    });
    innerWithLine.push(inner.at(-1));
    return innerWithLine;
}

export default function ButtonGroup(rawProps: ButtonGroupProps) {
    const { children, disabled, size, type, theme, colorful, className, ...rest } = useDefaultProps('ButtonGroup', rawProps, {});

    const layer = usePopupLayer();

    const parent = useInheritedButtonLooks();

    // A nested group inherits the outer one, then an InputGroup; the group's global defaults come after both, so they
    // are read from the merged props only where the raw ones are unset
    const looks: ButtonGroupLooks = inheritGroupLooks(inheritGroupLooks(rawProps, parent), { disabled, size, type, theme, colorful });

    return (
        <div role="group" {...rest} className={clsx(`${prefixCls}-group`, className)}>
            <ButtonGroupContext value={{ ...looks, layer }}>{withLines(flattenChildren(children), looks)}</ButtonGroupContext>
        </div>
    );
}
