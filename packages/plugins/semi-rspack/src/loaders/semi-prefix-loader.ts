import type { LoaderContext } from '@rspack/core';
import { replaceVariableValues } from '@fibrae/semi-scss-compile/core';

export interface SemiPrefixLoaderOptions {
    replacers?: Record<string, string>;
}

export default function semiPrefixLoader(this: LoaderContext<SemiPrefixLoaderOptions>, source: string) {
    return replaceVariableValues(source, this.getOptions().replacers);
}
