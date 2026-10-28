import { onBeforeUpdate, shallowRef, type Ref } from 'vue';

/**
 * Changes when the component receives a different slot function, for computeds that read slots. Such a computed
 * tracks what the slot content reads, but a parent re-rendering with a new slot closure (h() children built from a
 * plain array) passes content that reads nothing reactive. Vue assigns the new slots before beforeUpdate runs, so
 * comparing there separates a new slot from an update of the component's own state, which must not re-read them.
 * Known limit: a slot function that keeps its identity and reads non-reactive data is not re-read on an unrelated
 * re-render; callers pass reactive data or a new slot function.
 */
export default function useSlotVersion(slots: object): Readonly<Ref<number>> {
    const version = shallowRef(0);
    let previous = Object.entries(slots);

    onBeforeUpdate(() => {
        const current = Object.entries(slots);
        if (current.length !== previous.length || current.some(([name, slot], index) => previous[index][0] !== name || previous[index][1] !== slot)) {
            version.value++;
        }
        previous = current;
    });

    return version;
}
