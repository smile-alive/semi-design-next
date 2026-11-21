import type React from 'react';
import clsx from 'clsx';
import { type AnnotationPart, cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import { formatTime } from '@fibrae/semi-foundation/components/video-player/utils';
import { IconPlay } from '@fibrae/semi-icons-react';

const prefixCls = cssClasses.ANNOTATION_ITEM;

export interface AnnotationItem {
    type?: 'video' | 'text';
    title?: string;
    url?: string;
    detail?: string;
    logo?: string;
    siteName?: string;
    order?: number;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>, item: AnnotationItem) => void;
    img?: string;
    duration?: number;
}

// Items are links, so the browser opens the url itself (middle click and copy link work too)
// shortcut: an item without url is an anchor without href, activatable by pointer only; use a button when such items
// need keyboard access

interface ItemPartProps {
    classNames?: Partial<Record<AnnotationPart, string>>;
    styles?: Partial<Record<AnnotationPart, React.CSSProperties>>;
}

export function VideoItem({ classNames, styles, ...props }: AnnotationItem & ItemPartProps) {
    const { title, url, logo, img, duration, order, siteName } = props;

    const onItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const { onClick, ...rest } = props;
        onClick?.(e, rest);
    };

    return (
        <a className={clsx(`${prefixCls} ${prefixCls}-video`, classNames?.item)} style={styles?.item} href={url} rel="noopener noreferrer" target="_blank" onClick={onItemClick}>
            <div className={`${prefixCls}-video-img-wrapper`}>
                {img && <img className={`${prefixCls}-video-img`} alt="" src={img} />}
                <IconPlay className={`${prefixCls}-video-play`} />
                {typeof duration === 'number' && <span className={`${prefixCls}-video-duration`}>{formatTime(duration)}</span>}
            </div>
            <div className={`${prefixCls}-video-content`}>
                <div className={clsx(`${prefixCls}-title`, classNames?.itemTitle)} style={styles?.itemTitle}>
                    {title}
                </div>
                <div className={clsx(`${prefixCls}-footer`, classNames?.itemFooter)} style={styles?.itemFooter}>
                    {logo && <img className={`${prefixCls}-footer-logo`} alt="" src={logo} />}
                    <span className={`${prefixCls}-footer-text`}>{siteName}</span>
                    {typeof order === 'number' && <span className={`${prefixCls}-footer-order`}>{order}</span>}
                </div>
            </div>
        </a>
    );
}

export default function Item({ classNames, styles, ...props }: AnnotationItem & ItemPartProps) {
    const { title, url, detail, logo, order, siteName } = props;

    const onItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const { onClick, ...rest } = props;
        onClick?.(e, rest);
    };

    return (
        <a className={clsx(`${prefixCls} ${prefixCls}-text`, classNames?.item)} style={styles?.item} href={url} rel="noopener noreferrer" target="_blank" onClick={onItemClick}>
            <div className={clsx(`${prefixCls}-title`, classNames?.itemTitle)} style={styles?.itemTitle}>
                {title}
            </div>
            <div className={clsx(`${prefixCls}-text-detail`, classNames?.itemDetail)} style={styles?.itemDetail}>
                {detail}
            </div>
            <div className={clsx(`${prefixCls}-footer`, classNames?.itemFooter)} style={styles?.itemFooter}>
                {logo && <img className={`${prefixCls}-footer-logo`} alt="" src={logo} />}
                {siteName && <span className={`${prefixCls}-footer-text`}>{siteName}</span>}
                {typeof order === 'number' && <span className={`${prefixCls}-footer-order`}>{order}</span>}
            </div>
        </a>
    );
}
