import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/collapse/constants';
import CollapseFoundation, { type CollapseAdapter, type CollapseProps, type CollapseState } from '@fibrae/semi-foundation/collapse/foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/collapse/collapse.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { CollapseContext } from './collapse-context';
import CollapsePanel from './item';

export type { CollapsePanelProps } from './item';

type CollapseClickEvent = React.MouseEvent;

export interface CollapseReactProps extends CollapseProps, ElementProps<'div', 'onChange'> {
    expandIcon?: React.ReactNode;
    collapseIcon?: React.ReactNode;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    onChange?: (activeKey: string[], e: CollapseClickEvent) => void;
    lazyRender?: boolean;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export type { CollapseState };

const defaultProps = {
    defaultActiveKey: '',
    clickHeaderToExpand: true,
    onChange: noop,
    expandIconPosition: 'right',
    lazyRender: false,
} satisfies Partial<CollapseReactProps>;

function Collapse(rawProps: CollapseReactProps) {
    const props = useDefaultProps('Collapse', rawProps, defaultProps);
    const { ref, activeKey, defaultActiveKey, accordion, onChange, lazyRender, motion, className, keepDOM, expandIconPosition, expandIcon, collapseIcon, children, clickHeaderToExpand, ...rest } = props;

    const [foundation, state] = useFoundation<CollapseFoundation<CollapseClickEvent>, CollapseAdapter<CollapseClickEvent>, CollapseReactProps, CollapseState>(
        CollapseFoundation,
        props,
        () => CollapseFoundation.getInitialState(props),
        (base) => ({
            notifyChange: (activeKey, e) => base.getProps().onChange(activeKey, e),
            setActiveSet: (activeSet) => base.setState({ activeSet }),
        })
    );

    useDidUpdate(props.activeKey, foundation.syncActiveKey);

    return (
        <div {...rest} ref={ref} className={clsx(cssClasses.PREFIX, className)}>
            <CollapseContext
                value={{
                    activeSet: CollapseFoundation.deriveActiveSet(props, state),
                    expandIcon,
                    collapseIcon,
                    clickHeaderToExpand,
                    keepDOM,
                    expandIconPosition,
                    onClick: foundation.handleChange,
                    motion,
                    lazyRender,
                }}
            >
                {children}
            </CollapseContext>
        </div>
    );
}

export default Object.assign(Collapse, { Panel: CollapsePanel });
