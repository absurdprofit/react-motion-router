import React, { cache } from 'react';
import { useRoute } from './common/hooks';
import { isOutOfBounds } from './common/types';

const DEFAULT_GESTURE_AREA_WIDTH = 20;

type ElementForTag<T extends keyof JSX.IntrinsicElements> =
  T extends keyof (HTMLElementTagNameMap & SVGElementTagNameMap)
    ? (HTMLElementTagNameMap & SVGElementTagNameMap)[T]
    : HTMLElement;

type GestureRegion = {
  [T in keyof JSX.IntrinsicElements]: ReturnType<typeof createGestureRegion<T>>;
}

interface GestureRegionProps {
  gestureBehaviour?: 'contain' | 'none';
}

export const createGestureRegion = cache(
  <T extends keyof JSX.IntrinsicElements>(tag: T) => {
    return (
      function GestureRegion({
        ref: forwardedRef,
        gestureBehaviour = 'contain',
        ...props
      }: JSX.IntrinsicElements[T] & GestureRegionProps) {
        const ref = React.useRef<ElementForTag<T>>(null);
        const route = useRoute();
        const { gestureAreaWidth = DEFAULT_GESTURE_AREA_WIDTH } = route.config;
        
        React.useImperativeHandle(
          forwardedRef as React.Ref<ElementForTag<T>> | undefined,
          () => ref.current as ElementForTag<T>
        );

        React.useEffect(() => {
          if (!ref.current) return;
          const target = ref.current;

          const handler = (e: Event) => {
            if (!(e instanceof TouchEvent)) return;
            if (gestureBehaviour === 'none') return;
            const rect = target.getBoundingClientRect();
            const touches = Array.from(e.touches)
              .map(({ clientX: x, clientY: y }) => {
                return isOutOfBounds('left', { x, y }, rect, gestureAreaWidth)
                && isOutOfBounds('right', { x, y }, rect, gestureAreaWidth)
                && isOutOfBounds('down', { x, y }, rect, gestureAreaWidth)
                && isOutOfBounds('up', { x, y }, rect, gestureAreaWidth);
              });

            if (!touches.some(Boolean)) return;

            e.stopPropagation();
            e.preventDefault();
          };

          target.addEventListener('touchstart', handler);
          return () => {
            target.removeEventListener(
              'touchstart',
              handler
            );
          };
        }, [gestureAreaWidth, gestureBehaviour]);

        const Tag = tag as React.JSX.ElementType;

        return <Tag ref={ref} {...props} />;
      }
    );
  }
);

export const GestureRegion = new Proxy(
  {} as GestureRegion, {
    get(_, key) {
      return (
        createGestureRegion(key as keyof JSX.IntrinsicElements)
      );
    },
  }
);