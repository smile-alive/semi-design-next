import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/card/constants';
import type { ElementProps } from '../_base/base';
import { hasContent } from '../_utils';

const prefixcls = cssClasses.PREFIX;

export interface MetaProps extends ElementProps<'div', 'title'> {
    /** Avatar */
    avatar?: React.ReactNode;
    /** Style class name */
    className?: string;
    /** Description */
    description?: React.ReactNode;
    /** Inline style */
    style?: React.CSSProperties;
    /** Title */
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
