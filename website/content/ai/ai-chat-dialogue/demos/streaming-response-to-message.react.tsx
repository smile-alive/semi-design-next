import { useState, useCallback, useEffect } from 'react';
import { AIChatDialogue, streamingResponseToMessage, type AIChatDialogueMessage as Message, type ResponseChunk, type StreamingResponseState } from '@fibrae/semi-ai-react';

const roleConfig = {
    user: {
        name: 'User',
        avatar: '/assets/docs-icon.png',
    },
    assistant: {
        name: 'Assistant',
        avatar: '/assets/placeholder/logo.svg',
    },
    system: {
        name: 'System',
        avatar: '/assets/placeholder/logo.svg',
    },
};

const FIXED_SHUFFLED_INDICES = [
    0,
    1,
    2,
    3,
    4,
    6, // chunk 5 skipped
    6, // chunk 6 arrives twice
    7,
    5, // chunk 5 arrives late
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
];

export default function AIChatDialogueDemo() {
    const [messages, setMessage] = useState<Message[]>([]);
    const [currentState, setCurrentState] = useState<StreamingResponseState | undefined>();
    const [currentLength, setCurrentLength] = useState(0);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    useEffect(() => {
        if (currentLength > FIXED_SHUFFLED_INDICES.length) {
            return;
        }

        const timer = setTimeout(() => {
            if (currentLength === 0) {
                setCurrentLength(1);
                return;
            }

            const currentIndices = FIXED_SHUFFLED_INDICES.slice(0, currentLength);
            const currentChunks = currentIndices.map((index) => REASONING_CHUNKS[index]);

            const result = streamingResponseToMessage(currentChunks, currentState);

            if (result) {
                const { message: responseMessage, nextState } = result;
                if (responseMessage) {
                    setMessage([responseMessage]);
                    setCurrentState(nextState);
                }
            }
            setCurrentLength((prev) => prev + 1);
        }, 200);

        return () => clearTimeout(timer);
    }, [currentLength, currentState]);

    return <AIChatDialogue align="leftRight" mode="bubble" chats={messages} roleConfig={roleConfig} onChatsChange={onChatsChange} />;
}

