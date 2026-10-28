import React, { type ReactNode, type ReactElement, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import Avatar from '@fibrae/semi-ui-react/avatar/index';
import type { Message, Metadata, RenderAvatarProps } from '../interface';

const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxAvatarProps {
    children?: string;
    role?: Metadata;
    continueSend?: boolean;
    message?: Message;
    customRenderFunc?: (props: RenderAvatarProps) => ReactNode;
}

function ChatBoxAvatar({ role, customRenderFunc, continueSend, message }: ChatBoxAvatarProps) {
    const node = useMemo(() => {
        const { avatar, color } = role;
        const isAvatarString = typeof avatar === 'string';
        return (
            <Avatar
                className={clsx(`${PREFIX_CHAT_BOX}-avatar`, {
                    [`${PREFIX_CHAT_BOX}-avatar-hidden`]: continueSend,
                })}
                // the title next to it names the sender, and a run's repeat avatar is not rendered visibly at all
                alt=""
                color={color}
                size="extra-small"
                src={isAvatarString ? avatar : undefined}
            >
                {!isAvatarString && avatar}
            </Avatar>
        );
    }, [role, continueSend]);

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            role,
            defaultAvatar: node,
            message: message,
        }) as ReactElement;
    }

    return node;
}

export default React.memo(ChatBoxAvatar);
