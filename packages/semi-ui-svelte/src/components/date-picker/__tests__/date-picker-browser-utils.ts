import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { tabTo } from '@test/utils/browser';
import { dp, getInput } from './test-utils';

// Tab out of the picker closes the panel, so the keyboard enters a shown panel by ArrowDown on its trigger
export async function tabIntoPanel(target: Element, trigger: Element = getInput()) {
    await tabTo(trigger);
    await userEvent.keyboard('{ArrowDown}');
    await tabTo(target);
}

export const focusClass = `${BASE_CLASS_PREFIX}-input-wrapper-focus`;

export const getPopupInputs = () => Array.from(document.querySelectorAll<HTMLInputElement>(`.${dp}[x-type] input`));
export const getPopupInputWrappers = () => document.querySelectorAll(`.${dp}[x-type] .${BASE_CLASS_PREFIX}-input-wrapper`);
export const getNavTitles = () => Array.from(document.querySelectorAll(`.${dp}-navigation-month`)).map((element) => element.textContent?.trim());
