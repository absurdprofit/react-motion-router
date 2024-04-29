// export interface StaggerOptions {
// 	delay: number; // time gap between two KeyframeEffects
// 	emanation: number; // index of emanative KeyframeEffect
// 	easing: EasingFunction; // function that distributes the start time of each KeyframeEffect
// 	grid: number[];
// }

// export class StaggerEffect extends GroupEffect {
// 	constructor(effects: AnimationEffect[], staggerOptions: StaggerOptions) {
// 		super(effects);
// 		if (effects.length == 0)
// 			return;
// 		let emanation = staggerOptions.emanation;
// 		if (emanation < 0 || emanation >= this.children.length)
// 			return;
// 		for (let i = 0; i < this.children.length; ++i) {
// 			let delay = this.children[i].getComputedTiming().delay ?? 0;
// 			delay += this.calculateDistance(emanation, i, staggerOptions) * staggerOptions.delay;
// 			const easing = staggerOptions.easing;
// 			this.children[i].updateTiming({easing, delay});
// 		}
// 	}

// 	calculateDistance(emanation: number, target: number, staggerOptions: StaggerOptions) {
// 		let row = 1, col = this.children.length;
// 		if (staggerOptions.grid) {
// 			row = staggerOptions.grid[0];
// 			col = staggerOptions.grid[1];
// 		} 
// 		let x1 = emanation % col;
// 		let y1 = Math.floor(emanation / col);

// 		let x2 = target % col;
// 		let y2 = Math.floor(target / col);

// 		return Math.sqrt(Math.pow(Math.abs(x1-x2),2) + Math.pow(Math.abs(y1-y2),2));
// 	}
// }