<script setup lang="ts">
    import { ref } from 'vue';
    import { IconSemiLogo, IconVigoLogo } from '@fibrae/semi-icons-vue';
    import { Button, List, Modal } from '@fibrae/semi-ui-vue';

    const visible = ref(false);
    const data = [
        {
            icon: IconSemiLogo,
            title: 'Boost new feature adoption with Integration',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
        {
            icon: IconVigoLogo,
            title: 'Introducing Dark Mode',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
        {
            icon: IconSemiLogo,
            title: 'New List Component',
            content: 'Sample data is prepared for you to demonstrate how Integration may be useful for your team',
        },
    ];
    const btnStyle = {
        width: '240px',
        margin: '4px 50px',
    };
</script>

<template>
    <Button @click="visible = true">自定义对话框</Button>
    <Modal v-model:visible="visible">
        <template #header />
        <h3 :style="{ textAlign: 'center', fontSize: '24px', margin: '40px' }">Semi Design New Features</h3>
        <List :dataSource="data" :split="false">
            <template #item="{ item }">
                <List.Item>
                    <template #header>
                        <component :is="item.icon" :style="{ fontSize: '48px' }" />
                    </template>
                    <template #main>
                        <div>
                            <h6 :style="{ margin: 0, fontSize: '16px' }">{{ item.title }}</h6>
                            <p :style="{ marginTop: '4px', color: 'var(--semi-color-text-1)' }">{{ item.content }}</p>
                        </div>
                    </template>
                </List.Item>
            </template>
        </List>
        <template #footer>
            <div :style="{ textAlign: 'center' }">
                <Button :style="btnStyle" theme="solid" type="primary" @click="visible = false">Continue</Button>
                <Button :style="btnStyle" theme="borderless" type="primary" @click="visible = false"> Learn more features </Button>
            </div>
        </template>
    </Modal>
</template>
