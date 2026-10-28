import type { Attachment, Content, MessageContent } from '../../ai-chat-input/interface';
import type { Message, ContentItem, InputMessage } from '../foundation';

export default function messageToChatInput(message: Message): MessageContent {
    const references = message?.references;
    const attachments: Attachment[] = [];
    const inputContents: ContentItem[] = [];

    if (message.content && typeof message.content === 'string') {
        return {
            references,
            attachments,
            inputContents: [{ type: 'text', text: message.content }],
        };
    } else if (message.content && Array.isArray(message.content)) {
        message.content.forEach((messageItem: ContentItem) => {
            if (messageItem.type === 'message') {
                const { content } = messageItem as InputMessage;
                if (typeof content === 'string') {
                    inputContents.push({ type: 'text', text: content });
                    return;
                }
                (content as ContentItem[]).forEach((item: any) => {
                    if (item.type === 'input_text') {
                        inputContents.push({
                            type: 'text',
                            text: item?.text,
                        });
                    } else if (item.type === 'input_image') {
                        attachments.push({
                            name: item?.name,
                            url: item?.image_url,
                            status: 'success',
                            size: item?.size,
                            uid: item?.uid,
                        });
                    } else if (item.type === 'input_file') {
                        attachments.push({
                            name: item?.filename,
                            url: item?.file_url,
                            status: 'success',
                            size: item?.size,
                            uid: item?.uid,
                        });
                    }
                });
            }
        });
    }

    return {
        references,
        attachments,
        inputContents: inputContents as Content[],
    };
}
