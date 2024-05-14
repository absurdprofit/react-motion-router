import { useRef, useEffect } from 'react';
import { SwipeStartEvent } from 'web-gesture-events';

interface GestureRegionProps extends React.HTMLAttributes<HTMLDivElement> {
    disabled?: boolean;
}
export function GestureRegion({disabled, children, ...props}: GestureRegionProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onSwipeStart = (e: SwipeStartEvent) => {
            e.stopPropagation();
        }

        ref.current?.addEventListener('swipestart', onSwipeStart);

        return () => {
            ref.current?.removeEventListener('swipestart', onSwipeStart);
        }
    }, [ref]);

    return (
        <div
            ref={ref}
            className="gesture-region"
            data-disabled={disabled}
            style={{display: 'contents'}}
            {...props}
        >
            {children}
        </div>
    );
}