import { type JSX, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
import type { Message, Metadata, RenderTitleProps } from '../interface';

const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxTitleProps {
    role?: Metadata;
    message?: Message;
    class?: string;
    style?: JSX.CSSProperties | string;
    customRenderFunc?: (props: RenderTitleProps) => JSX.Element;
}

export default function ChatBoxTitle(props: ChatBoxTitleProps) {
    const title = () => (
        <span class={clsx(`${PREFIX_CHAT_BOX}-title`, props.class)} style={props.style}>
            {props.role?.name}
        </span>
    );

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
