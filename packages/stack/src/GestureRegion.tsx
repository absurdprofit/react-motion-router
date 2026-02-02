import React, { useContext } from 'react';
import { isWithinGestureInset } from './common/utils';
import { PlainObject, RoutePropContext } from '@react-motion-router/core';
import { RouteProp } from './common/types';

const DEFAULT_UA_GESTURE_AREA_WIDTH = 24;

function WithActivationDetection(
  { clientX: x, clientY: y }: Touch,
  rect: DOMRect,
  gestureAreaWidth: number
) {
  return isWithinGestureInset('left', { x, y }, rect, gestureAreaWidth)
    && isWithinGestureInset('right', { x, y }, rect, gestureAreaWidth)
    && isWithinGestureInset('down', { x, y }, rect, gestureAreaWidth)
    && isWithinGestureInset('up', { x, y }, rect, gestureAreaWidth);
}

type ElementForTag<T extends keyof JSX.IntrinsicElements> =
  T extends keyof (HTMLElementTagNameMap & SVGElementTagNameMap)
    ? (HTMLElementTagNameMap & SVGElementTagNameMap)[T]
    : HTMLElement;

type GestureRegion = {
  [T in keyof JSX.IntrinsicElements]: ReturnType<typeof createGestureRegion<T>>;
}

interface GestureRegionProps {
  gestureBehaviour?: 'contain' | 'none';
  uaGestureAreaWidth?: number;
}

export const createGestureRegion = (
  <T extends keyof JSX.IntrinsicElements>(tag: T) => 
    function GestureRegion({
      ref: forwardedRef,
      gestureBehaviour = 'contain',
      uaGestureAreaWidth = DEFAULT_UA_GESTURE_AREA_WIDTH,
      ...props
    }: JSX.IntrinsicElements[T] & GestureRegionProps) {
      const ref = React.useRef<ElementForTag<T>>(null);
      const route = useContext<RouteProp<PlainObject>>(
        RoutePropContext
      ) ?? null;
      const { gestureAreaWidth = Number() } = route?.config ?? {};
        
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
          const isWithinGestureInset = Array.from(e.touches)
            .map(touch => {
              return WithActivationDetection(touch, rect, gestureAreaWidth);
            })
            .some(Boolean);

          if (isWithinGestureInset)
            e.stopPropagation();

          const isWithinUAGestureInset = Array.from(e.touches)
            .map(touch => {
              return WithActivationDetection(touch, rect, uaGestureAreaWidth);
            })
            .some(Boolean);
            
          if (isWithinUAGestureInset)
            e.preventDefault();
        };

        target.addEventListener('touchstart', handler);
        return () => {
          target.removeEventListener(
            'touchstart',
            handler
          );
        };
      }, [uaGestureAreaWidth, gestureAreaWidth, gestureBehaviour]);

      const Tag = tag as React.JSX.ElementType;

      return <Tag ref={ref} {...props} />;
    }
);

export const GestureRegion = new Proxy(
  {} as GestureRegion, {
    get(target, key: keyof JSX.IntrinsicElements) {
      target[key] ??= createGestureRegion(key);
      return target[key];
    },
  }
);