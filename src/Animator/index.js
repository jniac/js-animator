import KeyMap from './KeyMap.js'

let updateArray = []

let deltaTime = 1 / 60
let frame = 0
let time = 0

function onUpdate(callback, { thisArg = null, skipFrames = 0 } = {}) {

	if (!callback)
		return

	updateArray.push({

		callback,
		thisArg,
		skipFrames,

	})

}

function onTimeout(delay, callback) {

	let t = time + delay

	Animator.onUpdate(() => {

		if (time >= t)
			callback()

		return time < t

	})

}

function onFrameout(count, callback) {

	let f = frame + count

	Animator.onUpdate(() => {

		if (frame >= f)
			callback()

		return frame < f

	})

}

function during(duration, callback, { delay = 0, onStart = null, onComplete = null } = {}) {

	if (onStart)
		onTimeout(delay, onStart)

	if (duration === 0) {

		onTimeout(delay, () => callback({ progress: 1, time: 0 }))

		if (onComplete)
			onTimeout(delay, onComplete)

		return

	}

	let progress, time = -delay

	Animator.onUpdate(() => {

		time += deltaTime

		if (time < 0)
			return true

		if (time > duration)
			time = duration

		progress = time / duration

		let interrupted = callback({ progress, time }) === false

		if (onComplete && time === duration)
			onComplete()

		if (interrupted)
			return false

		return time < duration

	})

}

function update() {

	requestAnimationFrame(update)

	// The only way to do that efficiently is to:
	// 1 • backup the array, and empty the public one
	// 2 • filter the array by calling each callback (skipping frames if that is the case)
	// 3 • concat the filtered array with the new one, and say this is the public array
	let tmp = updateArray
	updateArray = []
	updateArray = tmp.filter(listener => {

		if (frame % (1 + listener.skipFrames))
			return true

		return listener.callback.apply(listener.thisArg) !== false

	}).concat(updateArray)

	frame++
	time += deltaTime

}

update()









let easeKeyMap = new KeyMap()

function ease(target, key, targetValue, options = {}) {

	let { epsilon = .001, autoEpsilon = true } = options

	if (autoEpsilon)
		epsilon = Math.max(epsilon, Math.abs(targetValue - target[key]) * epsilon)

    if (easeKeyMap.has(target, key)) {

        easeKeyMap.set(target, key, Object.assign({ targetValue, epsilon }, options))

        return

    }

    easeKeyMap.set(target, key, Object.assign({ targetValue, epsilon }, options))

	let { delay = 0 } = options

	let time = -delay, frame = 0

    Animator.onUpdate(() => {

		time += deltaTime

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

		} = easeKeyMap.get(target, key)

        if (canceled) {

			easeKeyMap.delete(target, key)

			return false

		}

        let value = target[key]

		let previous = value

		let delta = targetValue - value

		let complete = Math.abs(delta) < epsilon || forceComplete

		if (complete) {

			value = targetValue

		} else {

			delta *= 1 - decay ** deltaTime

			value += delta

		}

		target[key] = value

		if (onStart && time - deltaTime <= 0)
			onStart({ target, key, value, delta, previous, time, frame })

		if (onUpdate)
			onUpdate({ target, key, value, delta, previous, time, frame })

		if (onThrough) {

			let [threshold, callback] = onThrough

			if (value >= threshold && previous < threshold || value <= threshold && previous > threshold) {

				callback({ target, key, value, delta, previous, time, frame })

			}

		}

		if (onComplete && complete)
			onComplete({ target, key, value, delta, previous, time, frame })

        if (complete) {

			easeKeyMap.delete(target, key)

			return false

		}

		frame++

		return true

    })

}

function cancelEase(target, key) {

	if (easeKeyMap.has(target, key))
		easeKeyMap.assign(target, key, { canceled: true })

}

function forceCompleteEase(target, key) {

	if (easeKeyMap.has(target, key))
		easeKeyMap.assign(target, key, { forceComplete: true })

}







import { resolveEase, resolveBundle } from './utils.js'

let tweenCount = 0

let tweenKeyMap = new KeyMap()

function tween(target, key, params = {}) {

	if (tweenKeyMap.has(target, key))
		tweenKeyMap.get(target, key).canceled = true

	let { duration = 1, delay = 0, from, to, ease, override, onStart, onUpdate, onThrough, onComplete } = params

	ease = resolveEase(ease)

	let { isMultiple, bundle } = resolveBundle(target, key, from, to, ease, override)

	let tween = { id: tweenCount++, target, key, isMultiple, bundle, onStart, onUpdate, onThrough, onComplete, canceled: false, forceComplete: false, params }

	tweenKeyMap.set(target, key, tween)

	let progress, time = -delay, frame = 0

	if (!isMultiple) {

		// single tween

		{

			let [target, key, fx] = bundle
			target[key] = fx(0)

		}

		Animator.onUpdate(() => {

			time += deltaTime

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

			} = tween

	        if (canceled)
				return false

			if (time > duration)
				time = duration

			progress = time / duration

			let complete = time === duration || forceComplete

			let value = fx(progress)

			let previous = target[key]

			target[key] = value

			Object.assign(tween, { value, time, progress })

			if (onStart && time - deltaTime <= 0)
				onStart(tween)

			if (onUpdate)
				onUpdate(tween)

			if (onThrough) {

				let [threshold, callback] = onThrough

				if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
					callback(tween)

			}

			if (onComplete && complete)
				onComplete(tween)

	        if (complete) {

				tweenKeyMap.delete(target, key)

				return false

			}

			frame++

			return true

		})

	} else {

		// multiple tween

		for (let [target, key, fx] of bundle)
			target[key] = fx(0)

		Animator.onUpdate(() => {

			time += deltaTime

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

			} = tween

	        if (canceled)
				return false

			if (time > duration)
				time = duration

			progress = time / duration

			let complete = time === duration || forceComplete

			let previouses = onThrough && bundle.map(([target, key]) => target[key])

			let values = bundle.map(([target, key, fx]) => {

				let value = fx(progress)

				target[key] = value

				return value

			})

			Object.assign(tween, { values, time, progress })

			if (onStart && time - deltaTime <= 0)
				onStart(tween)

			if (onUpdate)
				onUpdate(tween)

			if (onThrough) {

				let onThroughArray = Array.isArray(onThrough) ? onThrough : [onThrough]

				for (let [index, onThroughItem] of onThroughArray.entries()) {

					if (!Array.isArray(onThroughItem))
						continue

					let [threshold, callback] = onThroughItem

					let value = values[index]
					let previous = previouses[index]

					if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
						callback(tween)

				}

			}

			if (onComplete && complete)
				onComplete(tween)

	        if (complete) {

				tweenKeyMap.delete(target, key)

				return false

			}

			frame++

			return true

		})

	}

}

function getTweensOf(target, key = null) {

	let tweens = []

	for (let [currentTarget, dict] of tweenKeyMap.map) {

		if (target === currentTarget) {

			for (let [currentKey, tween] of Object.entries(dict)) {

				if (!key || key === currentKey)
					tweens.push(tween)

			}

		}

	}

	return tweens

}

function cancelTweensOf(target, key = null) {

	for(let tween of getTweensOf(target, key)) {

		tween.canceled = true
		tweenKeyMap.delete(target, tween.key)

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

}

export default Animator
