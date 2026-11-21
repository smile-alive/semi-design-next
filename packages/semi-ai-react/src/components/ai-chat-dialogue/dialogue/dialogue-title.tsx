import React, { type ReactElement, type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/constants';
import type { RenderTitleProps } from '../interface';

const prefix = cssClasses.PREFIX;

interface DialogueTitleProps extends RenderTitleProps {
    className?: string;
    style?: React.CSSProperties;
    customRenderFunc?: (props: RenderTitleProps) => ReactNode;
}

function DialogueTitle({ role, message, className, style, customRenderFunc }: DialogueTitleProps) {
    const title = (
        <span className={clsx(`${prefix}-title`, className)} style={style}>
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

export default React.memo(DialogueTitle);
