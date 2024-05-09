import { Animation } from './animation';
import { GestureTimeline } from './gesture-timeline';

export * from './group-effect';
export * from './animation';
export * from './parallel-effect';
export * from './common/utils';
const timeline = new GestureTimeline();
const effect = new KeyframeEffect(document.body, [{transform: 'translateX(0)'}, {transform: 'translateX(100px)'}], {duration: 100});
new Animation(effect, timeline);