import type React from 'react';
import { type ReactNode, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/button/constants';
import { groupLineClass, inheritGroupLooks, resolveButtonLooks } from '@fibrae/semi-foundation/button/utils';
import '@fibrae/semi-foundation/button/button.scss';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import flattenChildren from '../_base/flatten-children';
import { usePopupLayer } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import { readGlobalDefaults } from '../_utils/semi-global';
import type { Type, Size, ButtonProps, Theme } from './button';
import { type ButtonGroupLooks, ButtonGroupContext, useButtonGroupLooks } from './context';

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

const elementTypeOf = (node: ReactNode) => (isValidElement(node) ? (node.type as { elementType?: string }).elementType : undefined);

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
    const props = useDefaultProps('ButtonGroup', rawProps, {});
    const { children, disabled, size, type, theme, colorful, className, ...rest } = props;

    const layer = usePopupLayer();

    const parent = useButtonGroupLooks();

    // A nested group inherits the outer one
    const looks: ButtonGroupLooks = inheritGroupLooks({ disabled, size, type, theme, colorful }, parent);

    return (
        <div role="group" {...rest} className={clsx(`${prefixCls}-group`, className)}>
            <ButtonGroupContext value={{ ...looks, layer }}>{withLines(flattenChildren(children), looks)}</ButtonGroupContext>
        </div>
    );
}
