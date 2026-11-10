<script lang="ts" module>
    export interface SchemaFixtureStore {
        formProps?: Record<string, unknown>;
        fieldProps?: Record<string, unknown>;
        asForm?: boolean;
    }
</script>

<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';
    import SchemaField from '../schema-form/schema-field.svelte';
    import SchemaForm from '../schema-form/schema-form.svelte';

    let { store, onApi }: { store: SchemaFixtureStore; onApi?: (api: FormApi) => void } = $props();
</script>

<LocaleProvider locale={en_US}>
    {#if store.asForm}
        <SchemaForm {...store.formProps} {...store.fieldProps} getFormApi={onApi}>
            <button type="submit">submit</button>
        </SchemaForm>
    {:else}
        <Form {...store.formProps} getFormApi={onApi}>
            <SchemaField {...store.fieldProps} />
        </Form>
    {/if}
</LocaleProvider>
