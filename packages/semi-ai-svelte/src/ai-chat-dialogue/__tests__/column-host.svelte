<script lang="ts" module>
    import type { Message, RoleConfig } from '../interface';

    export interface ColumnHostStore {
        chats: Message[];
        height: number;
        roleConfig: RoleConfig;
    }
</script>

<script lang="ts">
    import { AIChatDialogue } from '../../index';

    let { store }: { store: ColumnHostStore } = $props();
</script>

<div style:display="flex" style:flex-direction="column" style:height="{store.height}px">
    <AIChatDialogue chats={store.chats} roleConfig={store.roleConfig} />
</div>
