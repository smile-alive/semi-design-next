import { type JSX, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import Avatar from '@fibrae/semi-ui-solid/avatar/index';
import type { Message, Metadata, RenderAvatarProps, RenderRoleAvatarProps } from './interface';

const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxAvatarProps {
    role?: Metadata;
    continueSend?: boolean;
    message?: Message;
    customRenderFunc?: (props: RenderAvatarProps) => JSX.Element;
    renderRoleAvatar?: (props: RenderRoleAvatarProps) => JSX.Element;
}

export default function ChatBoxAvatar(props: ChatBoxAvatarProps) {
    const roleAvatarProps: RenderRoleAvatarProps = {
        get role() {
            return props.role;
        },
        get message() {
            return props.message;
        },
    };

    const node = () => (
        <Avatar
            class={clsx(`${PREFIX_CHAT_BOX}-avatar`, { [`${PREFIX_CHAT_BOX}-avatar-hidden`]: props.continueSend })}
            // the title next to it names the sender, and a run's repeat avatar is not rendered visibly at all
            alt=""
            color={props.role?.color}
            size="extra-small"
            src={props.role?.avatar}
        >
            {props.renderRoleAvatar?.(roleAvatarProps)}
        </Avatar>
    );

    return (
        <Show when={props.customRenderFunc} keyed fallback={node()}>
            {(render) =>
                render({
                    get role() {
                        return props.role;
                    },
                    get message() {
                        return props.message;
                    },
                    defaultAvatar: node,
                })
            }
        </Show>
    );
}
