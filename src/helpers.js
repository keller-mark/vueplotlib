/**
 * Get the retina ratio to be able to scale up a canvas context.
 * @param {context} c The canvas context.
 * @returns {float} The ratio.
 */
export const getRetinaRatio = function(c) {
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = [
        c.webkitBackingStorePixelRatio,
        c.mozBackingStorePixelRatio,
        c.msBackingStorePixelRatio,
        c.oBackingStorePixelRatio,
        c.backingStorePixelRatio,
        1
    ].reduce(function(a, b) { return a || b });

    return devicePixelRatio / backingStoreRatio;
}