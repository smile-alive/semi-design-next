<script lang="ts" module>
    export interface SchemaFixtureStore {
        formProps?: Record<string, unknown>;
        fieldProps?: Record<string, unknown>;
        asForm?: boolean;
    }
</script>

<script lang="ts">
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';
    import SchemaField from '../schema-field.svelte';
    import SchemaForm from '../schema-form.svelte';

    let { store, onApi }: { store: SchemaFixtureStore; onApi?: (api: FormApi) => void } = $props();
</script>

<LocaleProvider locale={ja_JP}>
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
