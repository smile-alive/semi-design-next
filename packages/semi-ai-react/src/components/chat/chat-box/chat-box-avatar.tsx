import React, { type CSSProperties, type ReactNode, type ReactElement, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
import Avatar from '@fibrae/semi-ui-react/avatar/index';
import type { Message, Metadata, RenderAvatarProps } from '../interface';

const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxAvatarProps {
    children?: string;
    role?: Metadata;
    continueSend?: boolean;
    message?: Message;
    className?: string;
    style?: CSSProperties;
    customRenderFunc?: (props: RenderAvatarProps) => ReactNode;
}

function ChatBoxAvatar({ role, customRenderFunc, continueSend, message, className, style }: ChatBoxAvatarProps) {
    const node = useMemo(() => {
        const { avatar, color } = role;
        const isAvatarString = typeof avatar === 'string';
        return (
            <Avatar
                className={clsx(
                    `${PREFIX_CHAT_BOX}-avatar`,
                    {
                        [`${PREFIX_CHAT_BOX}-avatar-hidden`]: continueSend,
                    },
                    className
                )}
                style={style}
                // the title next to it names the sender, and a run's repeat avatar is not rendered visibly at all
                alt=""
                color={color}
                size="extra-small"
                src={isAvatarString ? avatar : undefined}
            >
                {!isAvatarString && avatar}
            </Avatar>
        );
    }, [role, continueSend, className, style]);

    if (typeof customRenderFunc === 'function') {
        return customRenderFunc({
            role,
            defaultAvatar: node,
            message: message,
        }) as ReactElement;
    }

    return node;
}

export default React.memo(ChatBoxAvatar);
