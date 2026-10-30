import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { dp, settle, setup } from './test-utils';

/** A real pointer sequence (mousedown, focus, mouseup, click), then the foundation's timers */
export async function click(element: Element) {
    await userEvent.click(element);
    await settle();
}

/** The panel stays open: a setter that rejects every close request pins the controlled `open` at true */
export function setupPinned(init: Parameters<typeof setup>[0] = {}) {
    return setup({ target: 'open', mode: 'function', open: true, accept: false, ...init });
}

export const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
export const getPopups = () => document.querySelectorAll<HTMLElement>(`.${dp}[x-type]`);
export const getPopup = () => getPopups()[0] ?? null;
export const getPanel = (side: string) => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side}`) as HTMLElement;
export const getWeekDays = (side: string, weekIndex: number) => getPanel(side).querySelectorAll(`.${dp}-week`)[weekIndex].querySelectorAll<HTMLElement>(`.${dp}-day`);
export const getPresetButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-quick-control button`);
export const getFooterButtons = () => document.querySelectorAll<HTMLElement>(`.${dp}-footer .${BASE_CLASS_PREFIX}-button`);
/** Year and month scroll lists in DOM order: [year, month] per panel, left first */
export const getYMLists = (root: ParentNode = document) => root.querySelectorAll<HTMLElement>(`.${BASE_CLASS_PREFIX}-scrolllist-item ul`);
export const getYMSelected = (root: ParentNode = document) => Array.from(root.querySelectorAll(`.${BASE_CLASS_PREFIX}-scrolllist-item-sel`)).map((item) => item.textContent);
export const nextSibling = (element: Element, steps: number) => Array.from({ length: steps }).reduce<Element>((current) => current.nextElementSibling as Element, element);
