import { useRef, useCallback } from 'react';
import { SwipeStartEvent } from 'web-gesture-events';
import { useEventListener } from './common/hooks';

interface GestureRegionProps extends React.HTMLAttributes<HTMLDivElement> {
    disabled?: boolean;
}
export function GestureRegion(
  { disabled, children, ...props }: GestureRegionProps
) {
  const ref = useRef<HTMLDivElement>(null);

  const onSwipeStart = useCallback((e: SwipeStartEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
  }, [disabled]);

  useEventListener(
    ref,
    'swipestart',
    onSwipeStart
  );

  return (
    <div
      ref={ref}
      className="gesture-region"
      data-disabled={disabled}
      style={{ display: 'contents' }}
      {...props}
    >
      {children}
    </div>
  );
}