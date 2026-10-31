<script lang="ts" generics="C extends Component<any, any, any>">
    import { type Component, untrack } from 'svelte';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import { getFormContext } from './context.js';
    import FieldInner from './field-inner.svelte';
    import type { FormFieldProps } from './interface.js';
    import { omitFieldProps } from './utils.js';

    let props: FormFieldProps<C> = $props();

    let bareControl = $state.raw<Record<string, any>>();
    let inner = $state.raw<{ getControl: () => Record<string, any> | undefined }>();

    const inForm = Boolean(getFormContext());
    const shouldInject = $derived(props.fieldOptions?.shouldInject ?? true);

    // A declared `field` always injects (a Checkbox or Radio used outside its group); otherwise the options decide
    const bare = $derived(props.field === undefined && !shouldInject);
    const Control = $derived(props.component as Component<Record<string, any>>);

    const bareProps = $derived.by(() => {
        const { component: _component, fieldOptions: _fieldOptions, ...rest } = props as Record<string, unknown>;
        return omitFieldProps(rest);
    });

    untrack(() => {
        warning(props.field === undefined && shouldInject, "[Semi Form]: 'field' is required, please check your props of Field Component");
        warning(!bare && !inForm, '[Semi Form]: Field Component must be use inside the Form, please check your dom declaration');
    });

    // The wrapped control's instance, for calling its own methods (focus, open ...)
    export function getControl() {
        return bareControl ?? inner?.getControl();
    }
</script>

{#if bare}
    <Control {...bareProps} bind:this={bareControl} />
{:else if inForm}
    <FieldInner {...props} bind:this={inner} />
{/if}
