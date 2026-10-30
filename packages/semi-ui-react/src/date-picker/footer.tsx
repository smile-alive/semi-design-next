import React from 'react';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import Button from '../button';

interface FooterProps {
    prefixCls?: string;
    locale: Locale['DatePicker'];
    disabledConfirm?: boolean;
    onCancelClick?: React.MouseEventHandler<HTMLButtonElement>;
    onConfirmClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Footer({ prefixCls, locale, onCancelClick, onConfirmClick, disabledConfirm }: FooterProps) {
    return (
        <div className={`${prefixCls}-footer`}>
            <Button theme="borderless" onClick={onCancelClick}>
                {locale?.footer?.cancel ?? ''}
            </Button>
            <Button disabled={disabledConfirm} theme="solid" onClick={onConfirmClick}>
                {locale?.footer?.confirm ?? ''}
            </Button>
        </div>
    );
}
