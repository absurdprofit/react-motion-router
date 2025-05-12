import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Screen, ScreenComponentProps } from '../Screen';
import { useEffect } from 'react';
import { androidScaleFromCentre } from '../animation-configs/animation-presets';
import { Router } from '../Router';

describe('Screen.setConfig', () => {
  function TestComponent(props: ScreenComponentProps<object>) {
    useEffect(() => {
      props.route.setConfig({
        animation: androidScaleFromCentre,
      });
    }, [props.route]);
    return null;
  }
  it('filters out non-cloneable keys', () => {

  });
  it('does not throw', () => {
    expect(() => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    }).not.toThrow();
  });
});