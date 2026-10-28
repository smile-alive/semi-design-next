import { Show, createMemo } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import Checkbox from '@fibrae/semi-ui-solid/checkbox/index';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import { useAIChatDialogueContext } from './context';
import type { Metadata } from './interface';
import DialogueAction from './widgets/dialogue-action';
import DialogueAvatar from './widgets/dialogue-avatar';
import DialogueContent from './widgets/dialogue-content';
import DialogueTitle from './widgets/dialogue-title';

interface DialogueProps {
    message: Message;
    role?: Metadata | Map<string, Metadata>;
    isLastChat: boolean;
    isSelected: boolean;
}

const prefixCls = cssClasses.PREFIX;
const { ROLE, DIALOGUE_ALIGN } = strings;

export default function Dialogue(props: DialogueProps) {
    const { view, selectChange } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const roleInfo = createMemo(() => {
        const role = props.role;
        return role instanceof Map ? role.get(props.message.name ?? '') : role;
    });

    const containerCls = () => clsx(`${prefixCls}-container`, { [`${prefixCls}-container-right`]: props.message.role === ROLE.USER && view().align === DIALOGUE_ALIGN.LEFT_RIGHT });

    const avatar = () => <DialogueAvatar role={roleInfo()} message={props.message} />;

    const title = () => <DialogueTitle role={roleInfo()} message={props.message} />;

    const content = () => <DialogueContent role={roleInfo()} message={props.message} />;

    const action = () => <DialogueAction isLastChat={props.isLastChat} message={props.message} />;

    return (
        <div class={clsx(`${prefixCls}-wrapper`, { [`${prefixCls}-wrapper-selected`]: view().selecting && props.isSelected })}>
            <Show when={view().selecting}>
                <div class={`${prefixCls}-checkbox`}>
                    <Checkbox aria-label={locale().locale.selectMessage} checked={props.isSelected} onChange={(e) => selectChange(Boolean(e.target.checked), props.message.id)} />
                </div>
            </Show>
            <Show
                when={view().dialogueRenderConfig?.renderFullDialogue}
                keyed
                fallback={
                    <div class={containerCls()}>
                        {avatar()}
                        <div class={`${prefixCls}-inner`}>
                            {title()}
                            {content()}
                            {action()}
                        </div>
                    </div>
                }
            >
                {(render) =>
                    render({
                        get message() {
                            return props.message;
                        },
                        get role() {
                            return roleInfo();
                        },
                        // render functions: a node the renderer leaves out is never created, so it cannot shift the hydration keys
                        defaultNodes: { avatar, title, content, action },
                        get class() {
                            return containerCls();
                        },
                    })
                }
            </Show>
        </div>
    );
}
