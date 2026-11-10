import { children, createEffect, type JSX, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/components/backtop/constants';
import BackTopFoundation, { type BackTopAdapter, type BackTopState, type Target } from '@fibrae/semi-foundation/components/backtop/foundation';
import '@fibrae/semi-foundation/components/backtop/backtop.scss';
import { IconBackTop } from '@fibrae/semi-icons-solid';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { callHandler, hasContent, mergeRefs } from '../../utils/index';
import FloatButton, { type FloatButtonElement, type FloatButtonProps } from '../float-button';
import type { FloatButtonOmittedKeys } from '../float-button/interface';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export interface BackTopProps extends ElementProps<'button', FloatButtonOmittedKeys>, Pick<FloatButtonProps, 'icon' | 'shape' | 'size' | 'colorful' | 'badge' | 'onClick' | 'ref'> {
    /** Static content of the button, shown in place of `icon`; must not contain interactive elements */
    children?: JSX.Element;
    target?: () => Target | null;
    visibilityHeight?: number;
    duration?: number;
    /** Accessible name of the button, needed whenever it shows only an icon */
    'aria-label'?: string;
}

export type { BackTopState };

type ClickEvent = MouseEvent & { currentTarget: FloatButtonElement; target: Element };
type Foundation = BackTopFoundation<BackTopProps, ClickEvent>;
type Adapter = BackTopAdapter<BackTopProps, ClickEvent>;

const defaultProps = {
    visibilityHeight: numbers.DEFAULT_VISIBILITY_HEIGHT,
    duration: numbers.DEFAULT_DURATION,
} satisfies Partial<BackTopProps>;

export default function BackTop(rawProps: BackTopProps) {
    const props = useDefaultProps('BackTop', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'icon', 'class', 'onClick', 'visibilityHeight', 'target', 'duration', 'aria-label', 'ref']);

    const locale = useLocale('BackTop');

    let button: FloatButtonElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, BackTopProps, BackTopState>(
        BackTopFoundation,
        props,
        () => BackTopFoundation.getInitialState(),
        (base) => ({
            notifyClick: (event) => callHandler(base.getProps().onClick, event),
        })
    );

    // reading creates the content, so it waits for the button: content created while hidden would never be inserted
    const content = children(() => (state().visible ? local.children : undefined));

    const hasChildren = () => hasContent(content());

    createEffect(() => {
        if (hasChildren() && state().visible) {
            BackTopFoundation.warnInteractiveChildren(button);
        }
    });

    return (
        <Show when={state().visible}>
            <FloatButton
                {...rest}
                ref={mergeRefs(local.ref, (node: FloatButtonElement) => (button = node))}
                class={clsx(prefixCls, local.class)}
                // static children are the visible name; a different default would contradict them
                aria-label={local['aria-label'] ?? (hasChildren() ? undefined : locale().locale.backToTop)}
                x-semi-prop="children"
                icon={hasChildren() ? content() : (local.icon ?? <IconBackTop />)}
                onClick={(event) => foundation.onClick(event)}
            />
        </Show>
    );
}
