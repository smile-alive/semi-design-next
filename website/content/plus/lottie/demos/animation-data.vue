<script setup lang="ts">
    import { computed, onMounted, shallowRef } from 'vue';
    import { Lottie } from '@fibrae/semi-ui-vue';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';

    // large animation data is held in a shallowRef so it is not made deeply reactive
    const data = shallowRef<object | string>('');
    // params reloads the animation when it is replaced, so it is derived from the data instead of mutated
    const params = computed(() => ({ animationData: data.value }));

    onMounted(() => {
        void fetch(jsonURL)
            .then((resp) => resp.json())
            .then((json: object) => {
                data.value = json;
            });
    });
</script>

<template>
    <div>
        <Lottie height="300px" :params="params" width="300px" />
    </div>
</template>
