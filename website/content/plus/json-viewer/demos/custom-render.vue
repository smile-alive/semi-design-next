<script setup lang="ts">
    import { Image, JsonViewer, Popover, Rating, Tag, type JsonViewerOptions } from '@fibrae/semi-ui-vue';

    const data = `{
  "name": "Semi",
  "version": "2.7.4",
  "rating": 5,
  "tags": ["design", "react", "ui"],
  "image": "/assets/root-web-sites/abstract.jpg"
}`;

    // A rule holds data only; the #customRender slot draws the token and tells the rules apart by name
    const options: JsonViewerOptions = {
        formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' },
        customRenderRule: [
            { name: 'popover', match: 'Semi' },
            { name: 'rating', match: (value) => value == 5 },
            {
                name: 'tag',
                match: (_value, path) => path === 'root.tags[0]' || path === 'root.tags[1]' || path === 'root.tags[2]',
            },
            { name: 'image', match: /^http/ },
        ],
        readOnly: true,
        autoWrap: true,
    };

    // content is the raw string token with its quotes; without them it is a valid URL
    const unquote = (content: string) => content.replace(/^"|"$/g, '');
</script>

<template>
    <div>
        <div :style="{ marginBottom: '16px', marginTop: '16px' }">
            <JsonViewer :height="200" :modelValue="data" :options="options" :showSearch="false" :width="600">
                <template #customRender="{ item, content }">
                    <Popover v-if="item.name === 'popover'" showArrow trigger="hover">
                        <span>{{ content }}</span>
                        <template #content>我是用户自定义的渲染</template>
                    </Popover>
                    <Rating v-else-if="item.name === 'rating'" :defaultValue="Number(content)" disabled :size="10" />
                    <Tag v-else-if="item.name === 'tag'" shape="circle" size="small">{{ content }}</Tag>
                    <Popover v-else showArrow trigger="hover">
                        <span>{{ content }}</span>
                        <template #content>
                            <Image :height="100" :src="unquote(content)" :width="100" />
                        </template>
                    </Popover>
                </template>
            </JsonViewer>
        </div>
    </div>
</template>
