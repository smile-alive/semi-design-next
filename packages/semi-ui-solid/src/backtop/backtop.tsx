import { children, createEffect, createMemo, type JSX, onCleanup, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { throttle } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/backtop/constants';
import BackTopFoundation, { type BackTopAdapter, type Target } from '@fibrae/semi-foundation/backtop/foundation';
import '@fibrae/semi-foundation/backtop/backtop.scss';
import { IconBackTop } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import FloatButton, { type FloatButtonElement, type FloatButtonProps } from '../float-button';
import type { FloatButtonOmittedKeys } from '../float-button/interface';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

function getDefaultTarget() {
    return window;
}

export interface BackTopProps extends ElementProps<'button', FloatButtonOmittedKeys>, Pick<FloatButtonProps, 'icon' | 'shape' | 'size' | 'colorful' | 'badge' | 'onClick' | 'ref'> {
    /** Static content of the button, shown in place of `icon`; must not contain interactive elements */
    children?: JSX.Element;
    target?: () => Target | null;
    visibilityHeight?: number;
    duration?: number;
    /** Accessible name of the button, needed whenever it shows only an icon */
    'aria-label'?: string;
}

export interface BackTopState {
    visible?: boolean;
}

type ClickEvent = MouseEvent & { currentTarget: FloatButtonElement; target: Element };
type Foundation = BackTopFoundation<BackTopProps, BackTopState, ClickEvent>;
type Adapter = BackTopAdapter<BackTopProps, BackTopState, ClickEvent>;

const defaultProps = {
    visibilityHeight: 400,
    target: getDefaultTarget,
    duration: 450,
} satisfies Partial<BackTopProps>;

export default function BackTop(rawProps: BackTopProps) {
    const props = useDefaultProps('BackTop', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['children', 'icon', 'class', 'onClick', 'visibilityHeight', 'target', 'duration', 'aria-label', 'ref']);

    const locale = useLocale('BackTop');

    let button: FloatButtonElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, BackTopProps, BackTopState>(
        BackTopFoundation,
        props,
        () => ({ visible: false }),
        (base) => ({
            updateVisible: (visible) => base.setState({ visible }),
            notifyClick: (event) => callHandler(base.getProps().onClick, event),
        })
    );

    // reading creates the content, so it waits for the button: content created while hidden would never be inserted
    const content = children(() => (state().visible ? local.children : undefined));
    const duration = createMemo(() => local.duration);

    const handleClick = createMemo(() => {
        const throttled = throttle((event: ClickEvent) => foundation.onClick(event), duration());
        onCleanup(() => throttled.cancel());
        return throttled;
    });

    const hasChildren = () => hasContent(content());

    useWatch(
        () => local.target,
        () => foundation.handleTargetChange()
    );

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
                onClick={(event) => handleClick()(event)}
            />
        </Show>
    );
}
