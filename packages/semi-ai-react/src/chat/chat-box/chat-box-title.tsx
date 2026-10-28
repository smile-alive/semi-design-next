import React, { type ReactNode, type ReactElement } from 'react';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import type { Message, Metadata, RenderTitleProps } from '../interface';
const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxTitleProps {
    children?: ReactNode;
    role?: Metadata;
    message?: Message;
    customRenderFunc?: (props: RenderTitleProps) => ReactNode;
}

function ChatBoxTitle({ role, message, customRenderFunc }: ChatBoxTitleProps) {
    const title = <span className={`${PREFIX_CHAT_BOX}-title`}>{role?.name}</span>;

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            role,
            message,
            defaultTitle: title,
        }) as ReactElement;
    }

    return title;
}

export default React.memo(ChatBoxTitle);
