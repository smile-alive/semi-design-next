import { type JSX, Show, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, type OptionPart, type SelectPart } from '@fibrae/semi-foundation/components/select/constants';
import type { SelectRawValue } from '@fibrae/semi-foundation/components/select/option-foundation';
import { getDataAttr } from '@fibrae/semi-foundation/utils';
import { IconTick } from '@fibrae/semi-icons-solid';
import { createToken } from '../../base/index';
import { mergeStyles } from '../../utils/index';
import Highlight from '../highlight';

export const OPTION = 'Select.Option';

/** An option of `optionList`, or the props of `Select.Option`; other fields are kept on the option and passed back in callbacks */
export interface OptionProps<V extends SelectRawValue = SelectRawValue> {
    // `any`, not `unknown`: only an index signature of `any` also accepts interface-typed options
    [key: string]: any;
    value?: V;
    /** Text of the option, searched and highlighted; without it the option is searched by `value` */
    label?: string | number;
    /** Content of the row and of the selection in place of `label`, for markup; only `Select.Option` takes it */
    children?: JSX.Element;
    disabled?: boolean;
    showTick?: boolean;
    class?: string;
    classNames?: Partial<Record<OptionPart, string>>;
    style?: JSX.CSSProperties | string;
    styles?: Partial<Record<OptionPart, JSX.CSSProperties | string>>;
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
    focused?: boolean;
    /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
    current?: boolean;
    showTick?: boolean;
    inputValue?: string;
    semiOptionId?: string;
    prefixCls?: string;
    class?: string;
    classNames?: Partial<Record<OptionPart, string>>;
    style?: JSX.CSSProperties | string;
    styles?: Partial<Record<OptionPart, JSX.CSSProperties | string>>;
    /** The `item*` parts of the parent, applied before the option's own */
    parentClassNames?: Partial<Record<SelectPart, string>>;
    parentStyles?: Partial<Record<SelectPart, JSX.CSSProperties | string>>;
    children?: JSX.Element;
    onSelect?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
}

export function OptionView(props: OptionViewProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'classNames', 'current', 'disabled', 'empty', 'focused', 'inputValue', 'onMouseEnter', 'onSelect', 'parentClassNames', 'parentStyles', 'prefixCls', 'selected', 'semiOptionId', 'showTick', 'style', 'styles']);

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
            local.parentClassNames?.item,
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
                <div class={rowClass()} style={local.style} x-semi-prop="emptyContent">
                    {content()}
                </div>
            }
        >
            {/* keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus */}
            <div
                {...getDataAttr(rest)}
                id={local.semiOptionId}
                class={rowClass()}
                style={mergeStyles(local.parentStyles?.item, local.style)}
                aria-disabled={local.disabled ? 'true' : 'false'}
                aria-selected={local.selected || local.current ? 'true' : 'false'}
                role="option"
                onClick={handleClick}
                onMouseEnter={(e) => local.onMouseEnter?.(e)}
            >
                <Show when={local.showTick}>
                    <div class={clsx(`${prefixCls()}-icon`, local.parentClassNames?.itemIcon, local.classNames?.icon)} style={mergeStyles(local.parentStyles?.itemIcon, local.styles?.icon)}>
                        <IconTick />
                    </div>
                </Show>
                <Show when={text() !== undefined} fallback={content()}>
                    <div class={clsx(`${prefixCls()}-text`, local.parentClassNames?.itemContent, local.classNames?.content)} style={mergeStyles(local.parentStyles?.itemContent, local.styles?.content)}>
                        <Show when={local.inputValue} fallback={text()}>
                            {(keyword) => <Highlight classNames={{ highlight: `${prefixCls()}-keyword` }} searchWords={[keyword()]} sourceString={text()} />}
                        </Show>
                    </div>
                </Show>
            </div>
        </Show>
    );
}
