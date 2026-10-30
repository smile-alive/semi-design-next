import type React from 'react';
import { useImperativeHandle, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/rating/constants';
import RatingFoundation, { type RatingAdapter, type RatingState } from '@fibrae/semi-foundation/rating/foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/rating/rating.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import Item, { type RatingItemHandle } from './item';

export type { RatingItemProps, RatingItemHandle } from './item';
export type { RatingState } from '@fibrae/semi-foundation/rating/foundation';

type RatingClickEvent = React.MouseEvent | React.KeyboardEvent;

export interface RatingHandle {
    focus: () => void;
    blur: () => void;
}

export interface RatingProps extends ElementProps<'ul', 'defaultValue' | 'onChange' | 'onClick'> {
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
    disabled?: boolean;
    value?: number;
    defaultValue?: number;
    count?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    style?: React.CSSProperties;
    prefixCls?: string;
    onChange?: (value: number) => void;
    /** `undefined` when the pointer leaves the stars or a click clears the value */
    onHoverChange?: (value?: number) => void;
    className?: string;
    character?: React.ReactNode;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onClick?: (e: React.MouseEvent | React.KeyboardEvent, index: number) => void;
    autoFocus?: boolean;
    size?: 'small' | 'default' | number;
    tooltips?: string[];
    id?: string;
    preventScroll?: boolean;
    ref?: React.Ref<RatingHandle>;
}

const defaultProps = {
    defaultValue: 0,
    count: 5,
    allowHalf: false,
    allowClear: true,
    style: {},
    prefixCls: cssClasses.PREFIX,
    onChange: noop,
    onHoverChange: noop,
    size: 'default',
} satisfies Partial<RatingProps>;

// Focus goes where Tab would go
const focusTabStop = (list: HTMLUListElement | null, preventScroll?: boolean) => list?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus({ preventScroll });

export default function Rating(rawProps: RatingProps) {
    const props = useDefaultProps('Rating', rawProps, defaultProps);

    const {
        ref,
        style,
        prefixCls,
        disabled,
        className,
        id,
        count,
        allowHalf,
        character,
        size,
        tooltips,
        value: valueProp,
        defaultValue,
        allowClear,
        onChange,
        onHoverChange,
        onClick,
        onFocus,
        onBlur,
        onKeyDown,
        onMouseLeave,
        autoFocus,
        preventScroll,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-label': ariaLabelProp,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        // injected by Form; not DOM attributes, a radiogroup cannot carry a name
        validateStatus,
        insetLabel,
        insetLabelId,
        name,
        // Tooltip's tabIndex 0 is indistinguishable from a caller's; the radios own the roving Tab stop
        tabIndex,
        ...rest
    } = props as RatingProps & {
        validateStatus?: unknown;
        insetLabel?: unknown;
        insetLabelId?: unknown;
        name?: unknown;
    };

    const { locale } = useLocale('Rating');
    const context = useConfigContext();

    // star handles by index; the empty star (index === count) is the last one
    const [stars] = useState(() => new Map<number, RatingItemHandle>());
    const listRef = useRef<HTMLUListElement>(null);

    const [foundation, state] = useFoundation<RatingFoundation<RatingProps, RatingState, RatingClickEvent, React.FocusEvent, React.KeyboardEvent>, RatingAdapter<RatingProps, RatingState, RatingClickEvent, React.FocusEvent, React.KeyboardEvent>, RatingProps, RatingState>(
        RatingFoundation,
        props,
        () => RatingFoundation.getInitialState(props),
        (base) => ({
            focusStar: (starValue) => {
                const { count, allowHalf, preventScroll } = base.getProps();
                // a value between radios has no radio to focus: Tab's landing radio stands in, as for focus()
                if (!RatingFoundation.isRadioValue(starValue, count, allowHalf)) {
                    focusTabStop(listRef.current, preventScroll);
                    return;
                }
                const index = Math.ceil(starValue) - 1;
                stars.get(index < 0 ? count : index).starFocus(starValue);
            },
            getStarDOM: (index) => stars.get(index).getDomNode(),
            setHover: (hoverValue, clearedValue) => base.setState({ hoverValue, clearedValue }),
            notifyHoverChange: (hoverValue) => base.getProps().onHoverChange(hoverValue),
            setValue: (value) => base.setState({ value }),
            notifyChange: (value) => base.getProps().onChange(value),
            setClearedValue: (clearedValue) => base.setState({ clearedValue }),
            notifyClick: (e, index) => base.getProps().onClick?.(e, index),
            notifyFocus: (e) => base.getProps().onFocus?.(e),
            notifyBlur: (e) => base.getProps().onBlur?.(e),
            notifyKeyDown: (e) => base.getProps().onKeyDown?.(e),
            setFocusVisibleStar: (focusVisibleStar) => base.setState({ focusVisibleStar }),
        }),
        context
    );

    const value = RatingFoundation.deriveValue(props, state);
    const onRadio = RatingFoundation.isRadioValue(value, count, allowHalf);
    const { hoverValue, focusVisibleStar } = state;

    // a string character is the unit as is, without pluralization; otherwise the locale names it
    const customUnit = typeof character === 'string' ? character : undefined;

    const unitOf = (n: number) => customUnit ?? (n === 1 ? locale.star : locale.stars);

    // a caller-given aria-label replaces the generated summary as the radiogroup name
    // a function replacer keeps `$&` and `$$` in a custom unit literal
    const ariaLabel =
        ariaLabelProp ||
        locale.label
            .replace('${value}', String(value))
            .replace('${count}', String(count))
            .replace('${unit}', () => unitOf(value));

    // index === count is the empty (zero) star
    const itemList = Array.from({ length: count + 1 }, (_, ind) => {
        const content = (
            <Item
                key={ind}
                ref={(handle) => {
                    stars.set(ind, handle);
                    return () => {
                        stars.delete(ind);
                    };
                }}
                disabled={disabled}
                value={value}
                allowHalf={allowHalf}
                character={character}
                count={count}
                displayValue={hoverValue === undefined ? value : hoverValue}
                firstTabStop={ind === 0 && !onRadio}
                index={ind}
                prefixCls={`${prefixCls}-star`}
                preventScroll={props.preventScroll}
                size={ind === count ? 0 : size}
                unitOf={unitOf}
                onClick={disabled ? noop : foundation.handleClick}
                onFocus={disabled ? noop : foundation.handleStarFocus}
                onHover={disabled ? noop : foundation.handleHover}
                onSelect={disabled ? noop : foundation.handleSelect}
            />
        );
        if (tooltips) {
            return (
                // Item passes the injected aria-describedby to its radios and ignores tabIndex (one roving Tab stop)
                <Tooltip
                    key={ind}
                    // the rating drives this tip, which Escape cannot hide, so the key goes on to the layer below
                    closeOnEsc={false}
                    content={tooltips[ind] ?? ''}
                    trigger="custom"
                    visible={RatingFoundation.isTipVisible(ind, hoverValue, focusVisibleStar, tooltips[ind])}
                >
                    {content}
                </Tooltip>
            );
        }
        return content;
    });

    useDidUpdate(props.value, (value) => {
        if (value === undefined) {
            foundation.resetValue();
        }
    });

    // the same radio autoFocus picks
    useImperativeHandle(
        ref,
        () => ({
            focus: () => {
                if (!disabled) {
                    focusTabStop(listRef.current, props.preventScroll);
                }
            },
            blur: () => {
                const active = FocusTrapHandle.getActiveElement(listRef.current);
                if (!disabled && active instanceof HTMLElement && listRef.current?.contains(active)) {
                    active.blur();
                }
            },
        }),
        [disabled, props.preventScroll]
    );

    return (
        <ul
            {...rest}
            ref={listRef}
            id={id}
            className={clsx(prefixCls, { [`${prefixCls}-disabled`]: disabled }, className)}
            style={style}
            aria-describedby={ariaDescribedby}
            aria-errormessage={ariaErrormessage}
            aria-invalid={ariaInvalid}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-required={ariaRequired}
            role="radiogroup"
            tabIndex={-1}
            // focus that was inside before the rating was disabled must still be released
            onBlur={foundation.handleBlur}
            onFocus={disabled ? noop : foundation.handleFocus}
            onKeyDown={disabled ? noop : (e) => foundation.handleKeyDown(e, value)}
            // a hover that began before the rating was disabled must still end
            onMouseLeave={(e) => {
                onMouseLeave?.(e);
                foundation.handleMouseLeave();
            }}
        >
            {itemList}
        </ul>
    );
}
