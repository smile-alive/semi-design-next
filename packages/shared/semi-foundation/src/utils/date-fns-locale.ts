import type { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { zhCN } from 'date-fns/locale/zh-CN';

// shortcut: only zh-CN (Semi's default) and en-US (date-fns' default, bundled by date-fns anyway) are built in, so other
// languages' date data stays out of the bundle and they pass ConfigProvider's `dateFnsLocale`; add an entry only if a
// language must work without it.
const builtIn: Record<string, Locale> = { 'zh-CN': zhCN, 'en-US': enUS };

/**
 * The date-fns locale of DatePicker, TimePicker and Calendar: ConfigProvider's `dateFnsLocale`, else the built-in match
 * for the Semi locale code, else enUS (date-fns' own default). Synchronous so that server and client render alike.
 */
export function getDateFnsLocale(code: string, override?: Locale) {
    return override ?? builtIn[code] ?? enUS;
}
