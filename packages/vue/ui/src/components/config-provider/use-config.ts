import { computed } from 'vue';
import { useConfigContext } from './context';
import type { ContextValue } from './interface';

export default function useConfig() {
    return useConfigContext() ?? computed<ContextValue>(() => ({}));
}
