import { type JSX, Show, createSignal, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import { IconAISearchLevel2, IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import Collapsible from '@fibrae/semi-ui-solid/collapsible/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import MarkdownRender from '@fibrae/semi-ui-solid/markdown-render/index';
import type { MarkdownRenderProps } from '../../interface';

export interface ReasoningWidgetProps extends ElementProps<'div', 'content'> {
    status?: string;
    summary?: { text?: string; type?: string }[];
    content?: { text?: string; type?: string }[];
    markdownRenderProps?: MarkdownRenderProps;
    customRenderer?: (props: ReasoningWidgetProps) => JSX.Element;
}

const prefixCls = cssClasses.PREFIX_REASONING;

export function ReasoningWidget(props: ReasoningWidgetProps) {
    const [local, rest] = splitProps(props, ['status', 'summary', 'content', 'markdownRenderProps', 'customRenderer', 'class']);

    const locale = useLocale('AIChatDialogue');

    // the initial status only: a reply that completes later stays open until the user folds it
    const [isOpen, setIsOpen] = createSignal(untrack(() => local.status) !== 'completed');

    const text = () => {
        const items = local.summary?.length ? local.summary : (local.content ?? []);
        return items.map((item) => item.text).join('\n');
    };

    return (
        <div {...rest} class={clsx(`${prefixCls}-wrapper`, local.class)}>
            <button type="button" class={`${prefixCls}-header`} aria-expanded={isOpen()} onClick={() => setIsOpen((open) => !open)}>
                <span class={`${prefixCls}-header-prefix`}>
                    <IconAISearchLevel2 />
                </span>
                <span class={`${prefixCls}-header-title`}>{local.status === 'completed' ? locale().locale.reasoning.completed : locale().locale.reasoning.thinking}</span>
                <span class={`${prefixCls}-header-suffix`}>
                    <Show when={isOpen()} fallback={<IconChevronDown />}>
                        <IconChevronUp />
                    </Show>
                </span>
            </button>
            <Collapsible isOpen={isOpen()}>
                <div class={`${prefixCls}-content`}>
                    <Show when={local.customRenderer} keyed fallback={<MarkdownRender format="md" {...local.markdownRenderProps} raw={text()} />}>
                        {(render) => render(props)}
                    </Show>
                </div>
            </Collapsible>
        </div>
    );
}
