import type React from 'react';
import { Children, isValidElement, memo } from 'react';
import clsx from 'clsx';
import { strings, cssClasses } from '@fibrae/semi-foundation/components/navigation/constants';
import '@fibrae/semi-foundation/components/navigation/navigation.scss';
import type { ElementProps, BaseProps } from '../../base/index';
import CollapseButton from './collapse-button';
import { useNavContext } from './context';

export interface NavFooterProps extends BaseProps, ElementProps<'div', 'onClick'> {
    collapseButton?: React.ReactNode;
    collapseText?: (collapsed?: boolean) => React.ReactNode;
    onClick?: (event: React.MouseEvent) => void;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

function NavFooter({ ref, style, className, collapseButton = false, collapseText, onClick, children, ...rest }: NavFooterProps) {
    const { isCollapsed, mode, toggleCollapsed, locale } = useNavContext();

    let content: React.ReactNode = children;

    if (Children.toArray(children).length === 0 && collapseButton && mode !== strings.MODE_HORIZONTAL) {
        content = isValidElement(collapseButton) ? collapseButton : <CollapseButton collapseText={collapseText} isCollapsed={isCollapsed} locale={locale} onClick={toggleCollapsed} />;
    }

    const wrapCls = clsx(className, `${cssClasses.PREFIX}-footer`, {
        [`${cssClasses.PREFIX}-footer-collapsed`]: isCollapsed,
    });

    return (
        <div {...rest} ref={ref} className={wrapCls} style={style} onClick={onClick}>
            {content}
        </div>
    );
}

export default Object.assign(memo(NavFooter), { elementType: 'Nav.Footer' });
