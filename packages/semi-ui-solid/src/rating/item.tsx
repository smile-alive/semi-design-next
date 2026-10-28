import { type JSX, type ResolvedChildren, Show, children, createMemo } from 'solid-js';
import clsx from 'clsx';
import { type strings, cssClasses } from '@fibrae/semi-foundation/rating/constants';
import RatingFoundation from '@fibrae/semi-foundation/rating/foundation';
import { IconStar } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import { useLocale } from '../locale';
import { useTooltipDescription } from '../tooltip/context';

export interface RatingItemProps {
    /** The committed value: decides aria-checked and the roving Tab stop */
    value: number;
    /** The value the star fill shows: the hovered value while hovering, else `value` */
    displayValue: number;
    index: number;
    prefixCls: string;
    allowHalf: boolean;
    character?: JSX.Element;
    /** `character` as the Rating already resolved it: the second radio inserts it instead of reading `character` again */
    resolvedCharacter?: () => ResolvedChildren;
    disabled: boolean;
    count: number;
    /** No radio stands for the value: this star's first radio is the Tab stop */
    firstTabStop: boolean;
    size: number | (typeof strings.SIZE_SET)[number];
    /** The unit named after n stars: singular for 1, plural otherwise */
    unitOf: (n: number) => string;
    /** What the star's Tooltip puts on its trigger */
    liProps?: JSX.HTMLAttributes<HTMLLIElement>;
    onHover: (event: MouseEvent, index: number) => void;
    onClick: (event: MouseEvent, index: number) => void;
    /** Enter or Space on a radio, or a click without a pointer (assistive technology): the value that radio stands for */
    onSelect: (event: KeyboardEvent | MouseEvent, index: number, value: number) => void;
    /** A radio of this star got focus */
    onFocus: (event: FocusEvent & { target: Element }, index: number) => void;
}

export default function Item(props: RatingItemProps) {
    const locale = useLocale('Rating');
    const description = useTooltipDescription();

    let firstRadio: HTMLDivElement | undefined;
    let secondRadio: HTMLDivElement | undefined;

    const model = createMemo(() => RatingFoundation.getItemModel(props));

    const isCustomSize = () => typeof props.size === 'number';

    const isEmpty = () => props.index === props.count;

    // a function replacer keeps `$&` and `$$` in a custom unit literal
    const itemName = (n: number) => {
        const unit = props.unitOf(n);
        return locale()
            .locale.itemLabel.replace('${value}', String(n))
            .replace('${unit}', () => unit);
    };

    const radioValueOf = (target: EventTarget | null) => (target === firstRadio ? model().firstValue : target === secondRadio ? model().secondValue : undefined);

    const handleClick = (event: MouseEvent) => {
        if (props.disabled) {
            return;
        }
        const radioValue = RatingFoundation.resolveClickRadio(event.detail, radioValueOf(event.target));
        if (radioValue === undefined) {
            props.onClick(event, props.index);
        } else {
            props.onSelect(event, props.index, radioValue);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (props.disabled) {
            return;
        }
        const { preventDefault, selectValue } = RatingFoundation.resolveKeyActivation(event.key, radioValueOf(event.target), props.value);
        if (preventDefault) {
            event.preventDefault();
        }
        if (selectValue !== undefined) {
            props.onSelect(event, props.index, selectValue);
        }
    };

    // Resolved once per radio: one DOM node cannot sit in both radios
    const content = (resolved?: () => ResolvedChildren) => {
        const character = resolved ?? children(() => props.character);
        return (
            <Show when={hasContent(character())} fallback={<IconStar style={{ display: 'block' }} size={isCustomSize() ? 'inherit' : props.size === 'small' ? 'default' : 'extra-large'} />}>
                {character()}
            </Show>
        );
    };

    return (
        <li
            {...props.liProps}
            class={clsx(props.prefixCls, {
                [`${props.prefixCls}-half`]: model().isHalf,
                [`${props.prefixCls}-full`]: model().isFull,
                [`${props.prefixCls}-${props.size}`]: !isCustomSize(),
            })}
            style={isCustomSize() ? { width: `${props.size}px`, height: `${props.size}px`, 'font-size': `${props.size}px` } : undefined}
            role="none"
        >
            <div class={clsx(`${props.prefixCls}-wrapper`, { [`${props.prefixCls}-disabled`]: props.disabled })} role="presentation" onClick={handleClick} onKeyDown={handleKeyDown} onMouseMove={(event) => !props.disabled && props.onHover(event, props.index)}>
                <Show when={props.allowHalf && !isEmpty()}>
                    <div
                        ref={(node) => (firstRadio = node)}
                        class={clsx(`${props.prefixCls}-first`, `${cssClasses.PREFIX}-no-focus`)}
                        style={{ width: model().firstWidth }}
                        aria-checked={props.value === model().firstValue}
                        aria-describedby={description?.()}
                        aria-disabled={props.disabled}
                        aria-label={itemName(model().firstValue)}
                        aria-posinset={2 * props.index + 1}
                        aria-setsize={model().setSize}
                        role="radio"
                        tabIndex={model().firstTabIndex}
                        onFocus={(event) => props.onFocus(event, props.index)}
                    >
                        {content()}
                    </div>
                </Show>
                <div
                    ref={(node) => (secondRadio = node)}
                    class={clsx(`${props.prefixCls}-second`, `${cssClasses.PREFIX}-no-focus`)}
                    aria-checked={props.value === model().secondValue}
                    aria-describedby={description?.()}
                    aria-disabled={props.disabled}
                    aria-label={itemName(model().secondValue)}
                    aria-posinset={model().secondPosInSet}
                    aria-setsize={model().setSize}
                    role="radio"
                    tabIndex={model().secondTabIndex}
                    x-semi-prop="character"
                    onFocus={(event) => props.onFocus(event, props.index)}
                >
                    {content(props.resolvedCharacter)}
                </div>
            </div>
        </li>
    );
}
