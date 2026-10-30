import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Fixture, { type FixtureStore } from './date-picker-fixture.svelte';

export const dp = `${BASE_CLASS_PREFIX}-datepicker`;

/** Lets the foundation's timers and the effects they schedule run */
export async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

type SetupInit = Partial<Omit<FixtureStore, 'props'>> & { props?: FixtureStore['props'] };

/** A value without a mode is passed one-way, the initial value other frameworks take as defaultValue */
export async function setup({ props, ...init }: SetupInit = {}) {
    const mode = init.value === undefined ? 'uncontrolled' : 'one-way';
    const store = createStore<FixtureStore>({ target: 'value', mode, accept: true, log: [], ...init, props: { motion: false, ...props } });
    const result = render(Fixture, { props: { store } });
    await settle();
    return { store, ...result };
}

/** Freezes only Date, at 2019-08-08 10:00, so the foundation's timers keep running */
export function useBaseDate() {
    beforeEach(() => {
        vi.useFakeTimers({ now: new Date(2019, 7, 8, 10, 0), toFake: ['Date'] });
    });

    afterEach(() => {
        vi.useRealTimers();
        semiGlobal.config = {};
    });
}

export const getRoot = () => document.querySelector(`.${dp}`) as HTMLElement;
export const getInputs = () => Array.from(getRoot().querySelectorAll<HTMLInputElement>('input'));
export const getInput = () => getInputs()[0];
export const getTrigger = () => getRoot().querySelector(`.${dp}-input`) as HTMLElement;
export const getContainer = () => document.querySelector(`.${dp}-container`);
export const getDay = (fullDate: string) => document.querySelector<HTMLElement>(`.${dp}-day[aria-label="${fullDate}"]`) as HTMLElement;
export const getSelectedDays = () => Array.from(document.querySelectorAll(`.${dp}-day[aria-selected="true"]`)).map((day) => day.getAttribute('aria-label'));
export const getGrid = (side = 'left') => document.querySelector<HTMLElement>(`.${dp}-month-grid-${side} [role="grid"]`) as HTMLElement;
export const getNavTitle = (side = 'left') => document.querySelector(`.${dp}-month-grid-${side} .${dp}-navigation-month`)?.textContent?.trim();
export const changes = (store: FixtureStore) => store.log.filter((entry) => entry.startsWith('change'));
export const opens = (store: FixtureStore) => store.log.filter((entry) => entry.startsWith('open'));

export async function clickDay(fullDate: string) {
    await fireEvent.click(getDay(fullDate));
    await settle();
}

export async function clickTrigger() {
    await fireEvent.click(getTrigger());
    await settle();
}

export async function clickOutside() {
    await fireEvent.mouseDown(document.body);
    await settle();
}

export async function typeText(text: string, input = getInput()) {
    await fireEvent.input(input, { target: { value: text } });
    await settle();
}

export async function pressKey(target: Element, key: string) {
    await fireEvent.keyDown(target, { key });
    await settle();
}
