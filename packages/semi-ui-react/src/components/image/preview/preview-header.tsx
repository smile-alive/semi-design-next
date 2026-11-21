import { isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
import { IconClose } from '@fibrae/semi-icons-react';
import { useUnwrappedLazy } from '../../../hooks/index';
import useLocale from '../../locale/use-locale';
import type { HeaderProps } from '../interface';

const prefixCls = `${cssClasses.PREFIX}-preview-header`;

export default function Header({ ref, onClose, title, titleId, className, classNames, styles, renderHeader, closable, renderCloseIcon }: HeaderProps) {
    const { locale } = useLocale('Image');
    const closeIcon = useUnwrappedLazy(typeof renderCloseIcon === 'function' ? renderCloseIcon() : renderCloseIcon);

    if (typeof closeIcon !== 'undefined' && !isValidElement(closeIcon)) {
        console.warn(`[Semi ImagePreview] RenderCloseIcon should be a valid react element or a function that returns a react element`);
    }

    return (
        <section ref={ref} className={clsx(prefixCls, className, classNames?.header)} style={styles?.header}>
            <section id={titleId} className={clsx(`${prefixCls}-title`, classNames?.title)} style={styles?.title}>
                {renderHeader ? renderHeader(title) : title}
            </section>
            {closable && (
                <button type="button" className={clsx(`${prefixCls}-close`, classNames?.close)} style={styles?.close} aria-label={locale.close} onClick={onClose}>
                    {isValidElement(closeIcon) ? closeIcon : <IconClose />}
                </button>
            )}
        </section>
    );
}
