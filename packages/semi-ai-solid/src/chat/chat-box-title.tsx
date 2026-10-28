import { type JSX, Show } from 'solid-js';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import type { Message, Metadata, RenderTitleProps } from './interface';

const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxTitleProps {
    role?: Metadata;
    message?: Message;
    customRenderFunc?: (props: RenderTitleProps) => JSX.Element;
}

export default function ChatBoxTitle(props: ChatBoxTitleProps) {
    const title = () => <span class={`${PREFIX_CHAT_BOX}-title`}>{props.role?.name}</span>;

    return (
        <Show when={props.customRenderFunc} keyed fallback={title()}>
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
