import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { dp } from './test-utils';

export const focusClass = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

/** The inset inputs inside the panel, in DOM order */
export const getPopupInputs = () => Array.from(document.querySelectorAll<HTMLInputElement>(`.${dp}[x-type] input`));
export const getPopupInputWrappers = () => document.querySelectorAll(`.${dp}[x-type] .${BASE_CLASS_PREFIX}-input-wrapper`);
export const getNavTitles = () => Array.from(document.querySelectorAll(`.${dp}-navigation-month`)).map((element) => element.textContent?.trim());
