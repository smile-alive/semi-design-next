import { computed } from 'vue';
import { resolveButtonLooks } from '@fibrae/semi-foundation/button/utils';
import { usePopupLayer } from '../_base/popup-layer';
import { useSemiGlobal } from '../_base/semi-default';
import type { SemiGlobal } from '../_utils/semi-global';
import { type ButtonGroupContext, useButtonGroupContext } from './context';
import type { Size, Theme, Type } from './interface';

// Boolean shorthand reaches vnode props as ''.
const flag = (value: unknown) => (value === '' ? true : (value as boolean | undefined));

// Pure so ButtonGroup can resolve the looks of a slot vnode exactly as the Button resolves itself.
export function resolveLooks(own: Record<string, unknown>, group: ButtonGroupContext | undefined, semi: SemiGlobal, name: 'Button' | 'IconButton') {
    const normalized = {
        disabled: flag(own.disabled),
        size: own.size as Size | undefined,
        type: own.type as Type | undefined,
        theme: own.theme as Theme | undefined,
        colorful: flag(own.colorful),
    };
    return resolveButtonLooks(normalized, group, semi.config.overrideDefaultProps?.[name] ?? {});
}

export default function useButtonLooks(props: Record<string, unknown>, name: 'Button' | 'IconButton') {
    const group = useButtonGroupContext();
    const layer = usePopupLayer();
    const semi = useSemiGlobal();

    return computed(() => resolveLooks(props, group && group.value.layer === layer ? group.value : undefined, semi, name));
}
