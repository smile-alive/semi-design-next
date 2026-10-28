import { cloneDeep } from 'es-toolkit';
import type { ContentItem, OutputMessage, OutputText, Reasoning, Refusal, FunctionToolCall, CustomToolCall, MCPToolCall, Message } from '../foundation';
import type { CodeInterpreterCall, ImageGenerationCall, ResponseChunk, StreamingResponseState } from './interface';

// The reducer has no clock: a missing chunk is waited for by counting later chunks
const MAX_GAP = 10;

/**
 * Incremental reducer for streaming Response chunks. Chunks are buffered by sequence_number and applied in
 * consecutive order; chunks seen in earlier calls (via prevState) are skipped.
 *
 * @param chunks - Incoming response chunks
 * @param prevState - State returned by the previous call
 * @returns The accumulated message and the next state, or null if there are no chunks
 */
export default function streamingResponseToMessage(chunks?: ResponseChunk[], prevState?: StreamingResponseState) {
    if (!chunks?.length) return null;

    const tail = chunks.at(-1);
    if (tail.type === 'response.completed') {
        const { id, model, status, output, output_text, created_at } = tail.response;
        const message = {
            id: id,
            role: 'assistant',
            content: output == null ? undefined : [output].flat(),
            createdAt: created_at,
            output_text: output_text,
            model: model,
            status: status,
        };
        return { message, nextState: null };
    }

    const state = prevState
        ? {
              processedSeq: new Set(prevState.processedSeq),
              // Deep copy: delta cases append in place and must not reach prevState or earlier messages
              outputs: cloneDeep(prevState.outputs),
              meta: { ...prevState.meta },
              error: prevState.error ?? null,
              buffer: new Map(prevState.buffer),
              lastProcessedSeq: prevState.lastProcessedSeq ?? -1,
              processedUnsequenced: new Set(prevState.processedUnsequenced),
          }
        : {
              processedSeq: new Set<number>(),
              outputs: new Map<number, ContentItem | null>(),
              meta: {},
              error: null,
              buffer: new Map<number, ResponseChunk>(),
              lastProcessedSeq: -1,
              processedUnsequenced: new Set<ResponseChunk>(),
          };

    const unprocessed = chunks.filter((c) => {
        const seq = c?.sequence_number;
        return typeof seq !== 'number' || !state.processedSeq.has(seq);
    });

    // ContentItem.type is a plain string, so the cast relies on the event type
    const outputAt = <T extends ContentItem>(index: number) => state.outputs.get(index) as T;

    const messagePart = <T extends OutputText | Refusal>(chunk: { output_index: number; content_index: number }, empty: T) => {
        const item = outputAt<OutputMessage>(chunk.output_index);
        item.content = item.content ?? [];
        item.content[chunk.content_index] = item.content[chunk.content_index] ?? empty;
        return item.content[chunk.content_index] as T;
    };

    const reasoningEntry = (outputIndex: number, field: 'summary' | 'content', index: number) => {
        const item = outputAt<Reasoning>(outputIndex);
        item[field] = item[field] ?? [];
        item[field][index] = item[field][index] ?? { type: 'reasoning', text: '' };
        return item[field][index];
    };

    const processChunk = (chunk: ResponseChunk) => {
        switch (chunk.type) {
            case 'response.created': {
                const { response } = chunk;
                if (response) {
                    state.meta.id = response.id ?? state.meta.id;
                    state.meta.model = response.model ?? state.meta.model;
                    state.meta.status = response.status ?? state.meta.status;
                    state.meta.created_at = response.created_at ?? state.meta.created_at;
                }
                break;
            }
            case 'response.output_item.added': {
                // Deep clone: later deltas mutate the item and must not touch chunk.item
                const outIdx = typeof chunk.output_index === 'number' ? chunk.output_index : 0;
                if (!state.outputs.has(outIdx)) {
                    state.outputs.set(outIdx, cloneDeep(chunk.item ?? {}));
                }
                break;
            }
            case 'response.output_item.done': {
                state.outputs.set(chunk.output_index, cloneDeep(chunk.item));
                break;
            }
            case 'response.content_part.added':
            case 'response.content_part.done': {
                const item = outputAt<OutputMessage>(chunk.output_index);
                item.content = item.content ?? [];
                item.content[chunk.content_index] = cloneDeep(chunk.part);
                break;
            }
            case 'response.output_text.delta': {
                const part = messagePart<OutputText>(chunk, { type: 'output_text', text: '' });
                part.text = (part.text ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.output_text.done': {
                messagePart<OutputText>(chunk, { type: 'output_text', text: '' }).text = chunk.text;
                break;
            }
            case 'response.output_text.annotation.added': {
                const part = messagePart<OutputText>(chunk, { type: 'output_text', text: '', annotations: [] });
                part.annotations = part.annotations ?? [];
                part.annotations[chunk.annotation_index] = cloneDeep(chunk.annotation);
                break;
            }
            case 'response.refusal.delta': {
                const part = messagePart<Refusal>(chunk, { type: 'refusal', refusal: '' });
                part.refusal = (part.refusal ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.refusal.done': {
                messagePart<Refusal>(chunk, { type: 'refusal', refusal: '' }).refusal = chunk.refusal;
                break;
            }
            case 'response.reasoning_summary_part.added':
            case 'response.reasoning_summary_part.done': {
                const item = outputAt<Reasoning>(chunk.output_index);
                item.summary = item.summary ?? [];
                item.summary[chunk.summary_index] = cloneDeep(chunk.part);
                break;
            }
            case 'response.reasoning_summary_text.delta': {
                const entry = reasoningEntry(chunk.output_index, 'summary', chunk.summary_index);
                entry.text = (entry.text ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.reasoning_summary_text.done': {
                reasoningEntry(chunk.output_index, 'summary', chunk.summary_index).text = chunk.text;
                break;
            }
            case 'response.reasoning_text.delta': {
                const entry = reasoningEntry(chunk.output_index, 'content', chunk.content_index);
                entry.text = (entry.text ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.reasoning_text.done': {
                reasoningEntry(chunk.output_index, 'content', chunk.content_index).text = chunk.text;
                break;
            }
            case 'response.function_call_arguments.delta': {
                const item = outputAt<FunctionToolCall>(chunk.output_index);
                item.arguments = (item.arguments ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.function_call_arguments.done': {
                const item = outputAt<FunctionToolCall>(chunk.output_index);
                item.arguments = chunk.arguments;
                item.name = chunk.name;
                break;
            }
            case 'response.custom_tool_call_input.delta': {
                const item = outputAt<CustomToolCall>(chunk.output_index);
                item.input = (item.input ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.custom_tool_call_input.done': {
                outputAt<CustomToolCall>(chunk.output_index).input = chunk.input;
                break;
            }
            case 'response.mcp_call_arguments.delta': {
                const item = outputAt<MCPToolCall>(chunk.output_index);
                item.arguments = (item.arguments ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.mcp_call_arguments.done': {
                outputAt<MCPToolCall>(chunk.output_index).arguments = chunk.arguments;
                break;
            }
            case 'response.file_search_call.in_progress':
            case 'response.web_search_call.in_progress':
            case 'response.image_generation_call.in_progress':
            case 'response.mcp_call.in_progress':
            case 'response.mcp_list_tools.in_progress':
            case 'response.code_interpreter_call.in_progress': {
                const out = state.outputs.get(chunk.output_index);
                if (out) out.status = 'in_progress';
                break;
            }
            case 'response.mcp_call.failed':
            case 'response.mcp_list_tools.failed': {
                const out = state.outputs.get(chunk.output_index);
                if (out) out.status = 'failed';
                break;
            }
            case 'response.file_search_call.completed':
            case 'response.web_search_call.completed':
            case 'response.image_generation_call.completed':
            case 'response.mcp_call.completed':
            case 'response.mcp_list_tools.completed':
            case 'response.code_interpreter_call.completed': {
                const out = state.outputs.get(chunk.output_index);
                if (out) out.status = 'completed';
                break;
            }
            case 'response.code_interpreter_call_code.delta': {
                const item = outputAt<CodeInterpreterCall>(chunk.output_index);
                item.code = (item.code ?? '') + (chunk.delta ?? '');
                break;
            }
            case 'response.code_interpreter_call_code.done': {
                outputAt<CodeInterpreterCall>(chunk.output_index).code = chunk.code;
                break;
            }
            case 'response.image_generation_call.partial_image': {
                const item = outputAt<ImageGenerationCall>(chunk.output_index);
                if (item) item.result = chunk.partial_image_b64;
                break;
            }
            case 'error': {
                state.error = {
                    code: chunk.code,
                    message: chunk.message,
                };
                state.meta.status = 'failed';
                break;
            }
            case 'response.queued':
            case 'response.in_progress':
            case 'response.completed':
            case 'response.failed':
            case 'response.incomplete': {
                // Responses API event names end in the status value, used when the payload omits response.status
                state.meta.status = chunk.response?.status ?? chunk.type.slice('response.'.length);
                if (chunk.type === 'response.failed' && chunk.response?.error) {
                    state.error = { code: chunk.response.error.code, message: chunk.response.error.message };
                }
                break;
            }
            default: {
                break;
            }
        }
    };

    const drainBuffer = () => {
        let chunk: ResponseChunk | undefined;
        while ((chunk = state.buffer.get(state.lastProcessedSeq + 1))) {
            const seq = state.lastProcessedSeq + 1;
            processChunk(chunk);
            state.processedSeq.add(seq);
            state.buffer.delete(seq);
            state.lastProcessedSeq = seq;
        }
    };

    for (const chunk of unprocessed) {
        const seq = chunk?.sequence_number;
        if (typeof seq === 'number') {
            state.buffer.set(seq, chunk);
        } else if (!state.processedUnsequenced.has(chunk)) {
            // Identity is the only dedupe key (callers pass cumulative lists), so chunks re-created per call, e.g.
            // re-parsed JSON, are applied again; such sources should send sequence_number.
            drainBuffer();
            processChunk(chunk);
            state.processedUnsequenced.add(chunk);
        }
    }
    drainBuffer();

    // Give up on chunks that never arrive once more than MAX_GAP later ones wait; a late arrival is then dropped
    while (state.buffer.size > MAX_GAP) {
        const next = Math.min(...state.buffer.keys());
        for (let seq = state.lastProcessedSeq + 1; seq < next; seq++) {
            state.processedSeq.add(seq);
        }
        state.lastProcessedSeq = next - 1;
        drainBuffer();
    }

    const content = Array.from(state.outputs.values()).filter((item) => item !== null);

    const output_text = content
        .flatMap((item) => (item.type === 'message' ? ((item as OutputMessage).content ?? []) : []))
        .filter((part): part is OutputText => part?.type === 'output_text')
        .map((part) => part.text ?? '')
        .join('');

    const message: Message | null =
        content?.length || state.meta.id
            ? {
                  id: state.meta.id,
                  role: 'assistant',
                  content,
                  createdAt: state.meta.created_at,
                  output_text,
                  model: state.meta.model,
                  status: state.meta.status ?? 'in_progress',
                  error: state.error ?? null,
              }
            : null;

    return { message, nextState: state };
}
