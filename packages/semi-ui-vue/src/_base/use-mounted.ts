import { type ShallowRef, onMounted, shallowRef } from 'vue';

/** `false` on the server and during hydration, `true` once the component is mounted; gates what only the browser can render */
export default function useMounted(): Readonly<ShallowRef<boolean>> {
    const mounted = shallowRef(false);

    onMounted(() => {
        mounted.value = true;
    });

    return mounted;
}
