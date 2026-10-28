import React, { type ReactNode, Fragment } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { IconBookOpenStroked } from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import Collapse from '@fibrae/semi-ui-react/collapse/index';
import Item, { type AnnotationItem, VideoItem } from './item';

const collapseCls = cssClasses.COLLAPSE;
const annotationCls = cssClasses.ANNOTATION;

export interface AnnotationInfo {
    header: React.ReactNode;
    key: string;
    annotations: AnnotationItem[];
}

export interface ContentProps extends ElementProps<'div', 'onChange' | 'onClick'> {
    style?: React.CSSProperties;
    className?: string;
    activeKey?: string | string[];
    info?: AnnotationInfo[];
    renderItem?: (annotation: AnnotationItem) => ReactNode;
    onChange?: (key: string | string[]) => void;
    onClick?: (e: React.MouseEvent, item: AnnotationItem) => void;
}

function Content({ info = [], activeKey, onChange, onClick, style, className, renderItem, ...rest }: ContentProps) {
    return (
        <Collapse
            {...rest}
            className={clsx(collapseCls, {
                [className]: className,
            })}
            style={style}
            activeKey={activeKey}
            clickHeaderToExpand={false}
            onChange={onChange}
        >
            {info.map((item) => (
                <Collapse.Panel
                    key={item.key}
                    header={
                        // a span: Collapse renders the header inside its toggle button
                        <span className={`${collapseCls}-header-content`}>
                            <IconBookOpenStroked />
                            {item.header}
                        </span>
                    }
                    itemKey={item.key}
                >
                    <div className={`${annotationCls}-content`}>
                        {item.annotations.map((cite, index) => {
                            if (renderItem) {
                                return <Fragment key={index}>{renderItem(cite)}</Fragment>;
                            }
                            if (cite.type === 'video') {
                                return <VideoItem key={`${index}`} onClick={onClick} {...cite} />;
                            }
                            return <Item key={`${index}`} onClick={onClick} {...cite} />;
                        })}
                    </div>
                </Collapse.Panel>
            ))}
        </Collapse>
    );
}

export default React.memo(Content);
