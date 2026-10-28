export default function arrayMove(array: Array<any>, from: number, to: number) {
    // a negative `to` counts from the end of the array after removal, matching toSpliced
    return array.toSpliced(from, 1).toSpliced(to, 0, array[from]);
}
