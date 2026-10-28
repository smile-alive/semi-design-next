import { VueNodeViewRenderer } from '@tiptap/vue-3';
import { ImageUploadNode as ImageUploadSchema } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
import ImageSlotView from './image-slot-view.vue';
import type { ImageUploadNodeOptions } from './interface';

/** The image upload slot FileItem's image button inserts; its options are FileItem's imgUploadProps */
export const ImageUploadNode = ImageUploadSchema.extend<ImageUploadNodeOptions & { type: string }>({
    addNodeView() {
        return VueNodeViewRenderer(ImageSlotView);
    },
});
