import React, { useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { IconChevronDown, IconChevronUp, IconAISearchLevel2 } from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import Collapsible from '@fibrae/semi-ui-react/collapsible/index';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import MarkdownRender from '@fibrae/semi-ui-react/markdown-render/index';
import type { MarkdownRenderProps } from '../../interface';

export interface ReasoningWidgetProps extends ElementProps<'div', 'content'> {
    status?: string;
    summary?: { text?: string; type?: string }[];
    content?: { text?: string; type?: string }[];
    markdownRenderProps?: MarkdownRenderProps;
    customRenderer?: (props: ReasoningWidgetProps) => React.ReactNode;
}

const prefixCls = cssClasses.PREFIX_REASONING;

export function ReasoningWidget(props: ReasoningWidgetProps) {
    const { status, summary, content, markdownRenderProps, customRenderer, className, ...rest } = props;

    const [isOpen, setIsOpen] = useState(status !== 'completed');

    const items = summary?.length ? summary : (content ?? []);
    const text = items.map((item) => item.text).join('\n');

    return (
        <div {...rest} className={clsx(`${prefixCls}-wrapper`, className)}>
            <button type="button" className={`${prefixCls}-header`} aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
                <span className={`${prefixCls}-header-prefix`}>
                    <IconAISearchLevel2 />
                </span>
                <span className={`${prefixCls}-header-title`}>
                    <LocaleConsumer componentName="AIChatDialogue">{(locale: Locale['AIChatDialogue']) => (status === 'completed' ? locale['reasoning']['completed'] : locale['reasoning']['thinking'])}</LocaleConsumer>
                </span>
                <span className={`${prefixCls}-header-suffix`}>{isOpen ? <IconChevronUp /> : <IconChevronDown />}</span>
            </button>
            <Collapsible isOpen={isOpen}>
                <div className={`${prefixCls}-content`}>{customRenderer ? customRenderer(props) : <MarkdownRender format="md" {...markdownRenderProps} raw={text} />}</div>
            </Collapsible>
        </div>
    );
}
