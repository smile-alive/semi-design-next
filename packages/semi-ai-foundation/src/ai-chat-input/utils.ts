import { getFileType } from '../file-suffix';
import { strings } from './constants';
import type { AIChatInputBaseProps, AIChatInputBaseState } from './foundation';
import type { Attachment, BaseSkill, Reference } from './interface';

export function getAttachmentType(item: Attachment | Reference) {
    const { type, name, fileInstance } = item ?? {};
    if (type) {
        return type;
    }
    return getFileType(name, fileInstance?.type) ?? 'UNKNOWN';
}

export function getOptionId(listId: string, index: number) {
    return `${listId}-option-${index}`;
}

/**
 * The list the editor drives with the keyboard, and the option it is on. Follows the precedence of the panel content:
 * template, then skills, then suggestions.
 */
export function getListbox(
    { templateVisible, skillVisible, suggestionVisible, activeSkillIndex, activeSuggestionIndex }: Pick<AIChatInputBaseState, 'templateVisible' | 'skillVisible' | 'suggestionVisible' | 'activeSkillIndex' | 'activeSuggestionIndex'>,
    { skills, suggestions }: Pick<AIChatInputBaseProps, 'skills' | 'suggestions'>,
    { skillListId, suggestionListId }: { skillListId: string; suggestionListId: string }
): { id: string; activeId: string } | undefined {
    if (templateVisible) {
        return undefined;
    }
    if (skillVisible) {
        return skills?.length ? { id: skillListId, activeId: getOptionId(skillListId, activeSkillIndex) } : undefined;
    }
    if (suggestionVisible && suggestions?.length) {
        return { id: suggestionListId, activeId: getOptionId(suggestionListId, activeSuggestionIndex) };
    }
    return undefined;
}

/**
 * Files a paste uploads. A clipboard that also carries body text is a text paste: Office attaches a preview image
 * to copied content, so the files are not what the user meant to paste.
 */
export function getPastedFiles(clipboardData?: DataTransfer | null) {
    if (!clipboardData || clipboardData.getData('text/plain').trim() !== '') {
        return [];
    }
    return [...clipboardData.items].map((item) => item.getAsFile()).filter((file) => file !== null);
}

export function getContentType(type: string) {
    const objMap = new Map([
        ['docx', 'word'],
        ['doc', 'word'],
        ['txt', 'word'],
        ['epub', 'word'],
        ['mobi', 'word'],
        ['js', 'code'],
        ['ts', 'code'],
        ['jsx', 'code'],
        ['tsx', 'code'],
        ['java', 'code'],
        ['py', 'code'],
        ['c', 'code'],
        ['cpp', 'code'],
        ['go', 'code'],
        ['rs', 'code'],
        ['php', 'code'],
        ['sql', 'code'],
        ['html', 'code'],
        ['css', 'code'],
        ['scss', 'code'],
        ['less', 'code'],
        ['md', 'code'],
        ['json', 'code'],
        ['xlsx', 'excel'],
        ['xls', 'excel'],
        ['pptx', 'ppt'],
        ['ppt', 'ppt'],
        ['mp4', 'video'],
        ['mkv', 'video'],
        ['avi', 'video'],
        ['mov', 'video'],
        ['wmv', 'video'],
        ['flv', 'video'],
        ['webm', 'video'],
        ['3gp', 'video'],
        ['flac', 'audio'],
        ['wav', 'audio'],
        ['alac', 'audio'],
        ['ape', 'audio'],
        ['mp3', 'audio'],
        ['aac', 'audio'],
        ['ogg', 'audio'],
        ['wma', 'audio'],
        ['m4a', 'audio'],
        ['amr', 'audio'],
        ['mid', 'audio'],
        ['midi', 'audio'],
        ['png', 'image'],
        ['jpg', 'image'],
        ['jpeg', 'image'],
        ['gif', 'image'],
        ['bmp', 'image'],
        ['webp', 'image'],
        ['pdf', 'pdf'],
    ]);
    const result = objMap.get(type) ?? 'unknown';
    return result;
}

