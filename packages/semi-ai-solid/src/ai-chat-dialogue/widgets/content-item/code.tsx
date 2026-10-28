import { type ComponentProps, Show, children } from 'solid-js';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-solid';
import { useCopied, useLocale } from '@fibrae/semi-ui-solid/hooks';
import { code as MarkdownCode } from '@fibrae/semi-ui-solid/markdown-render/components/index';

const { PREFIX_CODE } = cssClasses;

export default function Code(props: ComponentProps<typeof MarkdownCode>) {
    const locale = useLocale('AIChatDialogue');

    const [copied, copy] = useCopied(() => 2000);

    const resolved = children(() => props.children);

    const language = () => MarkdownRenderFoundation.getCodeLanguage(props.class);

    // a highlighter plugin can turn the code into elements, which have no text to copy
    const source = () => {
        const content = resolved();
        return typeof content === 'string' ? content : undefined;
    };

    const code = () => <MarkdownCode class={props.class}>{resolved()}</MarkdownCode>;

    return (
        <Show when={language() && source() !== undefined} fallback={code()}>
            <div class={PREFIX_CODE}>
                <div class={`${PREFIX_CODE}-topSlot`}>
                    <span class={`${PREFIX_CODE}-topSlot-type`}>{language()}</span>
                    <span class={`${PREFIX_CODE}-topSlot-copy`}>
                        {/* one element for both states, so focus survives the swap */}
                        <button
                            type="button"
                            class={`${PREFIX_CODE}-topSlot-copy-wrapper`}
                            aria-label={copied() ? locale().locale.copySuccess : locale().locale.copy}
                            onClick={() => {
                                if (!copied()) {
                                    void copy(source() as string);
                                }
                            }}
                        >
                            <Show when={copied()} fallback={<IconCopyStroked />}>
                                <IconTick />
                            </Show>
                        </button>
                    </span>
                </div>
                {code()}
            </div>
        </Show>
    );
}
