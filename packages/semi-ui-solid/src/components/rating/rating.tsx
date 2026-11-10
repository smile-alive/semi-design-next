import { type JSX, For, Show, children, createMemo, mergeProps, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/rating/constants';
import RatingFoundation, { type RatingAdapter, type RatingState } from '@fibrae/semi-foundation/components/rating/foundation';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import '@fibrae/semi-foundation/components/rating/rating.scss';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import callHandler from '../../utils/call-handler';
import { omitFormInjected } from '../../utils/control-attrs';
import forwardFocus from '../../utils/forward-focus';
import mergeRefs from '../../utils/merge-refs';
import useConfig from '../config-provider/use-config';
import { useLocale } from '../locale';
import Tooltip from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import Item from './item';

type RatingClickEvent = MouseEvent | KeyboardEvent;
type RatingFocusEvent = FocusEvent & { currentTarget: HTMLElement; relatedTarget: Node | null };
type RatingKeyboardEvent = KeyboardEvent & { currentTarget: HTMLElement };

export type { RatingState };

/**
 * `ref` is the root `ul`, so a Tooltip's trigger props can be spread on a Rating; its `focus()` focuses the star Tab
 * would reach and its `blur()` releases a focused star
 */
export interface RatingProps extends ElementProps<'ul', 'defaultValue' | 'onChange' | 'onClick' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'children'> {
    disabled?: boolean;
    value?: number;
    defaultValue?: number;
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    prefixCls?: string;
    onChange?: (value: number) => void;
    /** `undefined` when the pointer leaves the stars or a click clears the value */
    onHoverChange?: (value?: number) => void;
    character?: JSX.Element;
    /** Dropped: a radiogroup cannot carry a name */
    name?: string;
    /** Called when focus enters the rating, not when it moves between stars */
    onFocus?: (event: RatingFocusEvent) => void;
    /** Called when focus leaves the rating, not when it moves between stars */
    onBlur?: (event: RatingFocusEvent) => void;
    onKeyDown?: (event: RatingKeyboardEvent) => void;
    onClick?: (event: RatingClickEvent, index: number) => void;
    autofocus?: boolean;
    size?: 'small' | 'default' | number;
    tooltips?: string[];
    preventScroll?: boolean;
}

type FoundationProps = RatingProps & { autoFocus?: boolean };
type Foundation = RatingFoundation<FoundationProps, RatingClickEvent, RatingFocusEvent, RatingKeyboardEvent>;
type Adapter = RatingAdapter<FoundationProps, RatingClickEvent, RatingFocusEvent, RatingKeyboardEvent>;

const defaultProps = {
    defaultValue: 0,
    count: 5,
    allowHalf: false,
    allowClear: true,
    prefixCls: cssClasses.PREFIX,
    size: 'default',
} satisfies Partial<RatingProps>;

export default function Rating(rawProps: RatingProps) {
    const props = useDefaultProps('Rating', rawProps, defaultProps);

    // `name` cannot sit on a radiogroup, and Tooltip's tabIndex 0 is indistinguishable from a caller's: the radios own the roving Tab stop
    const [local, rest] = splitProps(omitFormInjected(props), [
        'name',
        'tabIndex',
        'class',
        'ref',
        'disabled',
        'value',
        'defaultValue',
        'count',
        'allowHalf',
        'allowClear',
        'prefixCls',
        'onChange',
        'onHoverChange',
        'character',
        'onFocus',
        'onBlur',
        'onKeyDown',
        'onClick',
        'onFocusIn',
        'onFocusOut',
        'onMouseLeave',
        'autofocus',
        'size',
        'tooltips',
        'preventScroll',
        'aria-label',
    ]);

    const foundationProps = mergeProps(props, {
        get autoFocus() {
            return props.autofocus;
        },
    });

    const config = useConfig();
    const locale = useLocale('Rating');

    let list!: HTMLUListElement;

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: props.disabled }),
        () => local.ref
    );

    const indexes = createMemo(() => Array.from({ length: props.count + 1 }, (_, index) => index));

    // read once here and inserted by the first star, whose result also tells whether the character is a string;
    // the other places read the prop themselves, since one node cannot be inserted twice
    const character = children(() => local.character);

    // a string character is the unit as is, without pluralization; otherwise the locale names it
    const customUnit = createMemo(() => {
        const value = character();
        return typeof value === 'string' ? value : undefined;
    });

    const starAt = (index: number) => list.children[index] as HTMLLIElement | undefined;

    const tabStop = () => list.querySelector<HTMLElement>('[role="radio"][tabindex="0"]');

    const focusTabStop = () => tabStop()?.focus({ preventScroll: props.preventScroll });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, RatingState>(
        RatingFoundation,
        foundationProps,
        (view) => RatingFoundation.getInitialState(view),
        () => ({
            focusStar: (starValue) => {
                // a value between radios has no radio to focus: Tab's landing radio stands in
                if (!RatingFoundation.isRadioValue(starValue, props.count, props.allowHalf)) {
                    focusTabStop();
                    return;
                }
                const index = Math.ceil(starValue) - 1;
                const radios = starAt(index < 0 ? props.count : index)?.querySelectorAll<HTMLElement>('[role="radio"]');
                // the first radio of a star is its half, which only a half value reaches
                radios?.[RatingFoundation.isFirstRadio(starValue, index, props.allowHalf) ? 0 : radios.length - 1].focus({ preventScroll: props.preventScroll });
            },
            getStarDOM: (index) => starAt(index) ?? null,
            notifyHoverChange: (hoverValue) => props.onHoverChange?.(hoverValue),
            notifyChange: (value) => props.onChange?.(value),
            notifyClick: (event, index) => props.onClick?.(event, index),
            notifyFocus: (event) => props.onFocus?.(event),
            notifyBlur: (event) => props.onBlur?.(event),
            notifyKeyDown: (event) => props.onKeyDown?.(event),
        }),
        { context: config }
    );

    const value = () => RatingFoundation.deriveValue(props, state());

    const onRadio = () => RatingFoundation.isRadioValue(value(), props.count, props.allowHalf);

    const unitOf = (n: number) => RatingFoundation.getUnit(n, customUnit(), locale().locale);

    // a caller-given aria-label replaces the generated summary as the radiogroup name
    const ariaLabel = () => local['aria-label'] || formatLocale(locale().locale.label, { value: value(), count: props.count, unit: unitOf(value()) });

    const setup = (node: HTMLUListElement) => {
        list = node;
        // focus() lands where Tab would, as the React handle does; the list itself (tabIndex -1) never takes focus
        forwardFocus(
            node,
            () => (props.disabled ? undefined : tabStop()),
            () => ({ preventScroll: props.preventScroll })
        );
        // an enclosing Tooltip wraps a disabled rating so that it still receives the pointer (F4)
        registerTrigger(node);
    };

    return (
        <ul
            {...rest}
            ref={mergeRefs(setup, local.ref)}
            class={clsx(props.prefixCls, { [`${props.prefixCls}-disabled`]: props.disabled }, local.class)}
            aria-label={ariaLabel()}
            role="radiogroup"
            tabIndex={-1}
            // focus that was inside before the rating was disabled must still be released
            onFocusOut={(event) => {
                callHandler(local.onFocusOut, event);
                foundation.handleBlur(event as RatingFocusEvent);
            }}
            onFocusIn={(event) => {
                callHandler(local.onFocusIn, event);
                if (!props.disabled) {
                    foundation.handleFocus(event as RatingFocusEvent);
                }
            }}
            onKeyDown={(event) => !props.disabled && foundation.handleKeyDown(event, value())}
            // a hover that began before the rating was disabled must still end
            onMouseLeave={(event) => {
                callHandler(local.onMouseLeave, event);
                foundation.handleMouseLeave();
            }}
        >
            <For each={indexes()}>
                {(index) => {
                    const item = (liProps?: JSX.HTMLAttributes<HTMLLIElement>) => (
                        <Item
                            liProps={liProps}
                            disabled={Boolean(props.disabled)}
                            value={value()}
                            allowHalf={props.allowHalf}
                            character={local.character}
                            resolvedCharacter={index === 0 ? character : undefined}
                            count={props.count}
                            displayValue={state().hoverValue === undefined ? value() : state().hoverValue}
                            firstTabStop={index === 0 && !onRadio()}
                            index={index}
                            prefixCls={`${props.prefixCls}-star`}
                            size={index === props.count ? 0 : props.size}
                            unitOf={unitOf}
                            onClick={foundation.handleClick}
                            onFocus={(event, starIndex) => !props.disabled && foundation.handleStarFocus(event, starIndex)}
                            onHover={foundation.handleHover}
                            onSelect={foundation.handleSelect}
                        />
                    );
                    return (
                        <Show when={local.tooltips} fallback={item()}>
                            {/* the rating drives this tip, which Escape cannot hide, so the key goes on to the layer below */}
                            <Tooltip closeOnEsc={false} content={local.tooltips?.[index] ?? ''} trigger="custom" visible={RatingFoundation.isTipVisible(index, state().hoverValue, state().focusVisibleStar, local.tooltips?.[index])}>
                                {/* null hands the description to the star's radios, which Item reads from context */}
                                {(getTriggerProps) => item(getTriggerProps({ 'aria-describedby': null, tabIndex: null }))}
                            </Tooltip>
                        </Show>
                    );
                }}
            </For>
        </ul>
    );
}
