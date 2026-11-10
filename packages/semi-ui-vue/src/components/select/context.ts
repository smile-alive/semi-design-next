import { createContext } from '../../base/index';

// AutoComplete renders its rows with SelectOption under its own class prefix. Select resets it for its subtree so a
// Select inside an AutoComplete slot keeps the default prefix.
export const [provideOptionPrefixContext, useOptionPrefixContext] = createContext<string | undefined>('OptionPrefix', { optional: true });
