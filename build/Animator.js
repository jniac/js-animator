/*

	Animator.js
	2018-05-21 22:24 GMT(+2)
	https://github.com/jniac/js-animator

	MIT License
	
	Copyright (c) 2018 Joseph Merdrignac
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

*/

class KeyMap {

    constructor() {

        this.map = new Map();

    }

    get size() { return this.map.size }

    has(target, key) {

        let dict = this.map.get(target);

        return !!(dict && key in dict)

    }

    set(target, key, object) {

        let dict = this.map.get(target);

        if (dict) {

            dict[key] = object;

        } else {

            this.map.set(target, { [key]: object });

        }

    }

    assign(target, key, props) {

        let object = this.get(target, key, { create: true });

        Object.assign(object, props);

    }

    get(target, key, { create = false } = {}) {

        let dict = this.map.get(target);

        if (!dict && !create)
            return undefined

        if (!dict) {

            dict = {};
            this.map.set(target, dict);

        }

        let value = dict[key];

        if (!value && !create)
            return undefined

        if (!value) {

            value = {};
            dict[key] = value;

        }

        return value

    }

    delete (target, key) {

        let dict = this.map.get(target);

        if (dict) {

            delete dict[key];

            if (Object.keys(dict).length === 0)
                this.map.delete(target);

        }

    }

    *[Symbol.iterator]() {

        for (let [target, dict] of this.map) {

            for (let key in dict)
                yield [target, key, dict[key]];

        }

    }

    entries(target = null, key = null) {

        let entries = [];

    	for (let [currentTarget, dict] of this.map) {

    		if (!target || target === currentTarget) {

                for (let currentKey in dict) {

    				if (!key || key === currentKey)
                        entries.push([currentTarget, currentKey, dict[currentKey]]);

    			}

    		}

    	}

    	return entries

    }

    values(target = null, key = null) {

        let values = [];

        for (let [currentTarget, dict] of this.map) {

            if (!target || target === currentTarget) {

                for (let currentKey in dict) {

                    if (!key || key === currentKey)
                        values.push(dict[currentKey]);

                }

            }

        }

        return values

    }

}

class Stack {

    constructor() {

        this.array = [];
        this.frame = 0;

    }

    update() {

        let { array, frame } = this;

        let tmp = this.array;
    	this.array = [];
    	this.array = tmp.filter(({ callback, thisArg, args, skip }) => {

    		if (frame % (1 + skip))
    			return true

    		return callback.apply(thisArg, args) !== false

    	}).concat(this.array);

        frame++;

        Object.assign(this, { frame });

    }

    add(callback, { thisArg = null, args = null, skip = 0 } = {}) {

    	if (!callback)
    		return

    	let listener = {

    		callback,
    		thisArg,
            args,
    		skip,

    	};

    	this.array.push(listener);

    	return listener

    }

}

const identity = x => x;

function parseNumber(s) {

    if (s.includes('/')) {

        let [a, b] = s.split('/');

        return parseFloat(a) / parseFloat(b)

    }

    return parseFloat(s)

}

function resolveEase(ease) {

	if (typeof ease === 'string') {

		let [fn, ...params] = ease.split(',');

		params = params.map(parseNumber);

		if (/gain|inout/.test(fn))
			return gainBind(...params)

		if (fn === 'in') {

			let pow = params[0] || 2;

			return x => x ** pow

		}

		if (fn === 'out') {

			let pow = params[0] || 2;

			return x => 1 - (1 - x) ** pow

		}

	}

	if (typeof ease === 'function')
		return ease

	return identity

}

function resolveValue(value, currentValue) {

	if (typeof value === 'number')
		return value

	if (typeof value === 'string') {

		if (value.slice(0, 2) === '+=')
			return currentValue + parseFloat(value.slice(2))

		if (value.slice(0, 2) === '-=')
			return currentValue - parseFloat(value.slice(2))

		if (value.slice(0, 2) === '*=')
			return currentValue * parseFloat(value.slice(2))

		if (value.slice(0, 2) === '/=')
			return currentValue / parseFloat(value.slice(2))

	}

	return NaN

}

function resolveBundleEntry(target, key, from, to, ease, override) {

    if (to !== undefined && from === undefined) {

        from = target[key];
        to = resolveValue(to, from);

    }

    if (to === undefined && from !== undefined) {

        to = target[key];
        from = resolveValue(from, to);

    }

    let fx = override || (x => from + (to - from) * ease(x));

    return [target, key, fx]

}


/**
 * returns [target, key, fx] or an array of [target, key, fx], eg:
 * => [{}, 'x', 100, 200]
 * => [[{}, 'x', 100, 200], [{}, 'rotation', 0, 90]]
 */
