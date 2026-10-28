import type React from 'react';
import { useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { type strings, cssClasses } from '@fibrae/semi-foundation/rating/constants';
import RatingFoundation from '@fibrae/semi-foundation/rating/foundation';
import '@fibrae/semi-foundation/rating/rating.scss';
import { IconStar } from '@fibrae/semi-icons-react';
import type { ArrayElement } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import useLocale from '../locale/use-locale';

export interface RatingItemHandle {
    /** Focuses the radio of this star that stands for `value`: the first half for a half value */
    starFocus: (value: number) => void;
    getDomNode: () => HTMLLIElement | null;
}

export interface RatingItemProps extends BaseProps {
    /** The committed value: decides aria-checked and the roving Tab stop */
    value: number;
    /** The value the star fill shows: the hovered value while hovering, else `value` */
    displayValue: number;
    index: number;
    prefixCls: string;
    allowHalf: boolean;
    onHover: (e: React.MouseEvent, index: number) => void;
    onClick: (e: React.MouseEvent, index: number) => void;
    /** Enter or Space on a radio, or a click without a pointer (assistive technology): the value that radio stands for */
    onSelect: (e: React.KeyboardEvent | React.MouseEvent, index: number, value: number) => void;
    /** No radio stands for the value: this star's first radio is the Tab stop */
    firstTabStop?: boolean;
    character: React.ReactNode;
    disabled: boolean;
    count: number;
    /** the unit named after n stars: singular for 1, plural otherwise */
    unitOf: (n: number) => string;
    size: number | ArrayElement<typeof strings.SIZE_SET>;
    'aria-describedby'?: React.AriaAttributes['aria-describedby'];
    /** A radio of this star got focus; `index` is this star's index */
    onFocus?: (e: React.FocusEvent, index: number) => void;
    preventScroll?: boolean;
    ref?: React.Ref<RatingItemHandle>;
}

export default function Item(props: RatingItemProps) {
    const { ref, index, prefixCls, character, count, value, displayValue, disabled, allowHalf, size, unitOf, preventScroll, firstTabStop, onClick, onSelect, onHover, onFocus } = props;

    const { locale } = useLocale('Rating');

    const liRef = useRef<HTMLLIElement>(null);
    const firstStarRef = useRef<HTMLDivElement>(null);
    const secondStarRef = useRef<HTMLDivElement>(null);

    const { isHalf, isFull, firstWidth, firstValue, secondValue, setSize, firstTabIndex, secondTabIndex, secondPosInSet } = RatingFoundation.getItemModel({ index, count, allowHalf, value, displayValue, disabled, firstTabStop });
    const isCustomSize = typeof size === 'number';

    const starCls = clsx(prefixCls, {
        [`${prefixCls}-half`]: isHalf,
        [`${prefixCls}-full`]: isFull,
        [`${prefixCls}-${size}`]: !isCustomSize,
    });

    const sizeStyle = isCustomSize ? { width: size, height: size, fontSize: size } : {};
    const iconSize = isCustomSize ? 'inherit' : size === 'small' ? 'default' : 'extra-large';
    const content = character ? character : <IconStar style={{ display: 'block' }} size={iconSize} />;
    const isEmpty = index === count;
    const starWrapCls = clsx(`${prefixCls}-wrapper`, { [`${prefixCls}-disabled`]: disabled });

    // a function replacer keeps `$&` and `$$` in a custom unit literal
    const itemName = (n: number) => locale.itemLabel.replace('${value}', String(n)).replace('${unit}', () => unitOf(n));

    const handleFocus = (e: React.FocusEvent) => onFocus?.(e, index);

    const radioValueOf = (target: EventTarget) => (target === firstStarRef.current ? firstValue : target === secondStarRef.current ? secondValue : undefined);

    const handleClick = (e: React.MouseEvent) => {
        const radioValue = RatingFoundation.resolveClickRadio(e.detail, radioValueOf(e.target));
        if (radioValue === undefined) {
            onClick(e, index);
        } else {
            onSelect(e, index, radioValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const { preventDefault, selectValue } = RatingFoundation.resolveKeyActivation(e.key, radioValueOf(e.target), value);
        if (preventDefault) {
            e.preventDefault();
        }
        if (selectValue !== undefined) {
            onSelect(e, index, selectValue);
        }
    };

    useImperativeHandle(
        ref,
        () => ({
            starFocus: (starValue) => {
                const star = RatingFoundation.isFirstRadio(starValue, index, allowHalf) ? firstStarRef.current : secondStarRef.current;
                star.focus({ preventScroll });
            },
            getDomNode: () => liRef.current,
        }),
        [allowHalf, index, preventScroll]
    );

    return (
        <li ref={liRef} className={starCls} style={sizeStyle} role="none">
            <div className={starWrapCls} role="presentation" onClick={disabled ? null : handleClick} onKeyDown={disabled ? null : handleKeyDown} onMouseMove={disabled ? null : (e) => onHover(e, index)}>
                {allowHalf && !isEmpty && (
                    <div
                        ref={firstStarRef}
                        className={clsx(`${prefixCls}-first`, `${cssClasses.PREFIX}-no-focus`)}
                        style={{ width: firstWidth }}
                        aria-checked={value === firstValue}
                        aria-describedby={props['aria-describedby']}
                        aria-disabled={disabled}
                        aria-label={itemName(firstValue)}
                        aria-posinset={2 * index + 1}
                        aria-setsize={setSize}
                        role="radio"
                        tabIndex={firstTabIndex}
                        onFocus={handleFocus}
                    >
                        {content}
                    </div>
                )}
                <div
                    ref={secondStarRef}
                    className={clsx(`${prefixCls}-second`, `${cssClasses.PREFIX}-no-focus`)}
                    aria-checked={value === secondValue}
                    aria-describedby={props['aria-describedby']}
                    aria-disabled={disabled}
                    aria-label={itemName(secondValue)}
                    aria-posinset={secondPosInSet}
                    aria-setsize={setSize}
                    role="radio"
                    tabIndex={secondTabIndex}
                    x-semi-prop="character"
                    onFocus={handleFocus}
                >
                    {content}
                </div>
            </div>
        </li>
    );
}
