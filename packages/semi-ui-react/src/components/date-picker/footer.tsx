import React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/date-picker/constants';
import type { Locale } from '@fibrae/semi-foundation/locale';
import Button from '../button';

interface FooterProps {
    className?: string;
    style?: React.CSSProperties;
    locale: Locale['DatePicker'];
    disabledConfirm?: boolean;
    onCancelClick?: React.MouseEventHandler<HTMLButtonElement>;
    onConfirmClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Footer({ className, style, locale, onCancelClick, onConfirmClick, disabledConfirm }: FooterProps) {
    return (
        <div className={clsx(`${cssClasses.PREFIX}-footer`, className)} style={style}>
            <Button theme="borderless" onClick={onCancelClick}>
                {locale?.footer?.cancel ?? ''}
            </Button>
            <Button disabled={disabledConfirm} theme="solid" onClick={onConfirmClick}>
                {locale?.footer?.confirm ?? ''}
            </Button>
        </div>
    );
}
