import { isImageFile } from '../../file-suffix';
import type { AudioContentPart, ChatCompletionInput, ImageContentPart, FileContentPart, TextInput } from './interface';

// Known limitation: the input is untyped; type it with the aiChatInput interfaces.
export default function chatInputToChatCompletion({ references, attachments, inputContents, setup }: any): ChatCompletionInput {
    let inputs: (ImageContentPart | AudioContentPart | FileContentPart | TextInput)[] = [];

    if (attachments?.length) {
        attachments.forEach((item: any) => {
            const { name, url } = item;
            if (isImageFile(name, item.fileInstance?.type)) {
                inputs.push({
                    type: 'image_url',
                    image_url: {
                        url: url,
                    },
                });
            } else {
                // File URL inputs need the Responses API.
                inputs.push({
                    type: 'file',
                    file: {
                        file_data: item.file_data,
                        filename: name,
                        file_id: item?.id,
                    },
                });
            }
        });
    }

    if (inputContents?.length) {
        inputContents.forEach((item: any) => {
            inputs.push({
                type: 'text',
                text: item.text,
            });
        });
    }

    return {
        role: 'user',
        messages: [
            {
                role: 'user',
                content: inputs,
            },
        ],
        model: setup?.model,
        references,
        setup: setup ?? {},
    };
}
