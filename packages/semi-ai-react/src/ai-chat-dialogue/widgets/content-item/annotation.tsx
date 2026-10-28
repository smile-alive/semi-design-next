import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Annotation } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { IconChevronRight } from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import AvatarGroup from '@fibrae/semi-ui-react/avatar/avatar-group';
import Avatar from '@fibrae/semi-ui-react/avatar/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';

export interface AnnotationItemProps {
    title?: string;
    logo?: string;
    url?: string;
    detail?: string;
}

export interface AnnotationWidgetProps extends ElementProps<'div', 'onClick'> {
    maxCount: number;
    annotation: AnnotationItemProps[] | Annotation[];
    onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, item: AnnotationItemProps[]) => void;
    description?: string;
}

const prefixCls = cssClasses.PREFIX_ANNOTATION;

export function AnnotationWidget({ annotation, description, maxCount, onClick, className, onKeyDown, ...rest }: AnnotationWidgetProps) {
    const { locale } = useLocale('AIChatDialogue');

    const handleClick = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
        onClick?.(e, annotation as AnnotationItemProps[]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e);
        }
        onKeyDown?.(e);
    };

    const renderMore = (restNumber: number) => {
        return (
            <Avatar className={`${prefixCls}-content-logo-renderMore`} alt={locale.more} size="extra-extra-small">
                {`+${restNumber}`}
            </Avatar>
        );
    };

    return (
        <div {...rest} className={clsx(`${prefixCls}-wrapper`, className)} role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
            <div className={`${prefixCls}-content`}>
                <AvatarGroup maxCount={maxCount} overlapFrom="end" size="extra-extra-small" renderMore={renderMore}>
                    {annotation.map((item: AnnotationItemProps, index: number) => {
                        return item.logo && <Avatar key={index} className={`${prefixCls}-content-logo`} alt={item.title} src={item.logo} />;
                    })}
                </AvatarGroup>
                <div className={`${prefixCls}-content-description`}>{description || <LocaleConsumer componentName="AIChatDialogue">{(locale: Locale['AIChatDialogue']) => `${annotation.length} ${locale.annotationText}`}</LocaleConsumer>}</div>
                <div className={`${prefixCls}-content-icon`}>
                    <IconChevronRight />
                </div>
            </div>
        </div>
    );
}
