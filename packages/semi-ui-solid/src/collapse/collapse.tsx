import { type JSX, createMemo, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/collapse/constants';
import CollapseFoundation, { type CollapseAdapter, type CollapseProps as CollapseFoundationProps, type CollapseState } from '@fibrae/semi-foundation/collapse/foundation';
import '@fibrae/semi-foundation/collapse/collapse.scss';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import { CollapseContext, type CollapseContextValue } from './context';

type CollapseClickEvent = MouseEvent;

export interface CollapseProps extends Omit<CollapseFoundationProps, 'onChange' | 'expandIcon' | 'collapseIcon' | 'style' | 'className'>, ElementProps<'div', 'onChange'> {
    expandIcon?: JSX.Element;
    collapseIcon?: JSX.Element;
    children?: JSX.Element;
    onChange?: (activeKey: string[], event: CollapseClickEvent) => void;
    lazyRender?: boolean;
}

export type { CollapseState };

type Foundation = CollapseFoundation<CollapseClickEvent>;
type Adapter = CollapseAdapter<CollapseClickEvent>;

const defaultProps = {
    defaultActiveKey: '',
    clickHeaderToExpand: true,
    expandIconPosition: 'right',
    lazyRender: false,
} satisfies Partial<CollapseProps>;

export default function Collapse(rawProps: CollapseProps) {
    const props = useDefaultProps('Collapse', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['activeKey', 'defaultActiveKey', 'accordion', 'onChange', 'lazyRender', 'motion', 'class', 'keepDOM', 'expandIconPosition', 'expandIcon', 'collapseIcon', 'children', 'clickHeaderToExpand']);

    const { foundation, state } = useFoundation<Foundation, Adapter, CollapseFoundationProps, CollapseState>(
        CollapseFoundation,
        props,
        (view) => CollapseFoundation.getInitialState(view),
        (base) => ({
            notifyChange: (activeKey, event) => base.getProps().onChange?.(activeKey, event),
            setActiveSet: (activeSet) => base.setState({ activeSet }),
        })
    );

    const view = createMemo(() => ({
        activeSet: CollapseFoundation.deriveActiveSet(props, state()),
        clickHeaderToExpand: local.clickHeaderToExpand,
        keepDOM: local.keepDOM,
        motion: local.motion,
        lazyRender: local.lazyRender,
        expandIconPosition: local.expandIconPosition,
    }));

    const context: CollapseContextValue = {
        view,
        expandIcon: () => local.expandIcon,
        collapseIcon: () => local.collapseIcon,
        onClick: (itemKey, event) => foundation.handleChange(itemKey, event),
    };

    // a controlled array that is new on every parent update is compared by content inside the foundation
    useWatch(
        () => local.activeKey,
        (activeKey) => foundation.syncActiveKey(activeKey)
    );

    return (
        <div {...rest} class={clsx(cssClasses.PREFIX, local.class)}>
            <CollapseContext.Provider value={context}>{local.children}</CollapseContext.Provider>
        </div>
    );
}
