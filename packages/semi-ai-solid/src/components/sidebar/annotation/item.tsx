import { Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { type AnnotationPart, cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { formatTime } from '@fibrae/semi-foundation/components/video-player/utils';
import { IconPlay } from '@fibrae/semi-icons-solid';
import type { PartStyle } from '../interface';

const prefixCls = cssClasses.ANNOTATION_ITEM;

export interface AnnotationItem {
    type?: 'video' | 'text';
    title?: string;
    url?: string;
    detail?: string;
    logo?: string;
    siteName?: string;
    order?: number;
    onClick?: (event: MouseEvent, item: AnnotationItem) => void;
    img?: string;
    duration?: number;
}

// Items are links, so the browser opens the url itself (middle click and copy link work too)
// shortcut: an item without url is an anchor without href, activatable by pointer only; use a button when such items
// need keyboard access

function handleItemClick(e: MouseEvent, { onClick, ...item }: AnnotationItem) {
    // the owner gets a plain copy of the item, without its own handler
    onClick?.(e, item);
}

interface ItemPartProps {
    classNames?: Partial<Record<AnnotationPart, string>>;
    styles?: Partial<Record<AnnotationPart, PartStyle>>;
}

export function VideoItem(allProps: AnnotationItem & ItemPartProps) {
    const [parts, props] = splitProps(allProps, ['classNames', 'styles']);

    return (
        <a class={clsx(`${prefixCls} ${prefixCls}-video`, parts.classNames?.item)} style={parts.styles?.item} href={props.url} rel="noopener noreferrer" target="_blank" onClick={(e) => handleItemClick(e, props)}>
            <div class={`${prefixCls}-video-img-wrapper`}>
                <Show when={props.img}>
                    <img class={`${prefixCls}-video-img`} alt="" src={props.img} />
                </Show>
                <IconPlay class={`${prefixCls}-video-play`} />
                <Show when={typeof props.duration === 'number'}>
                    <span class={`${prefixCls}-video-duration`}>{formatTime(props.duration!)}</span>
                </Show>
            </div>
            <div class={`${prefixCls}-video-content`}>
                <div class={clsx(`${prefixCls}-title`, parts.classNames?.itemTitle)} style={parts.styles?.itemTitle}>
                    {props.title}
                </div>
                <div class={clsx(`${prefixCls}-footer`, parts.classNames?.itemFooter)} style={parts.styles?.itemFooter}>
                    <Show when={props.logo}>
                        <img class={`${prefixCls}-footer-logo`} alt="" src={props.logo} />
                    </Show>
                    <span class={`${prefixCls}-footer-text`}>{props.siteName}</span>
                    <Show when={typeof props.order === 'number'}>
                        <span class={`${prefixCls}-footer-order`}>{props.order}</span>
                    </Show>
                </div>
            </div>
        </a>
    );
}

export default function Item(allProps: AnnotationItem & ItemPartProps) {
    const [parts, props] = splitProps(allProps, ['classNames', 'styles']);

    return (
        <a class={clsx(`${prefixCls} ${prefixCls}-text`, parts.classNames?.item)} style={parts.styles?.item} href={props.url} rel="noopener noreferrer" target="_blank" onClick={(e) => handleItemClick(e, props)}>
            <div class={clsx(`${prefixCls}-title`, parts.classNames?.itemTitle)} style={parts.styles?.itemTitle}>
                {props.title}
            </div>
            <div class={clsx(`${prefixCls}-text-detail`, parts.classNames?.itemDetail)} style={parts.styles?.itemDetail}>
                {props.detail}
            </div>
            <div class={clsx(`${prefixCls}-footer`, parts.classNames?.itemFooter)} style={parts.styles?.itemFooter}>
                <Show when={props.logo}>
                    <img class={`${prefixCls}-footer-logo`} alt="" src={props.logo} />
                </Show>
                <Show when={props.siteName}>
                    <span class={`${prefixCls}-footer-text`}>{props.siteName}</span>
                </Show>
                <Show when={typeof props.order === 'number'}>
                    <span class={`${prefixCls}-footer-order`}>{props.order}</span>
                </Show>
            </div>
        </a>
    );
}
