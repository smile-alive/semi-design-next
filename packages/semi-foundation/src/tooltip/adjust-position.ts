/**
 * Position fine-tuning for `autoAdjustOverflow`. Only rects and numbers go in (no DOM, window or class instance), so it can be table-tested.
 */

export interface AdjustRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
}

export interface AdjustMargin {
    marginLeft: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
}

export interface AdjustPositionInput {
    position: string;
    /** trigger rect relative to the viewport */
    triggerRect: AdjustRect;
    /** popup size, nothing is adjusted when width or height is 0 */
    wrapperRect: Pick<AdjustRect, 'width' | 'height'>;
    /** rect of the popup container */
    containerRect: Pick<AdjustRect, 'left' | 'right' | 'top' | 'bottom'>;
    viewport: { width: number; height: number };
    spacing: number | { x: number; y: number };
    margin: number | AdjustMargin;
}

export interface AdjustPositionResult {
    position: string;
    isHeightOverFlow: boolean;
    isWidthOverFlow: boolean;
}

const REGS = {
    TOP: /top/i,
    RIGHT: /right/i,
    BOTTOM: /bottom/i,
    LEFT: /left/i,
};

function isLR(position: string) {
    return position.includes('left') || position.includes('right');
}
function isTB(position: string) {
    return position.includes('top') || position.includes('bottom');
}

// Insufficient original space, enough reverse space
function isReverse(rowSpace: number, reverseSpace: number, size: number) {
    return rowSpace < size && reverseSpace > size;
}

// Neither the original nor the reverse space is enough
function isOverFlow(rowSpace: number, reverseSpace: number, size: number) {
    return rowSpace < size && reverseSpace < size;
}

// A short positive or negative half space means the popup is occluded and must be offset
function isHalfOverFlow(posSpace: number, negSpace: number, size: number) {
    return posSpace < size || negSpace < size;
}

/**
 * Judged on viewport and container together, the flip to the opposite side is allowed when, taking top->bottom:
 * 1. neither side of the viewport has enough room and the container is short above but not below
 * 2. the viewport is short above but not below
 */
function shouldFlip(viewOverFlow: boolean, shouldReverseView: boolean, shouldReverseContainer: boolean) {
    return (viewOverFlow && shouldReverseContainer) || shouldReverseView;
}

function reversePos(position: string, isVertical: boolean) {
    if (isVertical) {
        if (REGS.TOP.test(position)) {
            return position.replace('top', 'bottom').replace('Top', 'Bottom');
        } else if (REGS.BOTTOM.test(position)) {
            return position.replace('bottom', 'top').replace('Bottom', 'Top');
        }
    } else if (REGS.LEFT.test(position)) {
        return position.replace('left', 'right').replace('Left', 'Right');
    } else if (REGS.RIGHT.test(position)) {
        return position.replace('right', 'left').replace('Right', 'Left');
    }
    return position;
}