export function transformSelectSlot({ attrs = {} }: any) {
    // an unselected slot holds the zero-width default value, which is not content
    const { value = '' } = attrs;
    return {
        type: 'text',
        text: value.replaceAll(strings.ZERO_WIDTH_CHAR, ''),
    };
}

export function transformSkillSlot({ type, attrs }: any) {
    const { value, label, hasTemplate } = attrs;
    return omitUndefinedFromObj({ type, value, label, hasTemplate });
}

export function transformInputSlot({ content = [], attrs }: any) {
    const text = content?.[0]?.text ?? '';
    return {
        type: 'text',
        text: text !== strings.ZERO_WIDTH_CHAR && text.length ? text : attrs?.placeholder,
    };
}

export function transformText({ text }: any) {
    return {
        type: 'text',
        // the placeholder character can sit inside a longer text node after typing next to a slot
        text: text.replaceAll(strings.ZERO_WIDTH_CHAR, ''),
    };
}

// hardBreak (Shift+Enter, <br> in pasted HTML) must keep its line break in onContentChange, as paragraphs do
export function transformHardBreak() {
    return {
        type: 'text',
        text: '\n',
    };
}

export const transformMap = new Map<string, any>([
    ['text', transformText],
    ['selectSlot', transformSelectSlot],
    ['inputSlot', transformInputSlot],
    ['skillSlot', transformSkillSlot],
    ['hardBreak', transformHardBreak],
]);

export function transformJSONResult(input: any, customTransformObj: Map<string, (obj: any) => any> = new Map()) {
    const output: any[] = [];

    const traverse = (obj: any) => {
        const { type, content = [] } = obj;
        let result: any;
        switch (type) {
            case 'doc':
                content.forEach((item: any) => {
                    traverse(item);
                });
                break;
            case 'paragraph':
                if (output.length > 0) {
                    const lastItem = output.at(-1);
                    if (lastItem && lastItem.type === 'text') {
                        lastItem.text += '\n';
                    } else {
                        output.push({ type: 'text', text: '\n' });
                    }
                }
                content.forEach((item: any) => {
                    traverse(item);
                });
                break;
            default:
                const transformFn = transformMap.get(type) ?? customTransformObj.get(type);
                result = transformFn?.(obj);
                break;
        }
        if (result) {
            if (result.type === 'text') {
                const lastItem = output.at(-1);
                if (lastItem && lastItem.type === 'text') {
                    lastItem.text += result.text;
                } else if (typeof result.text === 'string') {
                    if (result.text.length) {
                        output.push(result);
                    }
                } else {
                    output.push(result);
                }
            } else {
                output.push(result);
            }
        }
    };

    traverse(input);
    return output;
}

export function getCustomSlotAttribute() {
    return {
        default: true,
        parseHTML: () => true,
        renderHTML: (attributes) => ({
            'data-custom-slot': attributes.isCustomSlot ? true : undefined,
        }),
    };
}

/** The first skillSlot node of the editor JSON, read from its attrs so special characters survive unchanged */
export function findSkillSlot(node: any): BaseSkill | undefined {
    if (node?.type === 'skillSlot') {
        const { value, label, hasTemplate } = node.attrs ?? {};
        return omitUndefinedFromObj({ label, value: value || undefined, hasTemplate });
    }
    for (const child of node?.content ?? []) {
        const found = findSkillSlot(child);
        if (found) {
            return found;
        }
    }
    return undefined;
}

function omitUndefinedFromObj(obj: { [key: string]: any }) {
    return Object.fromEntries(Object.entries(obj).filter(([_key, value]) => value !== undefined));
}

// The editor parses this string as HTML
const escapeAttribute = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

export function getSkillSlotString(skill: BaseSkill) {
    let skillParams = '';
    if (skill.label) {
        skillParams += ` data-label="${escapeAttribute(skill.label)}"`;
    }
    if (skill.value) {
        skillParams += ` data-value="${escapeAttribute(skill.value)}"`;
    }
    if (typeof skill.hasTemplate === 'boolean') {
        skillParams += ` data-template=${skill.hasTemplate}`;
    }
    return `<skill-slot ${skillParams}></skill-slot>`;
}
