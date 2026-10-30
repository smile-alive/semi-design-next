<script lang="ts">
    import type { UploadProps } from '../upload/interface.js';
    import Upload from '../upload/upload.svelte';
    import Field from './field.svelte';
    import type { FieldProps, WithFieldOption } from './interface.js';

    let props: FieldProps<UploadProps> = $props();

    // Upload reports `{ fileList, ... }`, so the value is read from it; it has no blur callback
    const fieldOptions: WithFieldOption = { valueKey: 'fileList', valuePath: 'fileList', onBlurFnName: '', insetLabel: false };
</script>

<Field {...props} component={Upload} {fieldOptions} />
