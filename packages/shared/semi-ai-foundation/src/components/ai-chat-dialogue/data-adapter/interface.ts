import type { Annotation, ContentItem, OutputText, Refusal } from '../foundation';

export interface ChatCompletion {
    id?: string;
    object?: string;
    created?: number;
    model?: string;
    choices?: Choice[];
    usage?: Usage | null;
    service_tier?: string | null;
    system_fingerprint?: string | null;
}

export interface ChatCompletionChunk {
    id?: string;
    object?: string;
    created?: number;
    model?: string;
    choices?: ChoiceChunk[];
    usage?: Usage | null;
    service_tier?: string | null;
    system_fingerprint?: string | null;
}

export interface Choice {
    index?: number;
    message?: ChatCompletionMessage;
    logprobs?: Logprobs | null;
    finish_reason?: string | null;
}

export interface ChoiceChunk {
    index?: number;
    delta?: Delta;
    logprobs?: Logprobs | null;
    finish_reason?: string | null;
}

export interface Delta {
    role?: string | null;
    content?: string | null;
    refusal?: string | null;
    function_call?: FunctionCall | null;
    tool_calls?: ChatCompletionToolCall[] | null;
}

interface ChatCompletionMessage {
    role?: string;
    content?: string | null;
    refusal?: string | null;
    annotations?: ChatCompletionAnnotation[];
    audio?: Audio | null;
    function_call?: FunctionCall | null;
    tool_calls?: ChatCompletionToolCalls[] | null;
}

export type ChatCompletionToolCalls = ChatCompletionToolCall | ChatCompletionCustomToolCall;

interface ChatCompletionAnnotation {
    type?: string;
    url_citation?: URLCitation;
}

interface URLCitation {
    end_index?: number;
    start_index?: number;
    title?: string;
    url?: string;
}

interface Audio {
    data: string;
    expires_at?: number;
    id?: string;
    transcript?: string;
}

interface FunctionCall {
    name?: string;
    arguments?: string;
}

interface ToolCall {
    input?: string;
    name?: string;
}

export interface ChatCompletionToolCall {
    id?: string;
    index?: number;
    type?: string;
    function?: FunctionCall;
    custom?: ToolCall;
}

export interface ChatCompletionCustomToolCall {
    id?: string;
    type?: string;
    custom?: ToolCall;
}

interface Logprobs {
    content?: LogprobsContent[];
    refusal?: LogprobsContent[];
}

interface LogprobsContent {
    bytes?: number[];
    logprob?: number;
    token?: string;
    top_logprobs?: LogprobsContent[];
}

interface Usage {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    completion_tokens_details?: CompletionTokensDetails;
    prompt_tokens_details?: PromptTokensDetails;
}

interface CompletionTokensDetails {
    reasoning_tokens?: number;
    audio_tokens?: number;
    accepted_prediction_tokens?: number;
    rejected_prediction_tokens?: number;
}

interface PromptTokensDetails {
    cached_tokens?: number;
    audio_tokens?: number;
}

export interface Response {
    id?: string;
    created_at?: number;
    error?: ResponseError | null;
    incomplete_details?: {
        reason: string;
    } | null;
    max_output_tokens?: number | null;
    max_tool_calls?: number | null;
    model?: string;
    object?: string;
    output?: ContentItem | ContentItem[];
    output_text?: string | null;
    parallel_tool_calls?: boolean;
    previous_response_id?: string | null;
    reasoning?: ResponseReasoning | null;
    safety_identifier?: string | null;
    status?: string;
    temperature?: number | null;
    top_logprobs?: number | null;
    top_p?: number | null;
    truncation?: string | null;
    [x: string]: any;
}

export interface ResponseError {
    code?: string;
    message?: string;
}

interface ResponseReasoning {
    effort?: string | null;
    generate_summary?: string | null;
    summary?: string | null;
}

/**
 * OpenAI Responses streaming events, discriminated by `type`. Each member declares only the fields
 * streamingResponseToMessage reads; events of other types are skipped.
 */
export type ResponseChunk =
    | ResponseLifecycleChunk
    | OutputItemChunk
    | ContentPartChunk
    | ContentDeltaChunk
    | ContentTextDoneChunk
    | RefusalDoneChunk
    | AnnotationAddedChunk
    | ReasoningSummaryPartChunk
    | ReasoningSummaryDeltaChunk
    | ReasoningSummaryDoneChunk
    | ToolInputDeltaChunk
    | FunctionCallArgumentsDoneChunk
    | MCPCallArgumentsDoneChunk
    | CustomToolCallInputDoneChunk
    | CodeInterpreterCallCodeDoneChunk
    | ToolCallStatusChunk
    | ImageGenerationPartialImageChunk
    | ResponseErrorChunk;

interface ChunkBase {
    /** Chunks are applied in this order; a chunk without it is applied where it arrives */
    sequence_number?: number;
}

interface ResponseLifecycleChunk extends ChunkBase {
    type: 'response.queued' | 'response.created' | 'response.in_progress' | 'response.completed' | 'response.failed' | 'response.incomplete';
    response: Response;
}

interface OutputItemChunk extends ChunkBase {
    type: 'response.output_item.added' | 'response.output_item.done';
    output_index: number;
    item: ContentItem;
}

interface ContentPartChunk extends ChunkBase {
    type: 'response.content_part.added' | 'response.content_part.done';
    output_index: number;
    content_index: number;
    part: OutputText | Refusal;
}

interface ContentDeltaChunk extends ChunkBase {
    type: 'response.output_text.delta' | 'response.refusal.delta' | 'response.reasoning_text.delta';
    output_index: number;
    content_index: number;
    delta: string;
}

