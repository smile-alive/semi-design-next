import type { Message } from '../foundation';
import type { Response } from './interface';

export default function responseToMessage({ id, model, status, output, output_text, created_at }: Response): Message {
    return {
        id: id,
        role: 'assistant',
        content: output == null ? undefined : [output].flat(),
        createdAt: created_at,
        output_text: output_text,
        model: model,
        status: status,
    };
}
