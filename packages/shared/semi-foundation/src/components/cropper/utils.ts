interface Rect {
    width: number;
    height: number;
    centerPoint: { x: number; y: number };
}

/** The largest [width, height] within the given size whose ratio is `aspect` */
export function fitAspect(width: number, height: number, aspect: number): [number, number] {
    if (width / height > aspect) {
        width = height * aspect;
    } else {
        height = width / aspect;
    }
    return [width, height];
}

/** Top left corners of the image and the cropper box in the container, and of the image relative to the box */
export function getCropperGeometry(imgData: Rect, cropperBox: Rect) {
    const imgX = imgData.centerPoint.x - imgData.width / 2;
    const imgY = imgData.centerPoint.y - imgData.height / 2;
    const boxX = cropperBox.centerPoint.x - cropperBox.width / 2;
    const boxY = cropperBox.centerPoint.y - cropperBox.height / 2;
    return { imgX, imgY, boxX, boxY, viewX: imgX - boxX, viewY: imgY - boxY };
}