interface ContentTextDoneChunk extends ChunkBase {
    type: 'response.output_text.done' | 'response.reasoning_text.done';
    output_index: number;
    content_index: number;
    text: string;
}

interface RefusalDoneChunk extends ChunkBase {
    type: 'response.refusal.done';
    output_index: number;
    content_index: number;
    refusal: string;
}

interface AnnotationAddedChunk extends ChunkBase {
    type: 'response.output_text.annotation.added';
    output_index: number;
    content_index: number;
    annotation_index: number;
    annotation: Annotation;
}

interface ReasoningSummaryPartChunk extends ChunkBase {
    type: 'response.reasoning_summary_part.added' | 'response.reasoning_summary_part.done';
    output_index: number;
    summary_index: number;
    part: ReasoningText;
}

interface ReasoningSummaryDeltaChunk extends ChunkBase {
    type: 'response.reasoning_summary_text.delta';
    output_index: number;
    summary_index: number;
    delta: string;
}

interface ReasoningSummaryDoneChunk extends ChunkBase {
    type: 'response.reasoning_summary_text.done';
    output_index: number;
    summary_index: number;
    text: string;
}

interface ToolInputDeltaChunk extends ChunkBase {
    type: 'response.function_call_arguments.delta' | 'response.custom_tool_call_input.delta' | 'response.mcp_call_arguments.delta' | 'response.code_interpreter_call_code.delta';
    output_index: number;
    delta: string;
}

interface FunctionCallArgumentsDoneChunk extends ChunkBase {
    type: 'response.function_call_arguments.done';
    output_index: number;
    arguments: string;
    name?: string;
}

interface MCPCallArgumentsDoneChunk extends ChunkBase {
    type: 'response.mcp_call_arguments.done';
    output_index: number;
    arguments: string;
}

interface CustomToolCallInputDoneChunk extends ChunkBase {
    type: 'response.custom_tool_call_input.done';
    output_index: number;
    input: string;
}

interface CodeInterpreterCallCodeDoneChunk extends ChunkBase {
    type: 'response.code_interpreter_call_code.done';
    output_index: number;
    code: string;
}

interface ToolCallStatusChunk extends ChunkBase {
    type:
        | 'response.file_search_call.in_progress'
        | 'response.file_search_call.completed'
        | 'response.web_search_call.in_progress'
        | 'response.web_search_call.completed'
        | 'response.image_generation_call.in_progress'
        | 'response.image_generation_call.completed'
        | 'response.code_interpreter_call.in_progress'
        | 'response.code_interpreter_call.completed'
        | 'response.mcp_call.in_progress'
        | 'response.mcp_call.completed'
        | 'response.mcp_call.failed'
        | 'response.mcp_list_tools.in_progress'
        | 'response.mcp_list_tools.completed'
        | 'response.mcp_list_tools.failed';
    output_index: number;
}

interface ImageGenerationPartialImageChunk extends ChunkBase {
    type: 'response.image_generation_call.partial_image';
    output_index: number;
    partial_image_b64: string;
}

interface ResponseErrorChunk extends ChunkBase {
    type: 'error';
    code?: string;
    message: string;
}

interface ReasoningText {
    text?: string;
    type?: string;
}

export interface CodeInterpreterCall {
    code?: string;
    status?: string;
    outputs?: {
        logs?: string;
        url?: string;
        type?: string;
    }[];
    id?: string;
    container_id?: string;
    type?: string;
}

export interface ImageGenerationCall {
    id?: string;
    result?: string;
    status?: string;
    type?: string;
}

export interface ChatCompletionInput {
    messages?: ChatCompletionInputMessage[];
    model?: string;
    audio?: {
        format: string;
        voice: string;
    };
    function_call?: string | { name: string };
    functions?: { name: string; description: string }[];
    n?: number;
    modalities?: string[];
    [x: string]: any;
}

export type ChatCompletionInputMessage = DeveloperMessage | SystemMessage | UserMessage | AssistantMessage | ToolMessage | FunctionMessage;

interface CommonInputItem {
    role?: string;
    name?: string;
}

interface DeveloperMessage extends CommonInputItem {
    content?: string | { type: string; text: string }[];
}

interface SystemMessage extends CommonInputItem {
    content?: string | any[];
}

export interface UserMessage extends CommonInputItem {
    content?: string | (ImageContentPart | AudioContentPart | FileContentPart | TextInput)[];
}

export interface TextInput {
    text?: string;
    type?: string;
}

export interface ImageContentPart {
    image_url?: {
        url?: string;
        detail?: string;
    };
    type?: string;
}

export interface AudioContentPart {
    input_audio?: {
        data?: string;
        format?: string;
    };
    type?: string;
}

export interface FileContentPart {
    file?: {
        file_data?: string;
        file_id?: string;
        filename?: string;
    };
    type?: string;
}

interface AssistantMessage extends CommonInputItem {
    audio?: { id: string };
    content?: string | (OutputText | Refusal)[];
    function_call?: { name: string; arguments: string };
    name?: string;
    refusal?: string;
    tool_calls?: (ChatCompletionToolCall | ChatCompletionCustomToolCall)[];
}

interface ToolMessage extends CommonInputItem {
    content?: string | any[];
}

interface FunctionMessage extends CommonInputItem {
    content?: string;
}

export interface StreamingResponseState {
    processedSeq: Set<number>;
    outputs: Map<number, ContentItem | null>;
    meta: {
        id?: string;
        model?: string;
        status?: string;
        created_at?: number;
    };
    error?: ResponseError;
    buffer: Map<number, ResponseChunk>;
    lastProcessedSeq: number;
    // Chunks without sequence_number that were already applied, matched by object identity
    processedUnsequenced?: Set<ResponseChunk>;
}
