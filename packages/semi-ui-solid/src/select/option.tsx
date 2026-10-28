import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/select/constants';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import { IconTick } from '@fibrae/semi-icons-solid';
import { createToken } from '../_base/token';
import Highlight from '../highlight';

export const OPTION = 'Select.Option';

/** An option of `optionList`, or the props of `Select.Option`; other fields are kept on the option and passed back in callbacks */
export interface OptionProps {
    // `any`, not `unknown`: only an index signature of `any` also accepts interface-typed options
    [key: string]: any;
    value?: string | number;
    /** Text of the option, searched and highlighted; without it the option is searched by `value` */
    label?: string | number;
    /** Content of the row and of the selection in place of `label`, for markup; only `Select.Option` takes it */
    children?: JSX.Element;
    disabled?: boolean;
    showTick?: boolean;
    class?: string;
    style?: JSX.CSSProperties | string;
}

/**
 * Inside a Select an Option renders nothing itself: Select reads its props and renders the row with `OptionView`.
 */
export default function Option(props: OptionProps) {
    return createToken(OPTION, props);
}

/** One row of a Select or AutoComplete dropdown; `data-*` attributes land on the row */
export interface OptionViewProps {
    [key: `data-${string}`]: unknown;
    /** The row stands for the empty state; `children` is its content */
    empty?: boolean;
    disabled?: boolean;
    selected?: boolean;
    /** Highlighted by the keyboard or the pointer */
    focused?: boolean;
    /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
    current?: boolean;
    showTick?: boolean;
    /** Highlighted in a plain-text label */
    inputValue?: string;
    semiOptionId?: string;
    prefixCls?: string;
    class?: string;
    style?: JSX.CSSProperties | string;
    children?: JSX.Element;
    onSelect?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
}

export function OptionView(props: OptionViewProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'current', 'disabled', 'empty', 'focused', 'inputValue', 'onMouseEnter', 'onSelect', 'prefixCls', 'selected', 'semiOptionId', 'showTick', 'style']);

    const content = children(() => local.children);

    const prefixCls = () => local.prefixCls ?? cssClasses.PREFIX_OPTION;

    const rowClass = () =>
        clsx(
            prefixCls(),
            {
                [`${prefixCls()}-disabled`]: local.disabled,
                [`${prefixCls()}-selected`]: local.selected,
                [`${prefixCls()}-focused`]: local.focused,
                [`${prefixCls()}-empty`]: local.empty,
            },
            local.class
        );

    const text = () => {
        const value = content();
        return typeof value === 'string' ? value : undefined;
    };

    const handleClick = (e: MouseEvent) => {
        if (!local.disabled) {
            local.onSelect?.(e);
        }
    };

    return (
        <Show
            when={!local.empty}
            fallback={
                <div class={rowClass()} x-semi-prop="emptyContent">
                    {content()}
                </div>
            }
        >
            {/* keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus */}
            <div {...getDataAttr(rest)} id={local.semiOptionId} class={rowClass()} style={local.style} aria-disabled={local.disabled ? 'true' : 'false'} aria-selected={local.selected || local.current ? 'true' : 'false'} role="option" onClick={handleClick} onMouseEnter={(e) => local.onMouseEnter?.(e)}>
                <Show when={local.showTick}>
                    <div class={`${prefixCls()}-icon`}>
                        <IconTick />
                    </div>
                </Show>
                <Show when={text() !== undefined} fallback={content()}>
                    <div class={`${prefixCls()}-text`}>
                        <Show when={local.inputValue} fallback={text()}>
                            {(keyword) => <Highlight highlightClassName={`${prefixCls()}-keyword`} searchWords={[keyword()]} sourceString={text()} />}
                        </Show>
                    </div>
                </Show>
            </div>
        </Show>
    );
}
