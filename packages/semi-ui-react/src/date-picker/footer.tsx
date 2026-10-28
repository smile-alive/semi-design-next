import React from 'react';
// compat get falls back to the default only for undefined, not null
import { get } from 'es-toolkit/compat';
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
                {get(locale, 'footer.cancel', '')}
            </Button>
            <Button disabled={disabledConfirm} theme="solid" onClick={onConfirmClick}>
                {get(locale, 'footer.confirm', '')}
            </Button>
        </div>
    );
}
