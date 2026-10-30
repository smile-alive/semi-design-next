import { throttle, type ThrottledFunction } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { RatioType, RotateDirection } from './preview-inner-foundation';
import { clampZoom } from './utils';

/** The props the foundation reads */
export interface PreviewFooterBaseProps {
    zoom?: number;
    step?: number;
    min?: number;
    max?: number;
    ratio?: RatioType;
}

export interface PreviewFooterBaseState {}

export interface PreviewFooterAdapter<P extends PreviewFooterBaseProps = PreviewFooterBaseProps, S extends PreviewFooterBaseState = PreviewFooterBaseState> extends DefaultAdapter<P, S> {
    notifyZoomIn: (zoom: number) => void;
    notifyZoomOut: (zoom: number) => void;
    notifyAdjustRatio: (type: RatioType) => void;
    notifyRotate: (direction: RotateDirection) => void;
}

export default class PreviewFooterFoundation<P extends PreviewFooterBaseProps = PreviewFooterBaseProps, S extends PreviewFooterBaseState = PreviewFooterBaseState> extends BaseFoundation<PreviewFooterAdapter<P, S>, P, S> {
    protected handleValueChange(value: number) {
        const { zoom } = this.getProps();
        if (value > zoom) {
            this.adapter.notifyZoomIn(Number((value / 100).toFixed(2)));
        } else {
            this.adapter.notifyZoomOut(Number((value / 100).toFixed(2)));
        }
    }

    handleSlideChange: ThrottledFunction<(value: number | number[]) => void> = throttle((value: number | number[]) => {
        this.handleValueChange(value as number);
    }, 50);

    override destroy() {
        this.handleSlideChange.cancel();
    }

    changeSliderValue = (type: 'plus' | 'minus') => {
        const { zoom, step, min, max } = this.getProps();
        this.handleValueChange(clampZoom(type === 'plus' ? zoom + step : zoom - step, min, max));
    };

    handleRatioClick = () => {
        const { ratio } = this.getProps();
        const type = ratio === 'adaptation' ? 'realSize' : 'adaptation';
        this.adapter.notifyAdjustRatio(type);
    };

    handleRotate = (direction: RotateDirection) => {
        this.adapter.notifyRotate(direction);
    };
}
