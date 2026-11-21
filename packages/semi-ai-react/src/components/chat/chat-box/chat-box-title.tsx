import React, { type CSSProperties, type ReactNode, type ReactElement } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/chat/constants';
import type { Message, Metadata, RenderTitleProps } from '../interface';
const { PREFIX_CHAT_BOX } = cssClasses;

interface ChatBoxTitleProps {
    children?: ReactNode;
    role?: Metadata;
    message?: Message;
    className?: string;
    style?: CSSProperties;
    customRenderFunc?: (props: RenderTitleProps) => ReactNode;
}

function ChatBoxTitle({ role, message, customRenderFunc, className, style }: ChatBoxTitleProps) {
    const title = (
        <span className={clsx(`${PREFIX_CHAT_BOX}-title`, className)} style={style}>
            {role?.name}
        </span>
    );

    if (typeof customRenderFunc === 'function') {
        return customRenderFunc({
            role,
            message,
            defaultTitle: title,
        }) as ReactElement;
    }

    return title;
}

export default React.memo(ChatBoxTitle);
