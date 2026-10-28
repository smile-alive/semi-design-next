import { isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import { IconClose } from '@fibrae/semi-icons-react';
import useLocale from '../locale/use-locale';
import type { HeaderProps } from './interface';

const prefixCls = `${cssClasses.PREFIX}-preview-header`;

export default function Header({ ref, onClose, title, titleId, titleStyle, className, renderHeader, closable, renderCloseIcon }: HeaderProps) {
    const { locale } = useLocale('Image');

    const closeIcon = typeof renderCloseIcon === 'function' ? renderCloseIcon() : renderCloseIcon;

    if (typeof closeIcon !== 'undefined' && !isValidElement(closeIcon)) {
        console.warn(`[Semi ImagePreview] RenderCloseIcon should be a valid react element or a function that returns a react element`);
    }

    return (
        <section ref={ref} className={clsx(prefixCls, className)}>
            <section id={titleId} className={`${prefixCls}-title`} style={titleStyle}>
                {renderHeader ? renderHeader(title) : title}
            </section>
            {closable && (
                <button type="button" className={`${prefixCls}-close`} aria-label={locale.close} onClick={onClose}>
                    {isValidElement(closeIcon) ? closeIcon : <IconClose />}
                </button>
            )}
        </section>
    );
}
