// export class SequenceEffect extends GroupEffect {
// 	constructor(effects: KeyframeEffect[]) {
// 		super(effects);
// 		if (effects.length == 0)
// 			return;
// 		const firstDelay = this.children[0].getComputedTiming().delay;
// 		let accumulatedDelay = firstDelay ? firstDelay : 0;
// 		for (let i = 1; i < this.children.length; ++i) {
// 			let {delay = 0, startTime = 0, endTime = 0} = this.children[i].getComputedTiming();
// 			if (startTime instanceof CSSNumericValue)
// 				startTime = startTime.to('ms').value;
// 			if (endTime instanceof CSSNumericValue)
// 				endTime = endTime.to('ms').value;

// 			if (delay)
// 				accumulatedDelay += delay;

// 			accumulatedDelay += (endTime - startTime);
// 			this.children[i].updateTiming({delay: accumulatedDelay});
// 		}
// 	}
// }