function resolveBundle(target, key, from, to, ease, override) {

    let bundle, keys = key.includes(',') && key.split(',').map(s => s.trim());

    if (!keys) {

        bundle = resolveBundleEntry(target, key, from, to, ease, override);

    } else {

        bundle = keys.map((key, index) => {

            let fromValue = Array.isArray(from) ? from[index] : from;
            let toValue = Array.isArray(to) ? to[index] : to;

            return resolveBundleEntry(target, key, fromValue, toValue, ease, override)

        });

    }

    return { isMultiple: !!keys, bundle }

}









/**
 * https://jsfiddle.net/jniac/1qpum68z/
 * @param x the value
 * @param p the power
 * @param m the middle of the ease
 */


/**
 * binded version of gain(), usage:
 * f = Mth.gainBind(3, 1/3)
 * y = f(x)
 */
function gainBind(p = 3, i = .5, clamp = true) {

	return x => {

		if (clamp)
			x = x < 0 ? 0 : x > 1 ? 1 : x;

		return x === i
			? x
			: x < i
			? 1 / Math.pow(i, p - 1) * Math.pow(x, p)
			: 1 - 1 / Math.pow(1 - i, p - 1) * Math.pow(1 - x, p)

	}

}

// let updateArray = []

let deltaTime = 1 / 60;
let frame = 0;
let time = 0;
let paused = false;

let internalUpdateStack = new Stack();
let externalUpdateStack = new Stack();

function updateFrame() {

	internalUpdateStack.update();
	externalUpdateStack.update();

	frame++;
	time += deltaTime;

}

function update() {

	requestAnimationFrame(update);

	if (paused)
		return

	updateFrame();

}

function onUpdate(callback, options) {

	externalUpdateStack.add(callback, options);

}

function onTimeout(delay, callback) {

	let t = time + delay;

	externalUpdateStack.add(() => {

		if (time >= t)
			callback();

		return time < t

	});

}

function onFrameout(count, callback) {

	let f = frame + count;

	externalUpdateStack.add(() => {

		if (frame >= f)
			callback();

		return frame < f

	});

}

function during(duration, callback, { delay = 0, onStart = null, onComplete = null } = {}) {

	if (onStart)
		onTimeout(delay, onStart);

	if (duration === 0) {

		onTimeout(delay, () => callback({ progress: 1, time: 0 }));

		if (onComplete)
			onTimeout(delay, onComplete);

		return

	}

	let progress, time = -delay;

	externalUpdateStack.add(() => {

		time += deltaTime;

		if (time < 0)
			return true

		if (time > duration)
			time = duration;

		progress = time / duration;

		let interrupted = callback({ progress, time }) === false;

		if (onComplete && time === duration)
			onComplete();

		if (interrupted)
			return false

		return time < duration

	});

}







// EASE

let easeKeyMap = new KeyMap();

function ease(target, key, targetValue, options = {}) {

	cancelTweensOf(target, key);

	let { epsilon = .001, autoEpsilon = true } = options;

	if (autoEpsilon)
		epsilon = Math.max(epsilon, Math.abs(targetValue - target[key]) * epsilon);

	let ease = Object.assign(options, { target, key, targetValue, epsilon });

    if (easeKeyMap.has(target, key)) {

        easeKeyMap.assign(target, key, ease);

        return

    }

    easeKeyMap.set(target, key, ease);

	let { delay = 0 } = options;

	let time = -delay, frame = 0;

    internalUpdateStack.add(() => {

		time += deltaTime;

        if (time < 0)
            return true

		let ease = easeKeyMap.get(target, key);

        let {

			targetValue,
			epsilon,
			onStart = null,
			onUpdate = null,
			onComplete = null,
			onThrough = null,
			decay = .01,
			canceled = false,
			forceComplete = false,

		} = ease;

        if (canceled) {

			easeKeyMap.delete(target, key);

			return false

		}

        let value = target[key];

		let previous = value;

		let delta = targetValue - value;

		let complete = Math.abs(delta) < epsilon || forceComplete;

		if (complete) {

			value = targetValue;

		} else {

			delta *= 1 - decay ** deltaTime;

			value += delta;

		}

		target[key] = value;

		Object.assign(ease, { value, delta, previous, time, frame });

		if (onStart && time - deltaTime <= 0)
			onStart(ease);

		if (onUpdate)
			onUpdate(ease);

		if (onThrough) {

			for (let i = 0, n = onThrough.length; i < n; i += 2) {

				let threshold = onThrough[i];
				let callback = onThrough[i + 1];

				if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
					callback(ease);

			}

		}

		if (onComplete && complete)
			onComplete(ease);

        if (complete) {

			easeKeyMap.delete(target, key);

			return false

		}

		frame++;

		return true

    });

}

function cancelEasingsOf(target, key = null) {

	for (let ease of easeKeyMap.values(target, key))
		ease.canceled = true;

}

