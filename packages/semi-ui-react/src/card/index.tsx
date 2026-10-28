import type React from 'react';
import { memo, type ReactNode, type CSSProperties } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/card/constants';
import '@fibrae/semi-foundation/card/card.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import { hasContent } from '../_utils';
import Skeleton from '../skeleton';
import Space from '../space';
import Typography from '../typography';
import Meta from './meta';

const prefixcls = cssClasses.PREFIX;

export type Shadows = 'hover' | 'always';

export type { MetaProps } from './meta';

export type { CardGroupProps } from './card-group';

export interface CardProps extends ElementProps<'div', 'title'> {
    /** Operation group at the bottom of the card content area */
    actions?: ReactNode[];
    /** Card content area inline style */
    bodyStyle?: CSSProperties;
    /** Whether there is an outer border */
    bordered?: boolean;
    /** Style class name */
    className?: string;
    children?: React.ReactNode;
    /** Cover */
    cover?: ReactNode;
    /** Additional additions to the right of the title */
    headerExtraContent?: ReactNode;
    /** Custom end of page */
    footer?: ReactNode;
    /** Whether there is an edge between the bottom of the page and the content area */
    footerLine?: boolean;
    /** Inline style at the end of the page */
    footerStyle?: CSSProperties;
    /** Custom head */
    header?: ReactNode;
    /** Whether there is an edge line between the head and the content area */
    headerLine?: boolean;
    /** Head inline style */
    headerStyle?: CSSProperties;
    /** Whether to preload */
    loading?: boolean;
    /** Set shadow */
    shadows?: Shadows;
    /** Card inline style */
    style?: CSSProperties;
    /** Title */
    title?: ReactNode;
    /** aria label */
    'aria-label'?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    bordered: true,
    footerLine: false,
    headerLine: true,
    loading: false,
} satisfies Partial<CardProps>;

const placeholder = (
    <div>
        <Skeleton.Title />
        <br />
        <Skeleton.Paragraph rows={3} />
    </div>
);

function Card(rawProps: CardProps) {
    const { ref, actions, bodyStyle, bordered, className, children, cover, headerExtraContent, footer, footerLine, footerStyle, header, headerLine, headerStyle, loading, shadows, style, title, ...rest } = useDefaultProps('Card', rawProps, defaultProps);

    const cardCls = clsx(prefixcls, className, {
        [`${prefixcls}-bordered`]: bordered,
        [`${prefixcls}-shadows`]: shadows,
        [`${prefixcls}-shadows-${shadows}`]: shadows,
    });

    return (
        <div role={namedRole(rest)} {...rest} ref={ref} className={cardCls} style={style} aria-busy={loading}>
            {(hasContent(header) || hasContent(headerExtraContent) || hasContent(title)) && (
                <div className={clsx(`${prefixcls}-header`, { [`${prefixcls}-header-bordered`]: Boolean(headerLine) })} style={headerStyle}>
                    {hasContent(header) ? (
                        header
                    ) : (
                        <div className={`${prefixcls}-header-wrapper`}>
                            {hasContent(title) && (
                                <div
                                    className={clsx(`${prefixcls}-header-wrapper-title`, {
                                        [`${prefixcls}-header-wrapper-spacing`]: hasContent(headerExtraContent),
                                    })}
                                >
                                    {typeof title === 'string' ? (
                                        <Typography.Title
                                            // the title names the card; a heading here would break the page outline
                                            component="div"
                                            ellipsis={{ showTooltip: true, rows: 1 }}
                                            heading={6}
                                            x-semi-prop="title"
                                        >
                                            {title}
                                        </Typography.Title>
                                    ) : (
                                        title
                                    )}
                                </div>
                            )}
                            {hasContent(headerExtraContent) && (
                                <div className={`${prefixcls}-header-wrapper-extra`} x-semi-prop="headerExtraContent">
                                    {headerExtraContent}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {hasContent(cover) && (
                <div className={`${prefixcls}-cover`} x-semi-prop="cover">
                    {cover}
                </div>
            )}
            <div className={`${prefixcls}-body`} style={bodyStyle}>
                {hasContent(children) && (
                    <Skeleton placeholder={placeholder} active loading={loading}>
                        {children}
                    </Skeleton>
                )}
                {Array.isArray(actions) && (
                    <div className={`${prefixcls}-body-actions`}>
                        <Space spacing={12}>
                            {actions.map((item, idx) => (
                                <div key={idx} className={`${prefixcls}-body-actions-item`} x-semi-prop={`actions.${idx}`}>
                                    {item}
                                </div>
                            ))}
                        </Space>
                    </div>
                )}
            </div>
            {hasContent(footer) && (
                <div className={clsx(`${prefixcls}-footer`, { [`${prefixcls}-footer-bordered`]: footerLine })} style={footerStyle} x-semi-prop="footer">
                    {footer}
                </div>
            )}
        </div>
    );
}

export default Object.assign(memo(Card), { Meta });
