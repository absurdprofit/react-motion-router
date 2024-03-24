export const MAX_Z_INDEX = 2147483647;
export const MAX_PROGRESS = 100;
export const MIN_PROGRESS = 0;
export const MIN_NORM_PROGRESS = 0;
export const MAX_NORM_PROGRESS = 1;
export const DEFAULT_ANIMATION = {
    in: new Animation(),
    out: new Animation()
} as const;
export const DEFAULT_GESTURE_CONFIG = {
    hysteresis: 50,
    minFlingVelocity: 400,
    swipeAreaWidth: 100,
    swipeDirection: 'right'
} as const;