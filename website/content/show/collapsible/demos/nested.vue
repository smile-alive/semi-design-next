<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Collapsible } from '@fibrae/semi-ui-vue';

    const isOpen = ref(false);
    const isChildOpen = ref(false);
</script>

<template>
    <div>
        <Button aria-controls="collapsible-nested" :aria-expanded="isOpen" @click="isOpen = !isOpen">Toggle</Button>
        <br />
        <Collapsible id="collapsible-nested" :isOpen="isOpen">
            <div>
                <span>Semi Design的设计原则包括：</span>
                <Button aria-controls="collapsible-nested-list" :aria-expanded="isChildOpen" @click="isChildOpen = !isChildOpen"> Toggle List </Button>
            </div>
            <Collapsible id="collapsible-nested-list" :isOpen="isChildOpen">
                <ul>
                    <li>
                        <p>Semi Design 以内容优先进行设计。</p>
                    </li>
                    <li>
                        <p>更容易地自定义主题。</p>
                    </li>
                    <li>
                        <p>适用国际化场景。</p>
                    </li>
                    <li>
                        <p>效率场景加入人性化关怀。</p>
                    </li>
                </ul>
            </Collapsible>
        </Collapsible>
    </div>
</template>
