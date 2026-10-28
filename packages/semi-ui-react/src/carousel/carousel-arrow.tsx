import { type ReactNode, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/carousel/constants';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-react';
import useLocale from '../locale/use-locale';
import type { CarouselArrowProps } from './interface';

// Text rendered inside a child component is invisible here; such arrows pass `aria-label` through `props`.
function hasReadableText(node: ReactNode): boolean {
    if (typeof node === 'string') {
        return node.trim() !== '';
    }
    if (typeof node === 'number') {
        return true;
    }
    if (Array.isArray(node)) {
        return node.some(hasReadableText);
    }
    if (isValidElement<{ 'aria-label'?: string; children?: ReactNode }>(node)) {
        return Boolean(node.props['aria-label']) || hasReadableText(node.props.children);
    }
    return false;
}

export default function CarouselArrow({ type, theme, prev, next, arrowProps }: CarouselArrowProps) {
    const { locale } = useLocale('Carousel');

    const leftChildren = arrowProps?.leftArrow?.children;
    const rightChildren = arrowProps?.rightArrow?.children;
    const themeCls = { [`${cssClasses.CAROUSEL_ARROW}-${theme}`]: theme };

    return (
        <div
            className={clsx(cssClasses.CAROUSEL_ARROW, themeCls, {
                [`${cssClasses.CAROUSEL_ARROW}-hover`]: type === 'hover',
            })}
        >
            <button type="button" className={clsx(`${cssClasses.CAROUSEL_ARROW}-prev`, themeCls)} aria-label={hasReadableText(leftChildren) ? undefined : locale.prev} onClick={prev} {...arrowProps?.leftArrow?.props} x-semi-prop="arrowProps.leftArrow.children">
                {leftChildren === undefined ? <IconChevronLeft size="inherit" /> : leftChildren}
            </button>
            <button type="button" className={clsx(`${cssClasses.CAROUSEL_ARROW}-next`, themeCls)} aria-label={hasReadableText(rightChildren) ? undefined : locale.next} onClick={next} {...arrowProps?.rightArrow?.props} x-semi-prop="arrowProps.rightArrow.children">
                {rightChildren === undefined ? <IconChevronRight size="inherit" /> : rightChildren}
            </button>
        </div>
    );
}
