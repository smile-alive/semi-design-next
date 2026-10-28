import React from 'react';
import { cssClasses } from '@fibrae/semi-foundation/table/constants';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { IconChevronRight, IconTreeTriangleRight } from '@fibrae/semi-icons-react';
import CSSAnimation from '../_css-animation';
import useLocale from '../locale/use-locale';

export interface CustomExpandIconProps {
    expanded?: boolean;
    componentType?: 'tree' | 'expand';
    onClick?: (nextExpand: boolean, e: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    expandIcon?: ((expanded?: boolean) => React.ReactNode) | React.ReactNode;
    prefixCls?: string;
}

export default function CustomExpandIcon({ expanded, componentType = 'expand', onClick = noop, onMouseEnter = noop, onMouseLeave = noop, expandIcon, prefixCls = cssClasses.PREFIX }: CustomExpandIconProps) {
    const { locale } = useLocale('Table');

    let icon;

    if (React.isValidElement(expandIcon)) {
        icon = expandIcon;
    } else if (typeof expandIcon === 'function') {
        icon = expandIcon(expanded);
    } else if (typeof expandIcon === 'string' || typeof expandIcon === 'number') {
        icon = expandIcon;
    } else if (componentType === 'tree') {
        icon = <IconTreeTriangleRight size="small" />;
    } else {
        icon = <IconChevronRight />;
    }

    const handleClick = (e) => {
        if (typeof onClick === 'function') {
            onClick(!expanded, e);
        }
    };

    if (React.isValidElement<{ className?: string }>(icon)) {
        const originIcon = icon;
        icon = (
            <CSSAnimation startClassName={`${cssClasses.PREFIX}-expandedIcon-${expanded ? 'show' : 'hide'}`} animationState={expanded ? 'enter' : 'leave'}>
                {({ animationClassName }) => {
                    return React.cloneElement(originIcon, {
                        className: (originIcon.props.className || '') + ' ' + animationClassName,
                    });
                }}
            </CSSAnimation>
        );
    }

    return (
        <button type="button" className={`${prefixCls}-expand-icon`} aria-expanded={Boolean(expanded)} aria-label={locale.expandRow} onClick={handleClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {icon}
        </button>
    );
}
