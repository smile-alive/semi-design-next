import React, { type ReactNode, type ReactElement, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import Avatar from '@fibrae/semi-ui-react/avatar/index';
import type { RenderAvatarProps } from '../interface';

const prefix = cssClasses.PREFIX;

interface DialogueAvatarProps extends RenderAvatarProps {
    continueSend?: boolean;
    customRenderFunc?: (props: RenderAvatarProps) => ReactNode;
}

function DialogueAvatar({ role, customRenderFunc, continueSend, message }: DialogueAvatarProps) {
    const node = useMemo(() => {
        return (
            <Avatar
                className={clsx(`${prefix}-avatar`, {
                    [`${prefix}-avatar-hidden`]: continueSend,
                })}
                // alt names the sender only in a continued run, where the title beside it is not shown
                alt={continueSend ? (role?.name ?? '') : ''}
                color={role?.color}
                size="extra-small"
                src={role?.avatar}
            />
        );
    }, [continueSend, role]);

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            role,
            defaultAvatar: node,
            message: message,
        }) as ReactElement;
    }

    return node;
}

export default React.memo(DialogueAvatar);
