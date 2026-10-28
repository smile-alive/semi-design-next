import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import '@fibrae/semi-ai-foundation/ai-chat-dialogue/ai-chat-dialogue.scss';
import { Checkbox } from '@fibrae/semi-ui-react/checkbox/index';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import type { AIChatDialogueItemProps } from './interface';
import DialogueAction from './widgets/dialogue-action';
import DialogueAvatar from './widgets/dialogue-avatar';
import DialogueContent from './widgets/dialogue-content';
import DialogueTitle from './widgets/dialogue-title';

const prefixCls = cssClasses.PREFIX;
const { ROLE, DIALOGUE_ALIGN } = strings;

function Dialogue({
    message,
    role,
    selecting,
    align,
    isSelected,
    onSelectChange,
    continueSend,
    dialogueRenderConfig,
    mode,
    markdownRenderProps,
    messageEditRender,
    disabledFileItemClick,
    renderDialogueContentItem,
    onFileClick,
    onImageClick,
    onAnnotationClick,
    onReferenceClick,
    showReference,
    escapeHtml,
    showReset,
    isLastChat,
    onMessageReset,
    onMessageGoodFeedback,
    onMessageBadFeedback,
    onMessageCopy,
    onMessageShare,
    onMessageEdit,
    onMessageDelete,
}: AIChatDialogueItemProps) {
    const { locale } = useLocale('AIChatDialogue');

    const roleInfo = role instanceof Map ? role.get(message?.name) : role;
    const isRightAlign = message.role === ROLE.USER && align === DIALOGUE_ALIGN.LEFT_RIGHT;

    const containerCls = clsx(`${prefixCls}-container`, {
        [`${prefixCls}-container-right`]: isRightAlign,
    });

    const avatar = <DialogueAvatar role={roleInfo} customRenderFunc={dialogueRenderConfig?.renderDialogueAvatar} message={message} />;
    const title = !continueSend && <DialogueTitle role={roleInfo} customRenderFunc={dialogueRenderConfig?.renderDialogueTitle} message={message} />;

    const content = (
        <DialogueContent
            key={message.editing ? 'editing' : 'view'}
            role={roleInfo}
            customRenderFunc={dialogueRenderConfig?.renderDialogueContent}
            disabledFileItemClick={disabledFileItemClick}
            // without messageEditRender the editing branch would render nothing, so the message stays as is
            editing={message.editing && message.role === ROLE.USER && messageEditRender !== undefined}
            escapeHtml={escapeHtml}
            markdownRenderProps={markdownRenderProps}
            message={message}
            mode={mode}
            showReference={showReference}
            messageEditRender={messageEditRender}
            renderDialogueContentItem={renderDialogueContentItem}
            onAnnotationClick={onAnnotationClick}
            onFileClick={onFileClick}
            onImageClick={onImageClick}
            onReferenceClick={onReferenceClick}
        />
    );

    const action = (
        <DialogueAction
            customRenderFunc={dialogueRenderConfig?.renderDialogueAction}
            isLastChat={isLastChat}
            message={message}
            showReset={showReset}
            onMessageBadFeedback={onMessageBadFeedback}
            onMessageCopy={onMessageCopy}
            onMessageDelete={onMessageDelete}
            onMessageEdit={onMessageEdit}
            onMessageGoodFeedback={onMessageGoodFeedback}
            onMessageReset={onMessageReset}
            onMessageShare={onMessageShare}
        />
    );

    return (
        <div
            className={clsx(`${prefixCls}-wrapper`, {
                [`${prefixCls}-wrapper-selected`]: selecting && isSelected,
                [`${prefixCls}-wrapper-continue-send`]: continueSend,
            })}
        >
            {selecting && (
                <div className={`${prefixCls}-checkbox`}>
                    <Checkbox aria-label={locale.selectMessage} checked={isSelected} onChange={(e) => onSelectChange(e.target.checked, message.id)} />
                </div>
            )}
            {dialogueRenderConfig?.renderFullDialogue ? (
                dialogueRenderConfig.renderFullDialogue({
                    message,
                    role: roleInfo,
                    defaultNodes: { avatar, title, content, action },
                    className: containerCls,
                })
            ) : (
                <div className={containerCls}>
                    {avatar}
                    <div className={`${prefixCls}-inner`}>
                        {title}
                        {content}
                        {action}
                    </div>
                </div>
            )}
        </div>
    );
}

// memo: while one message streams, the list re-renders per chunk; earlier messages keep their props and skip
export default memo(Dialogue);
