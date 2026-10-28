import { children } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/carousel/constants';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import { serverHtml } from '../_base/is-markup';
import useLocale from '../locale/use-locale';
import type { CarouselArrowProps } from './interface';

// Arrow content is resolved to DOM, so text rendered by a child component counts too
function hasReadableText(node: unknown) {
    if (typeof node === 'string') {
        return node.trim() !== '';
    }
    if (typeof node === 'number') {
        return true;
    }
    if (Array.isArray(node)) {
        return node.some(hasReadableText);
    }
    if (isServer) {
        // the server's markup is an HTML string: any aria-label in it, or text left once tags and markers are gone
        const html = serverHtml(node) ?? '';
        return /\baria-label=/.test(html) || html.replace(/<!--[\s\S]*?-->|<[^>]*>/g, '').trim() !== '';
    }
    if (node instanceof Text) {
        return (node.textContent ?? '').trim() !== '';
    }
    if (node instanceof Element) {
        return node.hasAttribute('aria-label') || [...node.childNodes].some(hasReadableText);
    }
    return false;
}

export default function CarouselArrow(props: CarouselArrowProps) {
    const locale = useLocale('Carousel');

    const left = children(() => props.leftArrow);
    const right = children(() => props.rightArrow);

    const themeCls = () => ({ [`${cssClasses.CAROUSEL_ARROW}-${props.theme}`]: props.theme });

    return (
        <div
            class={clsx(cssClasses.CAROUSEL_ARROW, themeCls(), {
                [`${cssClasses.CAROUSEL_ARROW}-hover`]: props.type === 'hover',
            })}
        >
            <button type="button" class={clsx(`${cssClasses.CAROUSEL_ARROW}-prev`, themeCls())} aria-label={hasReadableText(left()) ? undefined : locale().locale.prev} onClick={() => props.prev()} {...props.arrowProps?.leftArrow?.props} x-semi-prop="leftArrow">
                {left() === undefined ? <IconChevronLeft size="inherit" /> : left()}
            </button>
            <button type="button" class={clsx(`${cssClasses.CAROUSEL_ARROW}-next`, themeCls())} aria-label={hasReadableText(right()) ? undefined : locale().locale.next} onClick={() => props.next()} {...props.arrowProps?.rightArrow?.props} x-semi-prop="rightArrow">
                {right() === undefined ? <IconChevronRight size="inherit" /> : right()}
            </button>
        </div>
    );
}
