<script setup lang="ts">
    import { IconAIBellLevel1, IconAIEditLevel1, IconAIEditLevel2, IconAIFileLevel3, IconAIFilledLevel1, IconAIFilledLevel3, IconAIImageLevel3, IconAILoading, IconAISearchLevel3, IconAIStrokedLevel3, IconAIWandLevel3 } from '@fibrae/semi-icons-vue';
    import { Button, FloatButton, Tag, TypographyTitle } from '@fibrae/semi-ui-vue';

    const wandFill = ['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)'];
    const colorStyle = (color: string) => ({
        width: '40px',
        height: '40px',
        background: color,
        borderRadius: '50%',
    });
</script>

<template>
    <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '20px' }">
        <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '10px' }">
            <TypographyTitle :heading="5">AI Token</TypographyTitle>
            <div :style="{ display: 'flex', alignItems: 'center', columnGap: '10px' }">
                <span>Purple</span>
                <div :style="{ display: 'inline-flex', columnGap: '4px' }">
                    <div v-for="index in 10" :key="index" :style="colorStyle(`var(--semi-ai-purple-${index - 1})`)" />
                </div>
            </div>
            <div :style="{ display: 'flex', alignItems: 'center', columnGap: '10px' }">
                <span>General</span>
                <div :style="{ display: 'inline-flex', columnGap: '4px' }">
                    <div v-for="index in 10" :key="index" :style="colorStyle(`var(--semi-ai-general-${index - 1})`)" />
                </div>
            </div>
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '10px' }">
            <TypographyTitle :heading="5">AI Icon</TypographyTitle>
            <div :style="{ display: 'flex', columnGap: '10px' }">
                <IconAIBellLevel1 size="extra-large" />
                <IconAIEditLevel2 size="extra-large" />
                <IconAIFileLevel3 size="extra-large" />
                <IconAIFilledLevel3 size="extra-large" />
                <IconAIImageLevel3 size="extra-large" />
                <IconAISearchLevel3 size="extra-large" />
                <IconAIStrokedLevel3 size="extra-large" />
                <IconAIWandLevel3 :fill="wandFill" size="extra-large" />
                <IconAILoading size="extra-large" />
            </div>
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '10px' }">
            <TypographyTitle :heading="5">AI Button</TypographyTitle>
            <div :style="{ display: 'flex', rowGap: '16px', flexDirection: 'column' }">
                <div :style="{ display: 'flex', columnGap: '16px' }">
                    <Button colorful theme="solid" type="primary">
                        <template #icon>
                            <IconAIFilledLevel1 />
                        </template>
                        Colorful
                    </Button>
                    <Button colorful loading theme="solid" type="primary">Colorful</Button>
                    <Button colorful disabled theme="solid" type="primary">
                        <template #icon>
                            <IconAIFilledLevel1 />
                        </template>
                        Colorful
                    </Button>
                </div>
                <div :style="{ display: 'flex', columnGap: '16px' }">
                    <Button colorful theme="solid" type="tertiary">
                        <template #icon>
                            <IconAIFilledLevel3 />
                        </template>
                        Colorful
                    </Button>
                    <Button colorful loading theme="solid" type="tertiary">Colorful</Button>
                    <Button colorful disabled theme="solid" type="tertiary">
                        <template #icon>
                            <IconAIFilledLevel3 />
                        </template>
                        Colorful
                    </Button>
                </div>
                <div :style="{ display: 'flex', columnGap: '16px' }">
                    <Button aria-label="AI" colorful theme="solid" type="primary">
                        <template #icon>
                            <IconAIFilledLevel1 />
                        </template>
                    </Button>
                    <Button aria-label="AI" colorful loading theme="solid" type="primary" />
                    <Button aria-label="AI" colorful disabled theme="solid" type="primary">
                        <template #icon>
                            <IconAIFilledLevel1 />
                        </template>
                    </Button>
                    <Button aria-label="AI" colorful theme="solid" type="tertiary">
                        <template #icon>
                            <IconAIFilledLevel3 />
                        </template>
                    </Button>
                    <Button aria-label="AI" colorful loading theme="solid" type="tertiary" />
                    <Button aria-label="AI" colorful disabled theme="solid" type="tertiary">
                        <template #icon>
                            <IconAIFilledLevel3 />
                        </template>
                    </Button>
                </div>
            </div>
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '10px' }">
            <TypographyTitle :heading="5" :style="{ marginTop: '10px' }">AI Tag</TypographyTitle>
            <div
                :style="{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gridGap: '10px',
                    width: 'fit-content',
                }"
            >
                <Tag colorful gradient shape="circle" type="solid">
                    <template #prefixIcon>
                        <IconAIFilledLevel1 size="small" />
                    </template>
                    AI
                </Tag>
                <Tag colorful gradient shape="circle" type="light">
                    <template #prefixIcon>
                        <IconAIFilledLevel3 size="small" />
                    </template>
                    AI
                </Tag>
                <Tag colorful gradient shape="circle" type="ghost">
                    <template #prefixIcon>
                        <IconAIFilledLevel3 size="small" />
                    </template>
                    AI
                </Tag>
                <Tag colorful shape="circle" type="solid">
                    <template #prefixIcon>
                        <IconAIFilledLevel1 size="small" />
                    </template>
                    AI
                </Tag>
                <Tag colorful shape="circle" type="light">
                    <template #prefixIcon>
                        <IconAIFilledLevel1 size="small" />
                    </template>
                    AI
                </Tag>
                <Tag colorful shape="circle" type="ghost">
                    <template #prefixIcon>
                        <IconAIFilledLevel1 size="small" />
                    </template>
                    AI
                </Tag>
            </div>
        </div>
        <div :style="{ display: 'flex', flexDirection: 'column', rowGap: '10px' }">
            <TypographyTitle :heading="5" :style="{ marginTop: '10px' }">AI FloatButton</TypographyTitle>
            <div
                :style="{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gridGap: '10px',
                    width: 'fit-content',
                }"
            >
                <FloatButton aria-label="AI edit, VIP" :badge="{ count: 'VIP', type: 'danger' }" colorful size="large" :style="{ position: 'static' }">
                    <template #icon>
                        <IconAIEditLevel1 />
                    </template>
                </FloatButton>
            </div>
        </div>
    </div>
</template>