const REASONING_CHUNKS: ResponseChunk[] = [
    {
        type: 'response.created',
        sequence_number: 0,
        response: {
            id: 'resp_reason_001',
            object: 'response',
            created_at: 1760091777,
            status: 'in_progress',
            background: false,
            error: null,
            incomplete_details: null,
            instructions: null,
            max_output_tokens: null,
            max_tool_calls: null,
            model: 'o3-mini-2025-01-31',
            output: [],
            parallel_tool_calls: true,
            previous_response_id: null,
            prompt_cache_key: null,
            reasoning: { effort: 'medium', summary: null },
            safety_identifier: null,
            service_tier: 'auto',
            store: true,
            temperature: 1.0,
            text: { format: { type: 'text' }, verbosity: 'medium' },
            tool_choice: 'auto',
            tools: [],
            top_logprobs: 0,
            top_p: 1.0,
            truncation: 'disabled',
            usage: null,
            user: null,
            metadata: {},
        },
    },
    {
        type: 'response.in_progress',
        sequence_number: 1,
        response: {
            id: 'resp_reason_001',
            object: 'response',
            created_at: 1760091777,
            status: 'in_progress',
            background: false,
            error: null,
            incomplete_details: null,
            instructions: null,
            max_output_tokens: null,
            max_tool_calls: null,
            model: 'o3-mini-2025-01-31',
            output: [],
            parallel_tool_calls: true,
            previous_response_id: null,
            prompt_cache_key: null,
            reasoning: { effort: 'medium', summary: null },
            safety_identifier: null,
            service_tier: 'auto',
            store: true,
            temperature: 1.0,
            text: { format: { type: 'text' }, verbosity: 'medium' },
            tool_choice: 'auto',
            tools: [],
            top_logprobs: 0,
            top_p: 1.0,
            truncation: 'disabled',
            usage: null,
            user: null,
            metadata: {},
        },
    },

    // reasoning item (output index 0)
    {
        type: 'response.output_item.added',
        sequence_number: 2,
        output_index: 0,
        item: { id: 'rs_reason_001', type: 'reasoning', summary: [] },
    },
    {
        type: 'response.reasoning_summary_part.added',
        sequence_number: 3,
        output_index: 0,
        summary_index: 0,
        part: { type: 'reasoning', text: '' },
    },
    {
        type: 'response.reasoning_summary_text.delta',
        sequence_number: 4,
        output_index: 0,
        summary_index: 0,
        delta: '思',
    },
    {
        type: 'response.reasoning_summary_text.delta',
        sequence_number: 5,
        output_index: 0,
        summary_index: 0,
        delta: '考',
    },
    {
        type: 'response.reasoning_summary_text.delta',
        sequence_number: 6,
        output_index: 0,
        summary_index: 0,
        delta: '完',
    },
    {
        type: 'response.reasoning_summary_text.delta',
        sequence_number: 7,
        output_index: 0,
        summary_index: 0,
        delta: '成',
    },
    {
        type: 'response.reasoning_summary_text.delta',
        sequence_number: 8,
        output_index: 0,
        summary_index: 0,
        delta: '！',
    },
    {
        type: 'response.reasoning_summary_text.done',
        sequence_number: 9,
        output_index: 0,
        summary_index: 0,
        text: '思考完成！',
    },
    {
        type: 'response.output_item.done',
        sequence_number: 10,
        output_index: 0,
        item: { id: 'rs_reason_001', type: 'reasoning', summary: [{ type: 'reasoning', text: '思考完成！' }] },
    },

    // assistant message (output index 1)
    {
        type: 'response.output_item.added',
        sequence_number: 11,
        output_index: 1,
        item: { id: 'msg_reason_001', type: 'message', status: 'in_progress', content: [], role: 'assistant' },
    },
    {
        type: 'response.content_part.added',
        sequence_number: 12,
        output_index: 1,
        content_index: 0,
        part: { type: 'output_text', annotations: [], text: '' },
    },
    {
        type: 'response.output_text.delta',
        sequence_number: 13,
        output_index: 1,
        content_index: 0,
        delta: '基于上述思考，',
    },
    {
        type: 'response.output_text.delta',
        sequence_number: 14,
        output_index: 1,
        content_index: 0,
        delta: '结论如下：',
    },
    {
        type: 'response.output_text.done',
        sequence_number: 15,
        output_index: 1,
        content_index: 0,
        text: '基于上述思考，结论如下：...',
    },

    {
        type: 'response.completed',
        sequence_number: 16,
        response: {
            id: 'resp_reason_001',
            object: 'response',
            created_at: 1760091777,
            status: 'completed',
            background: false,
            error: null,
            incomplete_details: null,
            instructions: null,
            max_output_tokens: null,
            max_tool_calls: null,
            model: 'o3-mini-2025-01-31',
            output: [
                { id: 'rs_reason_001', type: 'reasoning', summary: [{ type: 'reasoning', text: '思考完成！' }] },
                {
                    id: 'msg_reason_001',
                    type: 'message',
                    status: 'completed',
                    content: [{ type: 'output_text', annotations: [], text: '基于上述思考，结论如下：...' }],
                    role: 'assistant',
                },
            ],
            parallel_tool_calls: true,
            previous_response_id: null,
            prompt_cache_key: null,
            reasoning: { effort: 'medium', summary: null },
            safety_identifier: null,
            service_tier: 'default',
            store: true,
            temperature: 1.0,
            text: { format: { type: 'text' }, verbosity: 'medium' },
            tool_choice: 'auto',
            tools: [],
            top_logprobs: 0,
            top_p: 1.0,
            truncation: 'disabled',
            usage: {
                input_tokens: 12,
                input_tokens_details: { cached_tokens: 0 },
                output_tokens: 120,
                output_tokens_details: { reasoning_tokens: 16 },
                total_tokens: 132,
            },
            user: null,
            metadata: {},
        },
    },
];
