import type { PropsWithChildren } from 'react';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import { IconCopyStroked, IconTick } from '@fibrae/semi-icons-react';
import { useCopied, useLocale } from '@fibrae/semi-ui-react/hooks';
import { code } from '@fibrae/semi-ui-react/markdown-render/components/index';

const { PREFIX_CODE } = cssClasses;

export default function Code(props: PropsWithChildren<{ className: string }>) {
    const { locale } = useLocale('AIChatDialogue');

    const [copied, copy] = useCopied(2000);

    const language = MarkdownRenderFoundation.getCodeLanguage(props.className);

    // a highlighter plugin can turn the code into elements, which have no text to copy
    const copyable = typeof props.children === 'string';

    const onCopyButtonClick = () => void copy(props.children as string);

    return language && copyable ? (
        <div className={`${PREFIX_CODE}`}>
            <div className={`${PREFIX_CODE}-topSlot`}>
                <span className={`${PREFIX_CODE}-topSlot-type`}>{language}</span>
                <span className={`${PREFIX_CODE}-topSlot-copy`}>
                    {/* one element for both states, so focus survives the swap */}
                    <button type="button" className={`${PREFIX_CODE}-topSlot-copy-wrapper`} aria-label={copied ? locale.copySuccess : locale.copy} onClick={copied ? undefined : onCopyButtonClick}>
                        {copied ? <IconTick /> : <IconCopyStroked />}
                    </button>
                </span>
            </div>
            {code(props)}
        </div>
    ) : (
        code(props)
    );
}
