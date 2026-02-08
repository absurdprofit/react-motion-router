import React, { useContext, useEffect } from 'react';
import {
  ElementForTag
} from '@react-motion-router/core';
import { SharedElementTransitionType } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';

type SharedElement = {
  [T in keyof JSX.IntrinsicElements]: ReturnType<typeof createSharedElement<T>>;
}

interface SharedElementConfig extends OptionalEffectTiming {
  type?: SharedElementTransitionType;
}

interface SharedElementProps {
  id: string;
  config?: SharedElementConfig;
}

export const createSharedElement = (
  <T extends keyof JSX.IntrinsicElements>(tag: T) => 
    function SharedElement({
      ref: forwardedRef,
      ...props
    }: JSX.IntrinsicElements[T] & SharedElementProps) {
      const ref = React.useRef<ElementForTag<T>>(null);
      const scene = useContext(SharedElementSceneContext);

      useEffect(() => {
      }, []);
        
      React.useImperativeHandle(
        forwardedRef as React.Ref<ElementForTag<T>> | undefined,
        () => ref.current as ElementForTag<T>
      );

      const Tag = tag as React.JSX.ElementType;

      const viewTransitionName = `shared-element-${props.id.toString()}`;

      return <Tag
        ref={ref}
        {...props}
        style={{
          ...props.style,
          viewTransitionName,
        }}
      />;
    }
);

export const SharedElement = new Proxy(
  {} as SharedElement, {
    get(target, key: keyof JSX.IntrinsicElements) {
      target[key] ??= createSharedElement(key);
      return target[key];
    },
  }
);