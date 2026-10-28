import React, { type ReactElement, type ReactNode } from 'react';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { RenderTitleProps } from '../interface';

const prefix = cssClasses.PREFIX;

interface DialogueTitleProps extends RenderTitleProps {
    customRenderFunc?: (props: RenderTitleProps) => ReactNode;
}

function DialogueTitle({ role, message, customRenderFunc }: DialogueTitleProps) {
    const title = <span className={`${prefix}-title`}>{role?.name}</span>;

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            role,
            message,
            defaultTitle: title,
        }) as ReactElement;
    }

    return title;
}

export default React.memo(DialogueTitle);
