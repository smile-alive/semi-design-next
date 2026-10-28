import { Show } from 'solid-js';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import Avatar from '@fibrae/semi-ui-solid/avatar/index';
import { useAIChatDialogueContext } from '../context';
import type { Metadata } from '../interface';

const prefix = cssClasses.PREFIX;

export default function DialogueAvatar(props: { role?: Metadata; message: Message }) {
    const { view } = useAIChatDialogueContext();

    // the title beside it names the sender
    const avatar = () => <Avatar class={`${prefix}-avatar`} alt="" color={props.role?.color} size="extra-small" src={props.role?.avatar} />;

    return (
        <Show when={view().dialogueRenderConfig?.renderDialogueAvatar} keyed fallback={avatar()}>
            {(render) =>
                render({
                    get role() {
                        return props.role;
                    },
                    get message() {
                        return props.message;
                    },
                    defaultAvatar: avatar,
                })
            }
        </Show>
    );
}
