import React from 'react';
import { cssClasses } from '@fibrae/semi-foundation/components/date-picker/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import Button from '../button';

interface FooterProps {
    locale: Locale['DatePicker'];
    disabledConfirm?: boolean;
    onCancelClick?: React.MouseEventHandler<HTMLButtonElement>;
    onConfirmClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function Footer({ locale, onCancelClick, onConfirmClick, disabledConfirm }: FooterProps) {
    return (
        <div className={`${cssClasses.PREFIX}-footer`}>
            <Button theme="borderless" onClick={onCancelClick}>
                {locale?.footer?.cancel ?? ''}
            </Button>
            <Button disabled={disabledConfirm} theme="solid" onClick={onConfirmClick}>
                {locale?.footer?.confirm ?? ''}
            </Button>
        </div>
    );
}
