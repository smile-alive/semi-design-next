<script setup lang="ts">
    import { reactive } from 'vue';
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-vue';
    import { Button, Empty, Feedback, TextArea } from '@fibrae/semi-ui-vue';

    const createState = () => reactive({ visible: false, value: '', showThanks: false });
    const popup = createState();
    const modal = createState();
    const emptyStyle = { padding: '30px' };
    const imageStyle = { width: '150px', height: '150px' };

    // The thanks view stays 200ms past the close so the exit animation still shows it.
    const handleOk = (state: ReturnType<typeof createState>) => {
        state.showThanks = true;
        setTimeout(() => {
            state.visible = false;
            setTimeout(() => {
                state.showThanks = false;
            }, 200);
        }, 1500);
    };
</script>

<template>
    <div>
        <Button @click="popup.visible = !popup.visible">Open Feedback: Popup, Custom</Button>
        <Feedback v-model:visible="popup.visible" :okButtonProps="{ disabled: !popup.value }" :title="popup.showThanks ? ' ' : 'What is your feedback on this product?'" type="custom" @ok="handleOk(popup)">
            <template v-if="popup.showThanks" #footer />
            <Empty v-if="popup.showThanks" :style="emptyStyle">
                <template #image>
                    <IllustrationSuccess :style="imageStyle" />
                </template>
                <template #darkModeImage>
                    <IllustrationSuccessDark :style="imageStyle" />
                </template>
                <template #description>感谢您的反馈</template>
            </Empty>
            <template v-else>
                <span>这是一段自定义的内容</span>
                <TextArea v-model="popup.value" />
            </template>
        </Feedback>
        <br />
        <br />
        <Button @click="modal.visible = !modal.visible">Open Feedback: Modal, Custom</Button>
        <Feedback v-model:visible="modal.visible" mode="modal" :okButtonProps="{ disabled: !modal.value }" :title="modal.showThanks ? ' ' : 'What is your feedback on this product?'" type="custom" @ok="handleOk(modal)">
            <template v-if="modal.showThanks" #footer />
            <Empty v-if="modal.showThanks" :style="emptyStyle">
                <template #image>
                    <IllustrationSuccess :style="imageStyle" />
                </template>
                <template #darkModeImage>
                    <IllustrationSuccessDark :style="imageStyle" />
                </template>
                <template #description>感谢您的反馈</template>
            </Empty>
            <template v-else>
                <span>这是一段自定义的内容</span>
                <TextArea v-model="modal.value" />
            </template>
        </Feedback>
    </div>
</template>
