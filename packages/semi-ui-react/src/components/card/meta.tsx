import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, type CardMetaPart } from '@fibrae/semi-foundation/components/card/constants';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefixcls = cssClasses.PREFIX;

export interface MetaProps extends ElementProps<'div', 'title'> {
    avatar?: React.ReactNode;
    className?: string;
    classNames?: Partial<Record<CardMetaPart, string>>;
    description?: React.ReactNode;
    style?: React.CSSProperties;
    styles?: Partial<Record<CardMetaPart, React.CSSProperties>>;
    title?: React.ReactNode;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

function Meta({ ref, avatar, className, classNames, description, style, styles, title, ...rest }: MetaProps) {
    return (
        <div {...rest} ref={ref} className={clsx(`${prefixcls}-meta`, className)} style={style}>
            {hasContent(avatar) && (
                <div className={clsx(`${prefixcls}-meta-avatar`, classNames?.avatar)} style={styles?.avatar}>
                    {avatar}
                </div>
            )}
            {(hasContent(title) || hasContent(description)) && (
                <div className={clsx(`${prefixcls}-meta-wrapper`, classNames?.section)} style={styles?.section}>
                    {hasContent(title) && (
                        <div className={clsx(`${prefixcls}-meta-wrapper-title`, classNames?.title)} style={styles?.title}>
                            {title}
                        </div>
                    )}
                    {hasContent(description) && (
                        <div className={clsx(`${prefixcls}-meta-wrapper-description`, classNames?.description)} style={styles?.description}>
                            {description}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default memo(Meta);
