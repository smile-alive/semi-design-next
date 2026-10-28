import { clamp } from 'es-toolkit';

// a fit computed from an image without a natural size is not finite
export function clampZoom(zoom: number, min: number, max: number) {
    return Number.isFinite(zoom) ? clamp(zoom, min, max) : min;
}

export async function downloadImage(src: string, filename: string, downloadErrorCb: (src: string) => void) {
    try {
        const response = await fetch(src);
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            link.remove();
        } else {
            downloadErrorCb(src);
        }
    } catch (error) {
        downloadErrorCb(src);
    }
}

export function crossMerge(leftArr = [], rightArr = []) {
    let newArr = [];
    const leftLen = leftArr.length;
    const rightLen = rightArr.length;
    const crossLength = leftLen <= rightLen ? leftLen : rightLen;
    Array.from({ length: crossLength }).forEach((_item, index) => {
        newArr.push(rightArr[index]);
        newArr.push(leftArr[index]);
    });
    if (leftLen > rightLen) {
        newArr = newArr.concat(leftArr.slice(rightLen, leftLen));
    } else if (leftLen < rightLen) {
        newArr = newArr.concat(rightArr.slice(leftLen, rightLen));
    }
    return newArr;
}

export function getPreloadSrcList(imgSrc: string[], currentIndex: number, preLoadGap: number, infinite: boolean) {
    const beginIndex = currentIndex - preLoadGap;
    const endIndex = currentIndex + preLoadGap;
    const srcLength = imgSrc.length;
    let leftArr = [];
    let rightArr = [];
    if (preLoadGap >= Math.floor(srcLength / 2)) {
        if (infinite) {
            leftArr = imgSrc.concat(imgSrc).slice(beginIndex + srcLength < 0 ? 0 : beginIndex + srcLength, currentIndex + srcLength);
            rightArr = imgSrc.concat(imgSrc).slice(currentIndex + 1, endIndex + 1 < 2 * srcLength ? endIndex + 1 : 2 * srcLength);
        } else {
            leftArr = imgSrc.slice(0, currentIndex);
            rightArr = imgSrc.slice(currentIndex + 1, srcLength);
        }
    } else {
        if (infinite) {
            leftArr = imgSrc.concat(imgSrc).slice(beginIndex + srcLength, currentIndex + srcLength);
            rightArr = imgSrc.concat(imgSrc).slice(currentIndex + 1, endIndex + 1);
        } else {
            if (beginIndex >= 0 && endIndex < srcLength) {
                leftArr = imgSrc.slice(beginIndex, currentIndex);
                rightArr = imgSrc.slice(currentIndex + 1, endIndex + 1);
            } else if (beginIndex < 0) {
                leftArr = imgSrc.slice(0, currentIndex);
                rightArr = imgSrc.slice(currentIndex + 1, 2 * preLoadGap + 1);
            } else {
                rightArr = imgSrc.slice(currentIndex + 1, srcLength);
                leftArr = imgSrc.slice(srcLength - 2 * preLoadGap - 1, currentIndex);
            }
        }
    }
    const result = crossMerge(leftArr.toReversed(), rightArr);
    const duplicateResult = Array.from(new Set(result));
    return duplicateResult;
}
