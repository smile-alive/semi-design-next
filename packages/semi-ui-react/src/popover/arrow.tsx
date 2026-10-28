import React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/popover/constants';

export interface ArrowProps {
    position?: string;
    className?: string;
    arrowStyle?: React.CSSProperties & { borderOpacity?: string | number };
    popStyle?: React.CSSProperties;
}

export default function Arrow({ position = '', className, arrowStyle, popStyle, ...rest }: ArrowProps = {}) {
    const isVertical = position.startsWith('top') || position.startsWith('bottom');
    const cls = clsx(className, cssClasses.ARROW);
    const borderOpacity = arrowStyle?.borderOpacity;
    const bgColor = arrowStyle?.backgroundColor ?? popStyle?.backgroundColor;
    const borderColor = arrowStyle?.borderColor ?? popStyle?.borderColor;

    const wrapProps = {
        ...rest,
        width: 24,
        height: 8,
        xmlns: 'http://www.w3.org/2000/svg',
        className: cls,
    };

    return isVertical ? (
        <svg {...wrapProps}>
            <path style={{ fill: borderColor, opacity: borderOpacity }} d="M0 0.5L0 1.5C4 1.5, 5.5 3, 7.5 5S10,8 12,8S14.5 7, 16.5 5S20,1.5 24,1.5L24 0.5L0 0.5z" />
            <path style={{ fill: bgColor }} d="M0 0L0 1C4 1, 5.5 2, 7.5 4S10,7 12,7S14.5  6, 16.5 4S20,1 24,1L24 0L0 0z" />
        </svg>
    ) : (
        <svg {...wrapProps}>
            <path style={{ fill: borderColor, opacity: borderOpacity }} d="M0.5 0L1.5 0C1.5 4, 3 5.5, 5 7.5S8,10 8,12S7 14.5, 5 16.5S1.5,20 1.5,24L0.5 24L0.5 0z" />
            <path style={{ fill: bgColor }} d="M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z" />
        </svg>
    );
}
