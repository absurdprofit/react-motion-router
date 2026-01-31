import { describe, expect, it } from 'vitest';
import { TestRouter, TestScreen } from '../common/utils';
import { RouterBase } from '../../RouterBase';

describe('Router.screenChildFromPathname', () => {
  it('finds the first match', () => {
    const router = new TestRouter(
      {
        children: [
          <TestScreen
            key='1'
            path='*'
            component={() => <div>Screen 1</div>}
            defaultParams={{ screen: '1' }}
          />,
          <TestScreen
            key='2'
            path='*'
            component={() => <div>Screen 2</div>}
            defaultParams={{ screen: '2' }}
          />,
        ],
      },
      null
    );

    const screenChildFromPathname = Object.getOwnPropertyDescriptor(
      RouterBase.prototype,
      'screenChildFromPathname'
    )?.value as RouterBase['screenChildFromPathname'];
    
    expect(
      screenChildFromPathname.call(
        router,
        'test'
      )?.child.props.defaultParams
    ).toStrictEqual({ screen: '1' });
  });

  it('respects screen caseSensitive prop', () => {
    const router = new TestRouter(
      {
        children: [
          <TestScreen
            key='1'
            path='test'
            component={() => <div>Screen 1</div>}
            defaultParams={{ screen: '1' }}
            caseSensitive
          />,
          <TestScreen
            key='2'
            path='*'
            component={() => <div>Screen 2</div>}
            defaultParams={{ screen: '2' }}
          />,
        ],
      },
      null
    );

    const screenChildFromPathname = Object.getOwnPropertyDescriptor(
      RouterBase.prototype,
      'screenChildFromPathname'
    )?.value as RouterBase['screenChildFromPathname'];
    
    expect(
      screenChildFromPathname.call(
        router,
        'Test'
      )?.child.props.defaultParams
    ).toStrictEqual({ screen: '2' });
  });

  it('returns path params in matchInfo', () => {
    const router = new TestRouter(
      {
        children: [
          <TestScreen
            key='1'
            path='test/:id'
            component={() => <div>Screen 1</div>}
            defaultParams={{ screen: '1' }}
          />,
          <TestScreen
            key='2'
            path='*'
            component={() => <div>Screen 2</div>}
            defaultParams={{ screen: '2' }}
          />,
        ],
      },
      null
    );

    const screenChildFromPathname = Object.getOwnPropertyDescriptor(
      RouterBase.prototype,
      'screenChildFromPathname'
    )?.value as RouterBase['screenChildFromPathname'];
    
    expect(
      screenChildFromPathname.call(
        router,
        'test/1'
      )?.matchInfo.params
    ).toStrictEqual({ id: '1' });
  });

  it('matches resolves screens', () => {
    function TestComponent() {
      return (
        <TestRouter>
          <TestScreen
            path='test'
            component={() => <div>Screen 2</div>}
          />
        </TestRouter>
      );
    }
    const router = new TestRouter(
      {
        children: [
          <TestScreen
            key='1'
            path='test/:id'
            component={() => <div>Screen 1</div>}
            defaultParams={{ screen: '1' }}
          />,
          <TestScreen
            key='2'
            path='nested/**'
            component={TestComponent}
            defaultParams={{ screen: '2' }}
          />,
        ],
      },
      null
    );

    const screenChildFromPathname = Object.getOwnPropertyDescriptor(
      RouterBase.prototype,
      'screenChildFromPathname'
    )?.value as RouterBase['screenChildFromPathname'];
    
    expect(
      screenChildFromPathname.call(
        router,
        'nested/test'
      )?.child.props.defaultParams
    ).toStrictEqual({ screen: '2' });
  });
});