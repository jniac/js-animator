/*

	Animator.js
	2018-05-04 15:10 GMT(+2)

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

    *values() {

        for (let [target, dict] of this.map) {

            for (let key in dict)
                yield dict[key];

        }

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

let updateArray = [];

let deltaTime = 1 / 60;
let frame = 0;
let time = 0;

function onUpdate(callback, { thisArg = null, skipFrames = 0 } = {}) {

	if (!callback)
		return

	updateArray.push({

		callback,
		thisArg,
		skipFrames,

	});

}

function onTimeout(delay, callback) {

	let t = time + delay;

	Animator.onUpdate(() => {

		if (time >= t)
			callback();

		return time < t

	});

}

function onFrameout(count, callback) {

	let f = frame + count;

	Animator.onUpdate(() => {

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

	Animator.onUpdate(() => {

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

function update() {

	requestAnimationFrame(update);

	// The only way to do that efficiently is to:
	// 1 • backup the array, and empty the public one
	// 2 • filter the array by calling each callback (skipping frames if that is the case)
	// 3 • concat the filtered array with the new one, and say this is the public array
	let tmp = updateArray;
	updateArray = [];
	updateArray = tmp.filter(listener => {

		if (frame % (1 + listener.skipFrames))
			return true

		return listener.callback.apply(listener.thisArg) !== false

	}).concat(updateArray);

	frame++;
	time += deltaTime;

}

update();









let easeKeyMap = new KeyMap();

function ease(target, key, targetValue, options = {}) {

	let { epsilon = .001, autoEpsilon = true } = options;

	if (autoEpsilon)
		epsilon = Math.max(epsilon, Math.abs(targetValue - target[key]) * epsilon);

    if (easeKeyMap.has(target, key)) {

        easeKeyMap.set(target, key, Object.assign({ targetValue, epsilon }, options));

        return

    }

    easeKeyMap.set(target, key, Object.assign({ targetValue, epsilon }, options));

	let { delay = 0 } = options;

	let time = -delay, frame = 0;

    Animator.onUpdate(() => {

		time += deltaTime;

        if (time < 0)
            return true

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

		} = easeKeyMap.get(target, key);

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

		if (onStart && time - deltaTime <= 0)
			onStart({ target, key, value, delta, previous, time, frame });

		if (onUpdate)
			onUpdate({ target, key, value, delta, previous, time, frame });

		if (onThrough) {

			let [threshold, callback] = onThrough;

			if (value >= threshold && previous < threshold || value <= threshold && previous > threshold) {

				callback({ target, key, value, delta, previous, time, frame });

			}

		}

		if (onComplete && complete)
			onComplete({ target, key, value, delta, previous, time, frame });

        if (complete) {

			easeKeyMap.delete(target, key);

			return false

		}

		frame++;

		return true

    });

}

function cancelEase(target, key) {

	if (easeKeyMap.has(target, key))
		easeKeyMap.assign(target, key, { canceled: true });

}

function forceCompleteEase(target, key) {

	if (easeKeyMap.has(target, key))
		easeKeyMap.assign(target, key, { forceComplete: true });

}







let tweenCount = 0;

let tweenKeyMap = new KeyMap();

function tween(target, key, params = {}) {

	if (tweenKeyMap.has(target, key))
		tweenKeyMap.get(target, key).canceled = true;

	let { duration = 1, delay = 0, from, to, ease, override, onStart, onUpdate, onThrough, onComplete } = params;

	ease = resolveEase(ease);

	let { isMultiple, bundle } = resolveBundle(target, key, from, to, ease, override);

	let tween = { id: tweenCount++, target, key, isMultiple, bundle, onStart, onUpdate, onThrough, onComplete, canceled: false, forceComplete: false, params };

	tweenKeyMap.set(target, key, tween);

	let progress, time = -delay;

	if (!isMultiple) {

		// single tween

		{

			let [target, key, fx] = bundle;
			target[key] = fx(0);

		}

		Animator.onUpdate(() => {

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

			Object.assign(tween, { value, time, progress });

			if (onStart && time - deltaTime <= 0)
				onStart(tween);

			if (onUpdate)
				onUpdate(tween);

			if (onThrough) {

				let [threshold, callback] = onThrough;

				if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
					callback(tween);

			}

			if (onComplete && complete)
				onComplete(tween);

	        if (complete) {

				tweenKeyMap.delete(target, key);

				return false

			}

			return true

		});

	} else {

		// multiple tween

		for (let [target, key, fx] of bundle)
			target[key] = fx(0);

		Animator.onUpdate(() => {

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

					let [threshold, callback] = onThroughItem;

					let value = values[index];
					let previous = previouses[index];

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

			return true

		});

	}

}

function getTweensOf(target, key = null) {

	let tweens = [];

	for (let [currentTarget, dict] of tweenKeyMap.map) {

		if (target === currentTarget) {

			for (let [currentKey, tween] of Object.entries(dict)) {

				if (!key || key === currentKey)
					tweens.push(tween);

			}

		}

	}

	return tweens

}

function cancelTweensOf(target, key = null) {

	for(let tween of getTweensOf(target, key)) {

		tween.canceled = true;
		tweenKeyMap.delete(target, tween.key);

	}

}










let Animator = {

	get time() { return time },
	get frame() { return frame },

	onUpdate,
	onTimeout,
	onFrameout,
	during,

	ease,
	cancelEase,
	forceCompleteEase,
	easeKeyMap,

	tween,
	tweenKeyMap,
	getTweensOf,
	cancelTweensOf,

};

export default Animator;
