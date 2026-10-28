import type { MessageContent, Reference, Setup } from '../../ai-chat-input/interface';
import { isImageFile } from '../../file-suffix';
import type { InputMessage } from '../foundation';

export interface ChatInputMessage {
    role: string;
    content: InputMessage[];
    model?: string;
    references?: Reference[];
    setup: Setup;
}

export default function chatInputToMessage({ references, attachments, inputContents, setup }: MessageContent): ChatInputMessage {
    let inputs: any[] = [];

    if (attachments?.length) {
        attachments.forEach((item: any) => {
            const { name, url } = item;
            if (isImageFile(name, item.fileInstance?.type)) {
                inputs.push({
                    ...item,
                    type: 'input_image',
                    image_url: url,
                    detail: 'auto',
                });
            } else {
                inputs.push({
                    ...item,
                    type: 'input_file',
                    file_url: url,
                    filename: name,
                });
            }
        });
    }

    if (inputContents?.length) {
        inputContents.forEach((item: any) => {
            inputs.push({
                type: 'input_text',
                text: item.text,
            });
        });
    }

    return {
        role: 'user',
        content: [
            {
                type: 'message',
                role: 'user',
                content: inputs,
            },
        ],
        model: setup?.model,
        references,
        setup: setup ?? {},
    };
}
