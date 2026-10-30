import { computed } from 'vue';
import { useSemiGlobal } from '../_base/semi-default';
import { useInputGroupInScope } from './context';
import type { InputSize } from './interface';

interface GroupLooks {
    size?: InputSize;
    disabled?: boolean;
}

type GroupMember = 'AutoComplete' | 'Cascader' | 'DatePicker' | 'Input' | 'InputNumber' | 'Select' | 'TagInput' | 'TextArea' | 'TimePicker' | 'TreeSelect';

// A key given in `builtin` always resolves to a value, so the result drops `undefined` for it
type ResolvedLooks<B extends GroupLooks> = { readonly [K in 'size' | 'disabled']: K extends keyof B ? NonNullable<GroupLooks[K]> : GroupLooks[K] };

/**
 * Size and disabled resolved as own value -> InputGroup -> global default -> `builtin`; read them from the result
 * instead of `props`. Both props must default to `undefined` in withDefaults: any other default would pass for the
 * control's own value. The getters read a computed, so they stay reactive in templates, computed and watch sources.
 */

export default function useGroupLooks<B extends GroupLooks = Record<never, never>>(name: GroupMember, props: GroupLooks, builtin?: B): ResolvedLooks<B> {
    const semi = useSemiGlobal();

    const group = useInputGroupInScope();

    const resolved = computed<GroupLooks>(() => {
        const global = semi.config.overrideDefaultProps?.[name] as GroupLooks | undefined;
        return {
            size: props.size ?? group?.value.size ?? global?.size ?? builtin?.size,
            disabled: props.disabled ?? group?.value.disabled ?? global?.disabled ?? builtin?.disabled,
        };
    });

    // narrowed: the type only promises a value for the keys `builtin` supplies, which the chain above guarantees
    return {
        get size() {
            return resolved.value.size;
        },
        get disabled() {
            return resolved.value.disabled;
        },
    } as ResolvedLooks<B>;
}
