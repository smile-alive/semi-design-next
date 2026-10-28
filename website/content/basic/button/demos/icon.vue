<script setup lang="ts">
    import { IconCamera, IconChevronDown, IconSidebar } from '@fibrae/semi-icons-vue';
    import { Button } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <strong>默认状态：</strong>
        <Button aria-label="截屏">
            <template #icon>
                <IconCamera />
            </template>
        </Button>
        <br />
        <br />
        <strong>禁用状态：</strong>
        <Button aria-label="截屏" disabled>
            <template #icon>
                <IconCamera />
            </template>
        </Button>
        <br />
        <br />
        <strong>复合类型：</strong>
        <span class="btn-margin-right">
            <Button aria-label="截屏" type="primary">
                <template #icon>
                    <IconCamera />
                </template>
            </Button>
            <Button aria-label="截屏" type="secondary">
                <template #icon>
                    <IconCamera />
                </template>
            </Button>
            <Button aria-label="截屏" type="warning">
                <template #icon>
                    <IconCamera />
                </template>
            </Button>
            <Button aria-label="截屏" type="danger">
                <template #icon>
                    <IconCamera />
                </template>
            </Button>
        </span>
        <br />
        <br />
        <strong>更改主题：</strong>
        <Button aria-label="截屏" :style="{ marginRight: '10px' }" theme="solid">
            <template #icon>
                <IconCamera />
            </template>
        </Button>
        <Button aria-label="截屏" theme="light">
            <template #icon>
                <IconCamera />
            </template>
        </Button>
        <br />
        <br />
        <strong>更改图标位置：</strong>
        <Button :style="{ marginRight: '10px' }" theme="solid">
            <template #icon>
                <IconSidebar />
            </template>
            收起
        </Button>
        <Button iconPosition="right" theme="solid">
            <template #icon>
                <IconChevronDown />
            </template>
            展开选项
        </Button>
        <br />
        <br />
    </div>
</template>
