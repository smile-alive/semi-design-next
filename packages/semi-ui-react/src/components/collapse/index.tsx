import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/collapse/constants';
import CollapseFoundation, { type CollapseAdapter, type CollapseProps, type CollapseState } from '@fibrae/semi-foundation/components/collapse/foundation';
import '@fibrae/semi-foundation/components/collapse/collapse.scss';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import { CollapseContext } from './context';
import CollapsePanel from './item';

type Foundation = CollapseFoundation<CollapseClickEvent>;
type Adapter = CollapseAdapter<CollapseClickEvent>;

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
    expandIconPosition: 'right',
    lazyRender: false,
} satisfies Partial<CollapseReactProps>;

function Collapse(rawProps: CollapseReactProps) {
    const props = useDefaultProps('Collapse', rawProps, defaultProps);
    const { ref, activeKey, defaultActiveKey, accordion, onChange, lazyRender, motion, className, keepDOM, expandIconPosition, expandIcon, collapseIcon, children, clickHeaderToExpand, ...rest } = props;

    const [foundation, state] = useFoundation<Foundation, Adapter, CollapseReactProps, CollapseState>(
        CollapseFoundation,
        props,
        () => CollapseFoundation.getInitialState(props),
        (base) => ({
            notifyChange: (activeKey, e) => base.getProps().onChange?.(activeKey, e),
        })
    );

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
