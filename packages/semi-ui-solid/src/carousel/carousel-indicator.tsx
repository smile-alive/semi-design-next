import { Index } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/carousel/constants';
import useLocale from '../locale/use-locale';
import type { CarouselIndicatorProps } from './interface';

export default function CarouselIndicator(props: CarouselIndicatorProps) {
    const locale = useLocale('Carousel');

    const tabs = () => Array.from({ length: props.total }, (_, index) => index);

    return (
        <div
            ref={props.ref}
            class={clsx(cssClasses.CAROUSEL_INDICATOR, {
                [`${cssClasses.CAROUSEL_INDICATOR}-${props.type}`]: props.type,
                [`${cssClasses.CAROUSEL_INDICATOR}-${props.position}`]: props.position,
            })}
            aria-label={locale().locale.indicators}
            role="tablist"
        >
            <Index each={tabs()}>
                {(_, i) => (
                    <button
                        id={props.getTabId(i)}
                        type="button"
                        class={clsx(`${cssClasses.CAROUSEL_INDICATOR}-item`, {
                            [`${cssClasses.CAROUSEL_INDICATOR}-item-active`]: i === props.activeIndex,
                            [`${cssClasses.CAROUSEL_INDICATOR}-item-${props.theme}`]: props.theme,
                            [`${cssClasses.CAROUSEL_INDICATOR}-item-${props.size}`]: props.size,
                        })}
                        data-index={i}
                        aria-controls={props.getSlideId(i)}
                        aria-label={locale().locale.slideN.replace('${index}', String(i + 1))}
                        aria-selected={i === props.activeIndex}
                        role="tab"
                        tabIndex={i === props.activeIndex ? 0 : -1}
                        onBlur={props.onBlur}
                        onClick={() => {
                            if (props.trigger === 'click') {
                                props.onIndicatorChange(i);
                            }
                        }}
                        onKeyDown={props.onKeyDown}
                        onMouseEnter={() => {
                            if (props.trigger === 'hover') {
                                props.onIndicatorChange(i);
                            }
                        }}
                    />
                )}
            </Index>
        </div>
    );
}
