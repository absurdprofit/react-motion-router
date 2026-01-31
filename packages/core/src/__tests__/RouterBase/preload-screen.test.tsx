import { describe, expect, it } from 'vitest';
import { TestRouter, TestScreen } from '../common/utils';
import { RouterBase } from '../../RouterBase';

describe('Router.preloadScreen', () => {
  it('returns undefined', async () => {
    const router = new TestRouter(
      {
        children: [
          <TestScreen key='1' path='*' component={() => <div>Test</div>} />,
        ],
      },
      null
    );
    router.componentDidMount();

    const preloadScreen = Object.getOwnPropertyDescriptor(
      RouterBase.prototype,
      'preloadScreen'
    )?.value as RouterBase['preloadScreen'];

    expect(
      preloadScreen.call(
        router,
        <TestScreen path='' component={() => <></>} />
      )
    )
      .resolves.toBeUndefined();
    router.componentWillUnmount();
  });
});