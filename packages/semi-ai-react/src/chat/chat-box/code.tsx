import type { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-react';
import { useCopied, useLocale } from '@fibrae/semi-ui-react/hooks';
import { code } from '@fibrae/semi-ui-react/markdown-render/components/index';

const { PREFIX_CHAT_BOX } = cssClasses;

export default function Code(props: PropsWithChildren<{ className: string }>) {
    const { locale } = useLocale('Chat');

    const [copied, copy] = useCopied(2000);

    const language = MarkdownRenderFoundation.getCodeLanguage(props.className);

    // a highlighter plugin can turn the code into elements, which have no text to copy
    const copyable = typeof props.children === 'string';

    const onCopyButtonClick = () => void copy(props.children as string);

    return language && copyable ? (
        <div className={`${PREFIX_CHAT_BOX}-content-code ${BASE_CLASS_PREFIX}-always-dark`}>
            <div className={`${PREFIX_CHAT_BOX}-content-code-topSlot`}>
                <span className={`${PREFIX_CHAT_BOX}-content-code-topSlot-type`}>{language}</span>
                <span className={`${PREFIX_CHAT_BOX}-content-code-topSlot-copy`}>
                    {/* one element for both states, so focus survives the swap */}
                    <button
                        type="button"
                        className={clsx(`${PREFIX_CHAT_BOX}-content-code-topSlot-copy-wrapper`, {
                            [`${PREFIX_CHAT_BOX}-content-code-topSlot-toCopy`]: !copied,
                        })}
                        onClick={copied ? undefined : onCopyButtonClick}
                    >
                        {copied ? <IconTick /> : <IconCopyStroked />}
                        {copied ? locale.copied : locale.copy}
                    </button>
                </span>
            </div>
            {code(props)}
        </div>
    ) : (
        code(props)
    );
}
