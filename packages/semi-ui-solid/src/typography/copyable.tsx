import { type JSX, Show, children, createEffect, mergeProps, on } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
import { IconCopy, IconTick } from '@fibrae/semi-icons-solid';
import useCopied from '../_base/use-copied';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import type { CopyableConfig } from './interface';

const prefixCls = cssClasses.PREFIX;

export interface CopyableProps {
    content?: string;
    copyTip?: CopyableConfig['copyTip'];
    duration?: number;
    /** Receives the wrapping span, also around the node of `render` */
    ref?: (element: HTMLSpanElement) => void;
    successTip?: CopyableConfig['successTip'];
    icon?: CopyableConfig['icon'];
    onCopy?: (e: MouseEvent, content: string, res: boolean) => void;
    render?: CopyableConfig['render'];
    class?: string;
    style?: JSX.CSSProperties | string;
}

interface CopyableInnerProps extends CopyableProps {
    /** After the copy action swapped to or from the copied tip, whose width differs: the text beside it is measured again */
    onCopiedChange?: () => void;
}

const defaultProps = {
    content: '',
    duration: 3,
} satisfies Partial<CopyableProps>;

export function Copyable(rawProps: CopyableInnerProps) {
    const props = mergeProps(defaultProps, rawProps);

    const locale = useLocale('Typography');

    const [copied, copyText] = useCopied(() => props.duration * 1000);

    const icon = children(() => (props.render ? undefined : props.icon?.()));

    // created only while shown: JSX created during hydration has no node in the server HTML to claim
    const successTip = children(() => {
        const tip = props.successTip;
        return copied() ? (typeof tip === 'function' ? tip() : tip) : undefined;
    });

    const copy = (e: MouseEvent) => {
        void copyText(props.content).then((res) => props.onCopy?.(e, props.content, res));
    };

    // only a string tip is read: rendered content is markup on the server, whose text and attributes it cannot read
    const copyName = () => (typeof props.copyTip === 'string' && props.copyTip) || locale().locale.copy;

    const copiedName = () => (typeof props.successTip === 'string' && props.successTip) || locale().locale.copied;

    // only read while the tooltip is shown
    const copyTip = () => {
        const tip = props.copyTip;
        return tip === undefined ? locale().locale.copy : typeof tip === 'function' ? tip() : tip;
    };

    const tip = () =>
        successTip() === undefined ? (
            <span>
                <IconTick />
                {locale().locale.copied}
            </span>
        ) : (
            successTip()
        );

    // one button for both states keeps keyboard focus across the swap
    const defaultView = () => (
        <span
            ref={(element) => props.ref?.(element)}
            class={clsx(props.class, {
                [`${prefixCls}-action-copy`]: !copied(),
                [`${prefixCls}-action-copied`]: copied(),
            })}
            style={props.style}
        >
            <Tooltip condition={!copied()} content={copyTip()}>
                {(getTriggerProps) => (
                    <button
                        {...getTriggerProps({ type: 'button' })}
                        class={clsx(`${prefixCls}-action-btn`, {
                            [`${prefixCls}-action-copy-icon`]: !copied() && icon() == null,
                        })}
                        aria-label={copied() ? copiedName() : copyName()}
                        onClick={(e) => {
                            if (!copied()) {
                                copy(e);
                            }
                        }}
                    >
                        <Show when={copied()} fallback={icon() ?? <IconCopy />}>
                            {tip()}
                        </Show>
                    </button>
                )}
            </Tooltip>
        </span>
    );

    createEffect(on(copied, () => props.onCopiedChange?.(), { defer: true }));

    // the wrapper is what the JS ellipsis measures to reserve room for the custom node
    return (
        <Show when={props.render} keyed fallback={defaultView()}>
            {(render) => <span ref={(element) => props.ref?.(element)}>{render(copied(), copy, props)}</span>}
        </Show>
    );
}

export default Copyable;
