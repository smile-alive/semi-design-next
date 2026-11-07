import type { Slot } from 'vue';

// Vue SSR: a slot handed on in a new object is normalized again, and a conditional slot, which createSlots leaves
// without the normalized mark, then loses what it pushed into the SSR buffer; called with its props only, it returns
// vnodes instead. Remove once Vue releases the fix from https://github.com/vuejs/core/pull/16160
export function handOn(slot?: Slot): Slot | undefined {
    return slot && ((props) => slot(props));
}

/** Takes `object` because a component's slots interface has no index signature */
export function handOnSlots(slots: object): Record<string, Slot | undefined> {
    return Object.fromEntries(Object.entries(slots as Record<string, Slot | undefined>).map(([name, slot]) => [name, handOn(slot)]));
}
