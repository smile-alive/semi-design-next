import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';

export interface Props {
    value?: string;
    suffix?: string;
}
export interface State {
    value: string;
    identity: object;
}
export interface Adapter extends DefaultAdapter<Props, State> {
    notify: (value: string) => void;
}

export default class FixtureFoundation extends BaseFoundation<Adapter, Props, State> {
    #count = 0;

    override init() {
        document.addEventListener('fixture-event', () => this.adapter.notify('event'), { signal: this.signal });
        this.adapter.notify(`init:${this.getState('value')}`);
    }

    override destroy() {
        this.adapter.notify('destroy');
    }

    update() {
        this.#count++;
        const value = `${this.getProp('value')}:${this.getProps().suffix}:${this.#count}`;
        this.setState({ value }, () => this.adapter.notify(`callback:${document.querySelector('[data-host]')?.textContent}`));
        this.adapter.notify(`sync:${this.getState('value')}`);
    }

    repeat() {
        this.setState({ value: this.getState('value') }, () => this.adapter.notify('repeat'));
    }
}
