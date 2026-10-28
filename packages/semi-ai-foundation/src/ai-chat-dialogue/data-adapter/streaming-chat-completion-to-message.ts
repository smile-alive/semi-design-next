import { cloneDeep } from 'es-toolkit';
import { finishReasonToStatus, strings } from '../constants';
import type { FunctionToolCall, Message, OutputMessage, OutputText, Refusal } from '../foundation';
import type { ChatCompletionChunk, ChatCompletionToolCall } from './interface';

// processedCountByIndex counts the chunks already handled per `${request id}:${choice index}`
export interface StreamingChatState {
    processedCountByIndex?: Record<string, number>;
    previousResult?: Message[];
}

export default function streamingChatCompletionToMessage(chatCompletionChunks: ChatCompletionChunk[], state?: StreamingChatState): { messages: Message[]; state?: StreamingChatState } {
    const groupedChunks = groupByIndex(chatCompletionChunks);
    // New object: the caller's state must not be written to
    const processedCountByIndex = { ...state?.processedCountByIndex };

    const results = groupedChunks
        .map((chatCompletionChunks: ChatCompletionChunk[], groupIndex: number) => {
            const id = chatCompletionChunks[0].id;
            const status = getStatus(chatCompletionChunks);

            const stateKey = `${id}:${chatCompletionChunks[0]?.choices?.[0]?.index ?? groupIndex}`;
            const processedCount = state?.processedCountByIndex?.[stateKey] ?? 0;
            const start = processedCount > 0 ? Math.min(processedCount, chatCompletionChunks.length) : 0;
            const chunksToProcess = state ? chatCompletionChunks.slice(start) : chatCompletionChunks;

            if (state && chunksToProcess.length === 0) {
                return state.previousResult?.[groupIndex];
            }

            const previousResult = state?.previousResult?.[groupIndex];
            let textContent = '';
            let refusal = '';
            let functionCall = { name: '', arguments: '' };
            let toolCalls = [];

            (previousResult?.content as OutputMessage[])?.forEach((item: OutputMessage) => {
                item.content?.forEach((content: OutputText | Refusal | FunctionToolCall) => {
                    if (content.type === 'output_text') {
                        textContent += (content as OutputText).text;
                    }
                    if (content.type === 'refusal') {
                        refusal += (content as Refusal).refusal;
                    }
                });
                if (item.type === 'function_call' && !item.id) {
                    functionCall.name = (item as FunctionToolCall).name;
                    functionCall.arguments = (item as FunctionToolCall).arguments;
                }
                if ((item.type === strings.MESSAGE_ITEM_TYPE.FUNCTION_CALL || item.type === strings.MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL) && item.id) {
                    // Cloned: deltas below append in place
                    toolCalls.push(cloneDeep(item));
                }
            });

            chunksToProcess.map((chunk: ChatCompletionChunk) => {
                const delta = chunk.choices[0].delta;
                if (delta?.content) {
                    textContent += delta.content;
                }
                if (delta?.refusal) {
                    refusal += delta.refusal;
                }
                if (delta?.function_call) {
                    if (delta.function_call.name) {
                        functionCall.name += delta.function_call.name;
                    }
                    functionCall.arguments += delta.function_call.arguments ?? '';
                }
                if (delta?.tool_calls) {
                    delta?.tool_calls.forEach((toolCall: ChatCompletionToolCall) => {
                        // Only the first delta of a tool call carries id and name; later ones carry just the index
                        // toolCalls is in first-appearance order, which is the order of index within the choice
                        const curToolCall = toolCalls[toolCall.index];
                        if (curToolCall) {
                            if (toolCall.function?.name || toolCall.custom?.name) {
                                curToolCall.name += toolCall.function?.name ?? toolCall.custom?.name;
                            }
                            if (toolCall.function) {
                                curToolCall.arguments += toolCall.function.arguments ?? '';
                            }
                            if (toolCall.custom) {
                                curToolCall.input += toolCall.custom.input ?? '';
                            }
                        } else {
                            const { function: fn, custom } = toolCall;
                            toolCalls.push({
                                ...fn,
                                ...custom,
                                name: fn?.name ?? custom?.name ?? '',
                                ...(fn ? { arguments: fn.arguments ?? '' } : { input: custom?.input ?? '' }),
                                type: toolCall.function ? strings.MESSAGE_ITEM_TYPE.FUNCTION_CALL : strings.MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL,
                                id: toolCall.id,
                            });
                        }
                    });
                }
            });
            toolCalls.forEach((toolCall) => {
                toolCall.status = status;
            });

            const outputMessage = [
                textContent !== '' && {
                    type: 'output_text',
                    text: textContent,
                },
                refusal !== '' && {
                    type: 'refusal',
                    refusal: refusal,
                },
            ].filter(Boolean);

            const outputResult = [
                outputMessage.length > 0 && {
                    type: 'message',
                    id: id,
                    role: 'assistant',
                    status: status,
                    content: outputMessage,
                },
                functionCall.name !== '' && {
                    type: 'function_call',
                    ...functionCall,
                },
                ...toolCalls,
            ].filter(Boolean);

            processedCountByIndex[stateKey] = chatCompletionChunks.length;

            return {
                id: id,
                role: 'assistant',
                content: outputResult,
                status: status,
            };
        })
        .filter(Boolean) as Message[];

    return {
        messages: results,
        state: { processedCountByIndex, previousResult: cloneDeep(results) },
    };
}

function groupByIndex(chatCompletionChunks: ChatCompletionChunk[]) {
    const groupedChunks = [];
    chatCompletionChunks.forEach((chunk) => {
        chunk.choices.forEach((choice) => {
            const curIndex = choice.index;
            if (!groupedChunks[curIndex]) {
                groupedChunks[curIndex] = [];
            }
            groupedChunks[curIndex].push({
                ...chunk,
                choices: [choice],
            });
        });
    });
    return groupedChunks;
}

function getStatus(chatCompletionChunks: ChatCompletionChunk[]) {
    const lastChunk = chatCompletionChunks.at(-1);
    return finishReasonToStatus(lastChunk.choices[0].finish_reason);
}
