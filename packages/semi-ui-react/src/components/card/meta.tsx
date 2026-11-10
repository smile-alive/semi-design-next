import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/card/constants';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefixcls = cssClasses.PREFIX;

export interface MetaProps extends ElementProps<'div', 'title'> {
    avatar?: React.ReactNode;
    className?: string;
    description?: React.ReactNode;
    style?: React.CSSProperties;
    title?: React.ReactNode;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

function Meta({ ref, avatar, className, description, style, title, ...rest }: MetaProps) {
    return (
        <div {...rest} ref={ref} className={clsx(`${prefixcls}-meta`, className)} style={style}>
            {hasContent(avatar) && <div className={`${prefixcls}-meta-avatar`}>{avatar}</div>}
            {(hasContent(title) || hasContent(description)) && (
                <div className={`${prefixcls}-meta-wrapper`}>
                    {hasContent(title) && <div className={`${prefixcls}-meta-wrapper-title`}>{title}</div>}
                    {hasContent(description) && <div className={`${prefixcls}-meta-wrapper-description`}>{description}</div>}
                </div>
            )}
        </div>
    );
}

export default memo(Meta);
