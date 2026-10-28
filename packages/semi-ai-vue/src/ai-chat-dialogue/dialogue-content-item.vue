<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { ContentItem, CustomToolCall, FunctionToolCall, InputFile, InputImage, InputMessage, Message, OutputMessage, OutputText, Reasoning, Refusal } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getAttachmentLayout, getVisibleAnnotations, isImageList } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-content';
    import { IconWrench } from '@fibrae/semi-icons-vue';
    import slotNodes, { isSlotContent } from '@fibrae/semi-ui-vue/_base/slot-nodes';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Image from '@fibrae/semi-ui-vue/image/index';
    import { useAIChatDialogueContext } from './context';
    import DialogueFile from './dialogue-file.vue';
    import DialogueMarkdown from './dialogue-markdown.vue';
    import type { AIChatDialogueSlots, MessageInnerItem } from './interface';
    import AnnotationWidget from './widgets/content-item/annotation.vue';
    import ReasoningWidget from './widgets/content-item/reasoning.vue';

    // the template recurses by name; without it a consumer-registered component of the same name takes over the recursion
    defineOptions({ name: 'DialogueContentItem' });

    const props = defineProps<{
        item: ContentItem | MessageInnerItem;
        message: Message;
        index: number;
        parent?: InputMessage | OutputMessage;
    }>();

    const slots = defineSlots<Pick<AIChatDialogueSlots, 'contentItem'>>();

    const { view, annotationClick, imageClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const { MESSAGE_ITEM_TYPE, TEXT_TYPES } = strings;
    const type = computed(() => (props.parent ? props.item?.type : (props.item?.type ?? MESSAGE_ITEM_TYPE.MESSAGE)));
    const siblings = computed(() => (props.parent?.content ?? []) as MessageInnerItem[]);
    const layout = computed(() => getAttachmentLayout(siblings.value, props.index));
    const imageList = computed(() => isImageList(siblings.value));
    const citations = computed(() => getVisibleAnnotations(props.item as OutputText));
    const text = computed(() => (props.item as OutputText).text ?? '');
    const refusal = computed(() => (props.item as Refusal).refusal ?? '');
    const image = computed(() => props.item as InputImage);
    const messageItem = computed(() => props.item as InputMessage | OutputMessage);
    const reasoning = computed(() => props.item as Reasoning);
    const toolCall = computed(() => props.item as FunctionToolCall & CustomToolCall);

    // slots are not reactive, so the slot runs while rendering
    const customNodes = () => {
        const nodes = slotNodes(
            slots.contentItem?.({
                item: props.item,
                type: type.value,
                message: props.message,
                index: props.index,
                parent: props.parent,
            }) ?? []
        );
        return nodes.some(isSlotContent) ? nodes : undefined;
    };
</script>

<template>
    <template v-for="custom in [customNodes()]" :key="String(Boolean(custom))">
        <div v-if="custom" :class="`${PREFIX_CONTENT}-custom-renderer`">
            <component :is="node" v-for="[node, key] in custom" :key="key" />
        </div>
        <template v-else-if="props.parent">
            <template v-if="type !== undefined && TEXT_TYPES.includes(type)">
                <AnnotationWidget v-if="citations.length > 0" :annotation="citations" :maxCount="15" @click="annotationClick(citations)" />
                <DialogueMarkdown v-if="text !== ''" :message="props.message" :text="text" />
                <DialogueMarkdown v-if="refusal !== ''" :message="props.message" :text="refusal" />
            </template>
            <template v-else-if="type === MESSAGE_ITEM_TYPE.INPUT_IMAGE">
                <Image
                    :alt="locale.locale.image"
                    :class="[
                        `${PREFIX_CONTENT}-img`,
                        {
                            [`${PREFIX_CONTENT}-img-list`]: imageList,
                            [`${PREFIX_CONTENT}-img-last`]: layout.isLast,
                        },
                    ]"
                    :src="image.image_url"
                    @click="imageClick(image)"
                />
                <br v-if="layout.breakAfter" />
            </template>
            <template v-else-if="type === MESSAGE_ITEM_TYPE.INPUT_FILE">
                <DialogueFile :file="props.item as InputFile" :isLastFile="layout.isLast" :role="props.message.role" />
                <br v-if="layout.breakAfter" />
            </template>
        </template>
        <template v-else-if="type === MESSAGE_ITEM_TYPE.MESSAGE">
            <template v-if="typeof messageItem.content === 'string'">
                <DialogueMarkdown v-if="messageItem.content !== ''" :message="props.message" :text="messageItem.content" />
            </template>
            <template v-else>
                <DialogueContentItem v-for="(inner, innerIndex) in messageItem.content ?? []" :key="innerIndex" :index="innerIndex" :item="inner" :message="props.message" :parent="messageItem">
                    <template v-if="$slots.contentItem" #contentItem="slotProps">
                        <slot name="contentItem" v-bind="slotProps" />
                    </template>
                </DialogueContentItem>
            </template>
        </template>
        <ReasoningWidget v-else-if="type === MESSAGE_ITEM_TYPE.REASONING" :content="reasoning.content" :markdownRenderProps="view.markdownRenderProps" :status="reasoning.status" :summary="reasoning.summary" />
        <div v-else-if="type === MESSAGE_ITEM_TYPE.FUNCTION_CALL || type === MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL" :class="`${PREFIX_CONTENT}-tool-call`"><IconWrench />{{ toolCall.name }} {{ toolCall.arguments ?? toolCall.input }}</div>
    </template>
</template>
