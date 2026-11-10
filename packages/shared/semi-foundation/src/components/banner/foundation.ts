import { BaseFoundation, type DefaultAdapter } from '../../base/index';

export interface BannerState {
    visible: boolean;
}

/** E is the host's click event, which the foundation only passes through */
export interface BannerAdapter<P extends object = object, E = unknown> extends DefaultAdapter<P, BannerState> {
    notifyClose: (e: E) => void;
}

export default class BannerFoundation<P extends object = object, E = unknown> extends BaseFoundation<BannerAdapter<P, E>, P, BannerState> {
    static getInitialState(): BannerState {
        return { visible: true };
    }

    removeBanner = (e: E) => {
        this.adapter.notifyClose(e);
        this.setState({ visible: false });
    };
}
