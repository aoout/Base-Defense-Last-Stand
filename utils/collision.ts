
export const circlesIntersect = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distSq = dx * dx + dy * dy;
    const rSum = r1 + r2;
    return distSq < rSum * rSum;
};

export const circleIntersectsAABB = (cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number): boolean => {
    // Find the closest point on the rectangle to the center of the circle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    // Calculate the distance between the circle's center and this closest point
    const dx = cx - closestX;
    const dy = cy - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    const distanceSq = (dx * dx) + (dy * dy);
    return distanceSq < (cr * cr);
};
