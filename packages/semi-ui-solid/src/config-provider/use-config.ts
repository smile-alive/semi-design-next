import { useConfigContext } from './context';

/** The enclosing ConfigProvider's resolved configuration; `{}` outside any provider */
export default function useConfig() {
    return useConfigContext();
}
