import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export interface CalendarMonthBaseState {
    showCard: Record<string, boolean>;
}

export interface CalendarMonthAdapter<P extends object = object> extends DefaultAdapter<P, CalendarMonthBaseState> {
    notifyClose: (e: any) => void;
}

export default class CalendarMonthFoundation<P extends object = object> extends BaseFoundation<CalendarMonthAdapter<P>, P, CalendarMonthBaseState> {
    static getInitialState(): CalendarMonthBaseState {
        return { showCard: {} };
    }

    /** Closes the "more" card from its close button or a mousedown outside */
    closeCard = (e: unknown, key: string) => {
        this.setState({ showCard: { ...this.getState('showCard'), [key]: false } });
        this.adapter.notifyClose(e);
    };

    showCard = (key: string) => {
        this.setState({ showCard: { [key]: true } });
    };
}
