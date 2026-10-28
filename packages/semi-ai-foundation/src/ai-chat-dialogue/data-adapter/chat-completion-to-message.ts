import { finishReasonToStatus, strings } from '../constants';
import type { Message } from '../foundation';
import type { ChatCompletion, Choice, ChatCompletionToolCalls, ChatCompletionToolCall } from './interface';

// Unlike Response, annotations sit on content and function_call/tool_calls have no call_id or status.
export default function chatCompletionToMessage(chatCompletion: ChatCompletion): Message[] {
    return chatCompletion.choices.map((choice: Choice) => {
        const message = choice.message;
        const role = message.role;
        const id = chatCompletion.id;
        const status = finishReasonToStatus(choice.finish_reason ?? 'stop');

        const outputResult = [];

        // OpenAI returns content/refusal as null when absent
        if (message.content || message.refusal) {
            const annotations = message.annotations?.length
                ? message.annotations.map((annotation) => ({
                      type: annotation.type,
                      ...annotation.url_citation,
                  }))
                : [];

            const outputMessage = [
                message.content && {
                    type: 'output_text',
                    text: message.content,
                    annotations,
                },
                message.refusal && {
                    type: 'refusal',
                    refusal: message.refusal,
                },
            ].filter(Boolean);

            outputResult.push({
                type: 'message',
                id: id,
                role: 'assistant',
                status: status,
                content: outputMessage,
            });
        }

        if (message.function_call) {
            outputResult.push({
                ...message.function_call,
                type: 'function_call',
                status: 'completed',
            });
        }

        if (message?.tool_calls?.length) {
            const toolCalls = message.tool_calls.map((toolCall: ChatCompletionToolCalls) => {
                if (toolCall.type === 'function') {
                    return {
                        status: 'completed',
                        ...(toolCall as ChatCompletionToolCall).function,
                        type: strings.MESSAGE_ITEM_TYPE.FUNCTION_CALL,
                    };
                }
                return {
                    ...toolCall.custom,
                    type: strings.MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL,
                };
            });
            outputResult.push(...toolCalls);
        }

        if (message.audio) {
            outputResult.push({
                type: 'audio',
                ...message.audio,
            });
        }

        return {
            id: id,
            role: role,
            content: outputResult,
            status: status,
        };
    });
}
