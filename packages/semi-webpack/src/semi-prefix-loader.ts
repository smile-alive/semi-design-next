import type { LoaderContext } from 'webpack';
import { replaceVariableValues } from '@fibrae/semi-theme-shared';

interface SemiPrefixLoaderOptions {
    replacers: Record<string, string>;
}

export default function semiPrefixLoader(this: LoaderContext<SemiPrefixLoaderOptions>, source: string) {
    return replaceVariableValues(source, this.getOptions().replacers);
}
