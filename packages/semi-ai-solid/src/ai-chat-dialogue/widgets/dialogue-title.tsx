import { Show } from 'solid-js';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { useAIChatDialogueContext } from '../context';
import type { Metadata } from '../interface';

const prefix = cssClasses.PREFIX;

export default function DialogueTitle(props: { role?: Metadata; message: Message }) {
    const { view } = useAIChatDialogueContext();

    const title = () => <span class={`${prefix}-title`}>{props.role?.name}</span>;

    return (
        <Show when={view().dialogueRenderConfig?.renderDialogueTitle} keyed fallback={title()}>
            {(render) =>
                render({
                    get role() {
                        return props.role;
                    },
                    get message() {
                        return props.message;
                    },
                    defaultTitle: title,
                })
            }
        </Show>
    );
}
