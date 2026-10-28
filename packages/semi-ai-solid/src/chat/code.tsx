import { Show, children } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-solid';
import { useCopied, useLocale } from '@fibrae/semi-ui-solid/hooks';
import type { MarkdownCodeProps } from '@fibrae/semi-ui-solid/markdown-render/components/code';
import { code as MarkdownCode } from '@fibrae/semi-ui-solid/markdown-render/components/index';

const { PREFIX_CHAT_BOX } = cssClasses;

export default function Code(props: MarkdownCodeProps) {
    const locale = useLocale('Chat');

    const [copied, copy] = useCopied(() => 2000);

    const resolved = children(() => props.children);

    const language = () => MarkdownRenderFoundation.getCodeLanguage(props.class);

    // a highlighter plugin can turn the code into elements, which have no text to copy
    const text = () => {
        const content = resolved();
        return typeof content === 'string' ? content : undefined;
    };

    const onCopyButtonClick = () => {
        const value = text();
        if (!copied() && value !== undefined) {
            void copy(value);
        }
    };

    return (
        <Show when={language() && text() !== undefined} fallback={<MarkdownCode class={props.class}>{resolved()}</MarkdownCode>}>
            <div class={`${PREFIX_CHAT_BOX}-content-code ${BASE_CLASS_PREFIX}-always-dark`}>
                <div class={`${PREFIX_CHAT_BOX}-content-code-topSlot`}>
                    <span class={`${PREFIX_CHAT_BOX}-content-code-topSlot-type`}>{language()}</span>
                    <span class={`${PREFIX_CHAT_BOX}-content-code-topSlot-copy`}>
                        {/* one element for both states, so focus survives the swap */}
                        <button type="button" class={clsx(`${PREFIX_CHAT_BOX}-content-code-topSlot-copy-wrapper`, { [`${PREFIX_CHAT_BOX}-content-code-topSlot-toCopy`]: !copied() })} onClick={onCopyButtonClick}>
                            <Show when={copied()} fallback={<IconCopyStroked />}>
                                <IconTick />
                            </Show>
                            {copied() ? locale().locale.copied : locale().locale.copy}
                        </button>
                    </span>
                </div>
                <MarkdownCode class={props.class}>{text()}</MarkdownCode>
            </div>
        </Show>
    );
}
