<script setup lang="ts">
    import { ref } from 'vue';
    import Button from '../../../button';
    import Modal from '../../modal.vue';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ noFooter?: boolean } & /* @vue-ignore */ InstanceType<typeof Modal>['$props']>(), { noFooter: false });
    const visible = ref(false);
</script>

<template>
    <Button @click="visible = true">Open Modal</Button>
    <!-- No motion, so the measured height is not a frame of the opening animation -->
    <Modal v-bind="$attrs" v-model:visible="visible" :motion="false" title="Modal">
        <slot>
            <p>This is the content of a basic modal.</p>
            <p>Here is more content...</p>
        </slot>
        <template v-if="props.noFooter" #footer />
    </Modal>
</template>