export function adjustPosition(input: AdjustPositionInput): AdjustPositionResult {
    const { triggerRect, wrapperRect, containerRect, viewport, margin } = input;
    const { width: innerWidth, height: innerHeight } = viewport;
    let position = input.position;

    const marginLeft = typeof margin === 'number' ? margin : margin.marginLeft;
    const marginTop = typeof margin === 'number' ? margin : margin.marginTop;
    const marginRight = typeof margin === 'number' ? margin : margin.marginRight;
    const marginBottom = typeof margin === 'number' ? margin : margin.marginBottom;

    let isHeightOverFlow = false;
    let isWidthOverFlow = false;

    const raw_spacing = input.spacing;
    let spacing: number;
    let ano_spacing = 0;
    if (typeof raw_spacing !== 'number') {
        // extended spacing api with {x: number, y: number}, the axes of the spacing is determined based on the position
        const isTopOrBottom = isTB(position);
        spacing = isTopOrBottom ? raw_spacing.y : raw_spacing.x;
        ano_spacing = isTopOrBottom ? raw_spacing.x : raw_spacing.y;
    } else {
        spacing = raw_spacing;
    }

    if (wrapperRect.width > 0 && wrapperRect.height > 0) {
        const clientLeft = triggerRect.left;
        const clientRight = triggerRect.right;
        const clientTop = triggerRect.top;
        const clientBottom = triggerRect.bottom;

        const restClientLeft = innerWidth - clientLeft;
        const restClientTop = innerHeight - clientTop;
        const restClientRight = innerWidth - clientRight;
        const restClientBottom = innerHeight - clientBottom;

        const widthIsBigger = wrapperRect.width > triggerRect.width;
        const heightIsBigger = wrapperRect.height > triggerRect.height;

        // Comparing against wrapperRect.top|bottom directly would jitter, so only sizes are compared
        const shouldViewReverseTop = clientTop - marginTop < wrapperRect.height + spacing && restClientBottom - marginBottom > wrapperRect.height + spacing;
        const shouldViewReverseLeft = clientLeft - marginLeft < wrapperRect.width + spacing && restClientRight - marginRight > wrapperRect.width + spacing;
        const shouldViewReverseBottom = restClientBottom - marginBottom < wrapperRect.height + spacing && clientTop - marginTop > wrapperRect.height + spacing;
        const shouldViewReverseRight = restClientRight - marginRight < wrapperRect.width + spacing && clientLeft - marginLeft > wrapperRect.width + spacing;

        const shouldViewReverseTopSide = restClientTop < wrapperRect.height + ano_spacing && clientBottom > wrapperRect.height + ano_spacing;
        const shouldViewReverseBottomSide = clientBottom < wrapperRect.height + ano_spacing && restClientTop > wrapperRect.height + ano_spacing;
        const shouldViewReverseLeftSide = restClientLeft < wrapperRect.width + ano_spacing && clientRight > wrapperRect.width + ano_spacing;
        const shouldViewReverseRightSide = clientRight < wrapperRect.width + ano_spacing && restClientLeft > wrapperRect.width + ano_spacing;

        const shouldReverseTopOver = restClientTop < wrapperRect.height + spacing && clientBottom > wrapperRect.height + spacing;
        const shouldReverseBottomOver = clientBottom < wrapperRect.height + spacing && restClientTop > wrapperRect.height + spacing;

        const shouldReverseLeftOver = restClientLeft < wrapperRect.width && clientRight > wrapperRect.width;
        const shouldReverseRightOver = clientRight < wrapperRect.width && restClientLeft > wrapperRect.width;

        const clientTopInContainer = clientTop - containerRect.top;
        const clientLeftInContainer = clientLeft - containerRect.left;
        const clientBottomInContainer = clientTopInContainer + triggerRect.height;
        const clientRightInContainer = clientLeftInContainer + triggerRect.width;

        const restClientBottomInContainer = containerRect.bottom - clientBottom;
        const restClientRightInContainer = containerRect.right - clientRight;
        const restClientTopInContainer = restClientBottomInContainer + triggerRect.height;
        const restClientLeftInContainer = restClientRightInContainer + triggerRect.width;

        const shouldContainerReverseTop = isReverse(clientTopInContainer - marginTop, restClientBottomInContainer - marginBottom, wrapperRect.height + spacing);
        const shouldContainerReverseLeft = isReverse(clientLeftInContainer - marginLeft, restClientRightInContainer - marginRight, wrapperRect.width + spacing);
        const shouldContainerReverseBottom = isReverse(restClientBottomInContainer - marginBottom, clientTopInContainer - marginTop, wrapperRect.height + spacing);
        const shouldContainerReverseRight = isReverse(restClientRightInContainer - marginRight, clientLeftInContainer - marginLeft, wrapperRect.width + spacing);

        const shouldContainerReverseTopSide = isReverse(restClientTopInContainer, clientBottomInContainer, wrapperRect.height + ano_spacing);
        const shouldContainerReverseBottomSide = isReverse(clientBottomInContainer, restClientTopInContainer, wrapperRect.height + ano_spacing);
        const shouldContainerReverseLeftSide = isReverse(restClientLeftInContainer, clientRightInContainer, wrapperRect.width + ano_spacing);
        const shouldContainerReverseRightSide = isReverse(clientRightInContainer, restClientLeftInContainer, wrapperRect.width + ano_spacing);

        const halfHeight = triggerRect.height / 2;
        const halfWidth = triggerRect.width / 2;
        const isViewYOverFlow = isOverFlow(clientTop - marginTop, restClientBottom - marginBottom, wrapperRect.height + spacing);
        const isViewXOverFlow = isOverFlow(clientLeft - marginLeft, restClientRight - marginRight, wrapperRect.width + spacing);
        const isViewYOverFlowSide = isOverFlow(clientBottom - marginTop, restClientTop - marginBottom, wrapperRect.height + spacing);
        const isViewXOverFlowSide = isOverFlow(clientRight - marginLeft, restClientLeft - marginRight, wrapperRect.width + spacing);
        const isViewYOverFlowSideHalf = isHalfOverFlow(clientBottom - halfHeight, restClientTop - halfHeight, (wrapperRect.height + ano_spacing) / 2);
        const isViewXOverFlowSideHalf = isHalfOverFlow(clientRight - halfWidth, restClientLeft - halfWidth, (wrapperRect.width + ano_spacing) / 2);

        const isContainerYOverFlow = isOverFlow(clientTopInContainer - marginTop, restClientBottomInContainer - marginBottom, wrapperRect.height + spacing);
        const isContainerXOverFlow = isOverFlow(clientLeftInContainer - marginLeft, restClientRightInContainer - marginRight, wrapperRect.width + spacing);
        const isContainerYOverFlowSide = isOverFlow(clientBottomInContainer - marginTop, restClientTopInContainer - marginBottom, wrapperRect.height + spacing);
        const isContainerXOverFlowSide = isOverFlow(clientRightInContainer - marginLeft, restClientLeftInContainer - marginRight, wrapperRect.width + spacing);
        const isContainerYOverFlowSideHalf = isHalfOverFlow(clientBottomInContainer - halfHeight, restClientTopInContainer - halfHeight, (wrapperRect.height + ano_spacing) / 2);
        const isContainerXOverFlowSideHalf = isHalfOverFlow(clientRightInContainer - halfWidth, restClientLeftInContainer - halfWidth, (wrapperRect.width + ano_spacing) / 2);

        // Flip when the viewport is short on this side but not the opposite one, or short on both sides while the
        // container has room on the opposite side
        const shouldReverseTop = shouldFlip(isViewYOverFlow, shouldViewReverseTop, shouldContainerReverseTop);
        const shouldReverseLeft = shouldFlip(isViewXOverFlow, shouldViewReverseLeft, shouldContainerReverseLeft);
        const shouldReverseBottom = shouldFlip(isViewYOverFlow, shouldViewReverseBottom, shouldContainerReverseBottom);
        const shouldReverseRight = shouldFlip(isViewXOverFlow, shouldViewReverseRight, shouldContainerReverseRight);

        const shouldReverseTopSide = shouldFlip(isViewYOverFlowSide, shouldViewReverseTopSide, shouldContainerReverseTopSide);
        const shouldReverseBottomSide = shouldFlip(isViewYOverFlowSide, shouldViewReverseBottomSide, shouldContainerReverseBottomSide);
        const shouldReverseLeftSide = shouldFlip(isViewXOverFlowSide, shouldViewReverseLeftSide, shouldContainerReverseLeftSide);
        const shouldReverseRightSide = shouldFlip(isViewXOverFlowSide, shouldViewReverseRightSide, shouldContainerReverseRightSide);

        const isYOverFlowSideHalf = isViewYOverFlowSideHalf && isContainerYOverFlowSideHalf;
        const isXOverFlowSideHalf = isViewXOverFlowSideHalf && isContainerXOverFlowSideHalf;

        switch (position) {
            case 'top':
                if (shouldReverseTop) {
                    position = reversePos(position, true);
                }
                if (isXOverFlowSideHalf && (shouldReverseLeftSide || shouldReverseRightSide)) {
                    position = position.concat(shouldReverseLeftSide ? 'Right' : 'Left');
                }
                break;
            case 'topLeft':
                if (shouldReverseTop) {
                    position = reversePos(position, true);
                }
                if (shouldReverseLeftSide && widthIsBigger) {
                    position = reversePos(position, false);
                }
                break;
            case 'topRight':
                if (shouldReverseTop) {
                    position = reversePos(position, true);
                }
                if (shouldReverseRightSide && widthIsBigger) {
                    position = reversePos(position, false);
                }
                break;
            case 'left':
                if (shouldReverseLeft) {
                    position = reversePos(position, false);
                }
                if (isYOverFlowSideHalf && (shouldReverseTopSide || shouldReverseBottomSide)) {
                    position = position.concat(shouldReverseTopSide ? 'Bottom' : 'Top');
                }
                break;
            case 'leftTop':
                if (shouldReverseLeft) {
                    position = reversePos(position, false);
                }
                if (shouldReverseTopSide && heightIsBigger) {
                    position = reversePos(position, true);
                }
                break;
            case 'leftBottom':
                if (shouldReverseLeft) {
                    position = reversePos(position, false);
                }
                if (shouldReverseBottomSide && heightIsBigger) {
                    position = reversePos(position, true);
                }
                break;
            case 'bottom':
                if (shouldReverseBottom) {
                    position = reversePos(position, true);
                }
                if (isXOverFlowSideHalf && (shouldReverseLeftSide || shouldReverseRightSide)) {
                    position = position.concat(shouldReverseLeftSide ? 'Right' : 'Left');
                }
                break;
            case 'bottomLeft':
                if (shouldReverseBottom) {
                    position = reversePos(position, true);
                }
                if (shouldReverseLeftSide && widthIsBigger) {
                    position = reversePos(position, false);
                }
                break;
            case 'bottomRight':
                if (shouldReverseBottom) {
                    position = reversePos(position, true);
                }
                if (shouldReverseRightSide && widthIsBigger) {
                    position = reversePos(position, false);
                }
                break;
            case 'right':
                if (shouldReverseRight) {
                    position = reversePos(position, false);
                }
                if (isYOverFlowSideHalf && (shouldReverseTopSide || shouldReverseBottomSide)) {
                    position = position.concat(shouldReverseTopSide ? 'Bottom' : 'Top');
                }
                break;
            case 'rightTop':
                if (shouldReverseRight) {
                    position = reversePos(position, false);
                }
                if (shouldReverseTopSide && heightIsBigger) {
                    position = reversePos(position, true);
                }
                break;
            case 'rightBottom':
                if (shouldReverseRight) {
                    position = reversePos(position, false);
                }
                if (shouldReverseBottomSide && heightIsBigger) {
                    position = reversePos(position, true);
                }
                break;
            case 'leftTopOver':
                if (shouldReverseTopOver) {
                    position = reversePos(position, true);
                }
                if (shouldReverseLeftOver) {
                    position = reversePos(position, false);
                }
                break;
            case 'leftBottomOver':
                if (shouldReverseBottomOver) {
                    position = reversePos(position, true);
                }
                if (shouldReverseLeftOver) {
                    position = reversePos(position, false);
                }
                break;
            case 'rightTopOver':
                if (shouldReverseTopOver) {
                    position = reversePos(position, true);
                }
                if (shouldReverseRightOver) {
                    position = reversePos(position, false);
                }
                break;
            case 'rightBottomOver':
                if (shouldReverseBottomOver) {
                    position = reversePos(position, true);
                }
                if (shouldReverseRightOver) {
                    position = reversePos(position, false);
                }
                break;
            default:
                break;
        }

        if (isTB(position)) {
            isHeightOverFlow = isViewYOverFlow && isContainerYOverFlow;
            // If clientRight or restClientRight less than 0, means that the left and right parts of the trigger are blocked
            // Then the display of the wrapper will also be affected, make width overflow to offset the wrapper
            if (position === 'top' || position === 'bottom') {
                isWidthOverFlow = (isViewXOverFlowSideHalf && isContainerXOverFlowSideHalf) || clientRight < 0 || restClientRight < 0;
            } else {
                isWidthOverFlow = (isViewXOverFlowSide && isContainerXOverFlowSide) || clientRight < 0 || restClientRight < 0;
            }
        }
        if (isLR(position)) {
            isWidthOverFlow = isViewXOverFlow && isContainerXOverFlow;
            // If clientTop or restClientTop less than 0, means that the top and bottom parts of the trigger are blocked
            // Then the display of the wrapper will also be affected, make height overflow to offset the wrapper
            if (position === 'left' || position === 'right') {
                isHeightOverFlow = (isViewYOverFlowSideHalf && isContainerYOverFlowSideHalf) || clientTop < 0 || restClientTop < 0;
            } else {
                isHeightOverFlow = (isViewYOverFlowSide && isContainerYOverFlowSide) || clientTop < 0 || restClientTop < 0;
            }
        }
    }

    return { position, isHeightOverFlow, isWidthOverFlow };
}
