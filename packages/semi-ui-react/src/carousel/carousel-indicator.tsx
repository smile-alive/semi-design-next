import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/carousel/constants';
import useLocale from '../locale/use-locale';
import type { CarouselIndicatorProps } from './interface';

export default function CarouselIndicator({ type, size, theme, style, className, position, total, activeIndex, trigger, onIndicatorChange, getTabId, getSlideId, ref, onKeyDown, onBlur }: CarouselIndicatorProps) {
    const { locale } = useLocale('Carousel');

    return (
        <div
            ref={ref}
            className={clsx(className, cssClasses.CAROUSEL_INDICATOR, {
                [`${cssClasses.CAROUSEL_INDICATOR}-${type}`]: type,
                [`${cssClasses.CAROUSEL_INDICATOR}-${position}`]: position,
            })}
            style={style}
            aria-label={locale.indicators}
            role="tablist"
        >
            {Array.from({ length: total }, (_, i) => (
                <button
                    key={i}
                    id={getTabId(i)}
                    type="button"
                    className={clsx(`${cssClasses.CAROUSEL_INDICATOR}-item`, {
                        [`${cssClasses.CAROUSEL_INDICATOR}-item-active`]: i === activeIndex,
                        [`${cssClasses.CAROUSEL_INDICATOR}-item-${theme}`]: theme,
                        [`${cssClasses.CAROUSEL_INDICATOR}-item-${size}`]: size,
                    })}
                    data-index={i}
                    aria-controls={getSlideId(i)}
                    aria-label={locale.slideN.replace('${index}', String(i + 1))}
                    aria-selected={i === activeIndex}
                    role="tab"
                    tabIndex={i === activeIndex ? 0 : -1}
                    onBlur={onBlur}
                    onClick={() => {
                        if (trigger === 'click') {
                            onIndicatorChange(i);
                        }
                    }}
                    onKeyDown={onKeyDown}
                    onMouseEnter={() => {
                        if (trigger === 'hover') {
                            onIndicatorChange(i);
                        }
                    }}
                />
            ))}
        </div>
    );
}
