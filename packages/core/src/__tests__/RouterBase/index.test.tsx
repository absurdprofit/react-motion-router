import { describe, expect, it } from 'vitest';
import { TestRouter, TestScreen } from '../common/utils';
import { render } from '@testing-library/react';

describe('RouterBase', () => {
  it(
    'throws if multiple routers are at the same level on the same screen',
    async () => {
      const Child = () => <div>Test</div>;
      function TestComponent() {
        return (
          <div>
            <TestRouter>
              <TestScreen path='1' component={Child} />
              <TestScreen path='2' component={Child} />
            </TestRouter>
            <TestRouter>
              <TestScreen path='1' component={Child} />
              <TestScreen path='2' component={Child} />
            </TestRouter>
          </div>
        );
      }

      expect(() => render(<TestComponent />)).toThrow();
    }
  );

  it(
    'throws if multiple routers are at the same level on the same nested screen',
    async () => {
      const Child = ({ route }: { route: { path: string } }) => {
        return <div>Path: {route.path}</div>;
      };
      function TestComponent() {
        return (
          <div>
            <TestRouter>
              <TestScreen path='1' component={Child} />
              <TestScreen path='2' component={Child} />
            </TestRouter>
            <TestRouter>
              <TestScreen path='3' component={Child} />
              <TestScreen path='4' component={Child} />
            </TestRouter>
          </div>
        );
      }

      function TestParentComponent() {
        return (
          <TestRouter>
            <TestScreen path='**' component={TestComponent} />
          </TestRouter>
        );
      }

      expect(() => render(<TestParentComponent />)).toThrow();
    }
  );

  it(
    'does not throw if multiple routers are at the same level on different nested screens',
    async () => {
      const Child = ({ route }: { route: { path: string } }) => {
        return <div>Path: {route.path}</div>;
      };
      function TestComponent1() {
        return (
          <div>
            <TestRouter>
              <TestScreen path='1' component={Child} />
              <TestScreen path='2' component={Child} />
            </TestRouter>
          </div>
        );
      }
      function TestComponent2() {
        return (
          <div>
            <TestRouter>
              <TestScreen path='3' component={Child} />
              <TestScreen path='4' component={Child} />
            </TestRouter>
          </div>
        );
      }

      function TestParentComponent() {
        return (
          <TestRouter>
            <TestScreen path='1/**' component={TestComponent1} />
            <TestScreen path='2/**' component={TestComponent2} />
          </TestRouter>
        );
      }

      expect(() => render(<TestParentComponent />)).not.throw();
    }
  );
});