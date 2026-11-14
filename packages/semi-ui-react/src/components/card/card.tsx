import type React from 'react';
import { memo, type ReactNode, type CSSProperties } from 'react';
import clsx from 'clsx';
import { cssClasses, type CardPart } from '@fibrae/semi-foundation/components/card/constants';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/card/card.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { hasContent } from '../../utils/index';
import Skeleton from '../skeleton';
import Space from '../space';
import Typography from '../typography';

const prefixcls = cssClasses.PREFIX;

export type Shadows = 'hover' | 'always';

export type { MetaProps } from './meta';

export type { CardGroupProps } from './card-group';

export interface CardProps extends ElementProps<'div', 'title'> {
    actions?: ReactNode[];
    bordered?: boolean;
    className?: string;
    classNames?: Partial<Record<CardPart, string>>;
    children?: React.ReactNode;
    cover?: ReactNode;
    headerExtraContent?: ReactNode;
    footer?: ReactNode;
    footerLine?: boolean;
    header?: ReactNode;
    headerLine?: boolean;
    loading?: boolean;
    shadows?: Shadows;
    style?: CSSProperties;
    styles?: Partial<Record<CardPart, CSSProperties>>;
    title?: ReactNode;
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
    const { ref, actions, bordered, className, classNames, children, cover, headerExtraContent, footer, footerLine, header, headerLine, loading, shadows, style, styles, title, ...rest } = useDefaultProps('Card', rawProps, defaultProps);

    const cardCls = clsx(prefixcls, className, {
        [`${prefixcls}-bordered`]: bordered,
        [`${prefixcls}-shadows`]: shadows,
        [`${prefixcls}-shadows-${shadows}`]: shadows,
    });

    return (
        <div role={namedRole(rest)} {...rest} ref={ref} className={cardCls} style={style} aria-busy={loading}>
            {(hasContent(header) || hasContent(headerExtraContent) || hasContent(title)) && (
                <div className={clsx(`${prefixcls}-header`, { [`${prefixcls}-header-bordered`]: Boolean(headerLine) }, classNames?.header)} style={styles?.header}>
                    {hasContent(header) ? (
                        header
                    ) : (
                        <div className={`${prefixcls}-header-wrapper`}>
                            {hasContent(title) && (
                                <div
                                    className={clsx(
                                        `${prefixcls}-header-wrapper-title`,
                                        {
                                            [`${prefixcls}-header-wrapper-spacing`]: hasContent(headerExtraContent),
                                        },
                                        classNames?.title
                                    )}
                                    style={styles?.title}
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
                                <div className={clsx(`${prefixcls}-header-wrapper-extra`, classNames?.extra)} style={styles?.extra} x-semi-prop="headerExtraContent">
                                    {headerExtraContent}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {hasContent(cover) && (
                <div className={clsx(`${prefixcls}-cover`, classNames?.cover)} style={styles?.cover} x-semi-prop="cover">
                    {cover}
                </div>
            )}
            <div className={clsx(`${prefixcls}-body`, classNames?.body)} style={styles?.body}>
                {hasContent(children) && (
                    <Skeleton placeholder={placeholder} active loading={loading}>
                        {children}
                    </Skeleton>
                )}
                {Array.isArray(actions) && (
                    <div className={clsx(`${prefixcls}-body-actions`, classNames?.actions)} style={styles?.actions}>
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
                <div className={clsx(`${prefixcls}-footer`, { [`${prefixcls}-footer-bordered`]: footerLine }, classNames?.footer)} style={styles?.footer} x-semi-prop="footer">
                    {footer}
                </div>
            )}
        </div>
    );
}

export default memo(Card);