function forceCompleteEasingsOf(target, key = null) {

	for (let ease of easeKeyMap.values(target, key))
		ease.forceComplete = true;

}





// TWEEN

let tweenCount = 0;

let tweenKeyMap = new KeyMap();

function tween(target, key, params = {}) {

	cancelEasingsOf(target, key);

	if (tweenKeyMap.has(target, key))
		tweenKeyMap.get(target, key).canceled = true;

	let { duration = 1, delay = 0, from, to, ease, override, onStart, onUpdate, onThrough, onComplete } = params;

	ease = resolveEase(ease);

	let { isMultiple, bundle } = resolveBundle(target, key, from, to, ease, override);

	let progress = 0, time = -delay, frame = 0;

	let tween = { id: tweenCount++, target, key, time, progress, frame, isMultiple, bundle, onStart, onUpdate, onThrough, onComplete, canceled: false, forceComplete: false, params };

	tweenKeyMap.set(target, key, tween);

	if (!isMultiple) {

		// single tween

		{

			let [target, key, fx] = bundle;
			target[key] = fx(0);

		}

		internalUpdateStack.add(() => {

			time += deltaTime;

	        if (time < 0)
	            return true

	        let {

				bundle: [,, fx],
				onStart = null,
				onUpdate = null,
				onComplete = null,
				onThrough = null,
				canceled = false,
				forceComplete = false,

			} = tween;

	        if (canceled)
				return false

			if (time > duration)
				time = duration;

			progress = time / duration;

			let complete = time === duration || forceComplete;

			let value = fx(progress);

			let previous = target[key];

			target[key] = value;

			Object.assign(tween, { value, time, progress, frame });

			if (onStart && time - deltaTime <= 0)
				onStart(tween);

			if (onUpdate)
				onUpdate(tween);

			if (onThrough) {

				for (let i = 0, n = onThrough.length; i < n; i += 2) {

					let threshold = onThrough[i];
					let callback = onThrough[i + 1];

					if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
						callback(tween);

				}

			}

			if (onComplete && complete)
				onComplete(tween);

	        if (complete) {

				tweenKeyMap.delete(target, key);

				return false

			}

			frame++;

			return true

		});

	} else {

		// multiple tween

		for (let [target, key, fx] of bundle)
			target[key] = fx(0);

		internalUpdateStack.add(() => {

			time += deltaTime;

	        if (time < 0)
	            return true

	        let {

				bundle,
				onStart = null,
				onUpdate = null,
				onComplete = null,
				onThrough = null,
				canceled = false,
				forceComplete = false,

			} = tween;

	        if (canceled)
				return false

			if (time > duration)
				time = duration;

			progress = time / duration;

			let complete = time === duration || forceComplete;

			let previouses = onThrough && bundle.map(([target, key]) => target[key]);

			let values = bundle.map(([target, key, fx]) => {

				let value = fx(progress);

				target[key] = value;

				return value

			});

			Object.assign(tween, { values, time, progress });

			if (onStart && time - deltaTime <= 0)
				onStart(tween);

			if (onUpdate)
				onUpdate(tween);

			if (onThrough) {

				let onThroughArray = Array.isArray(onThrough) ? onThrough : [onThrough];

				for (let [index, onThroughItem] of onThroughArray.entries()) {

					if (!Array.isArray(onThroughItem))
						continue

					for (let i = 0, n = onThroughItem.length; i < n; i += 2) {

						let threshold = onThroughItem[i];
						let callback = onThroughItem[i + 1];

						let value = values[index];
						let previous = previouses[index];

						if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
							callback(tween);

					}

				}

			}

			if (onComplete && complete)
				onComplete(tween);

	        if (complete) {

				tweenKeyMap.delete(target, key);

				return false

			}

			frame++;

			return true

		});

	}

}

function getTweensOf(target, key = null) {

	return tweenKeyMap.values(target, key)

}

function cancelTweensOf(target, key = null) {

	for(let tween of getTweensOf(target, key)) {

		tween.canceled = true;
		tweenKeyMap.delete(target, tween.key);

	}

}

function cancel(target, key = null) {

	cancelEasingsOf(target, key);
	cancelTweensOf(target, key);

}









update();

let Animator = {

	updateFrame,

	get time() { return time },
	get frame() { return frame },
	set paused(value) { paused = value; },
	get paused() { return paused },

	onUpdate,
	onTimeout,
	onFrameout,
	during,

	ease,
	cancelEasingsOf,
	forceCompleteEasingsOf,
	easeKeyMap,

	tween,
	tweenKeyMap,
	getTweensOf,
	cancelTweensOf,

	cancel,

};

export default Animator;
export { updateFrame, time, frame, paused, onUpdate, onTimeout, onFrameout, during, ease, cancelEasingsOf, forceCompleteEasingsOf, easeKeyMap, tween, tweenKeyMap, getTweensOf, cancelTweensOf, cancel };
