import KeyMap from './KeyMap.js'
import Stack from './Stack.js'

// let updateArray = []

let deltaTime = 1 / 60
let frame = 0
let time = 0
let paused = false

let internalUpdateStack = new Stack()
let externalUpdateStack = new Stack()

function updateFrame() {

	internalUpdateStack.update()
	externalUpdateStack.update()

	frame++
	time += deltaTime

}

function update() {

	requestAnimationFrame(update)

	if (paused)
		return

	updateFrame()

}

function onUpdate(callback, options) {

	externalUpdateStack.add(callback, options)

}

function onTimeout(delay, callback) {

	let t = time + delay

	externalUpdateStack.add(() => {

		if (time >= t)
			callback()

		return time < t

	})

}

function onFrameout(count, callback) {

	let f = frame + count

	externalUpdateStack.add(() => {

		if (frame >= f)
			callback()

		return frame < f

	})

}

function during(duration, callback, { delay = 0, onStart = null, onComplete = null } = {}) {

	return new Promise((resolve) => {

		if (onStart)
			onTimeout(delay, onStart)

		if (duration === 0) {

			onTimeout(delay, () => callback({ progress: 1, time: 0 }))

			if (onComplete)
				onTimeout(delay, onComplete)

			return

		}

		let complete, progress, time = -delay

		externalUpdateStack.add(() => {

			time += deltaTime

			if (time < 0)
				return true

			if (time > duration)
				time = duration

			progress = time / duration
			complete = time === duration

			let interrupted = callback({ complete, progress, time }) === false

			if (complete) {

				resolve()

				if (onComplete)
					onComplete()

			}

			if (interrupted) {

				resolve()

				return false

			}

			return !complete

		})

	})


}







// EASE

let easeKeyMap = new KeyMap()

function ease(target, key, targetValue, options = {}) {

	if (!target || typeof target !== 'object')
		throw `Animator.ease() target is not an object (key: ${key})`

	return new Promise((resolve) => {

		cancelTweensOf(target, key)

		let { epsilon = .001, autoEpsilon = true } = options

		if (autoEpsilon)
			epsilon = Math.max(epsilon, Math.abs(targetValue - target[key]) * epsilon)

		let ease = Object.assign(options, { target, key, targetValue, epsilon })

	    if (easeKeyMap.has(target, key)) {

	        easeKeyMap.assign(target, key, ease)

	        return

	    }

	    easeKeyMap.set(target, key, ease)

		let { delay = 0 } = options

		let time = -delay, frame = 0

	    internalUpdateStack.add(() => {

			time += deltaTime

	        if (time < 0)
	            return true

			let ease = easeKeyMap.get(target, key)

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

			} = ease

	        if (canceled) {

				easeKeyMap.delete(target, key)

				resolve()

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

			Object.assign(ease, { value, delta, previous, time, frame })

			if (onStart && time - deltaTime <= 0)
				onStart(ease)

			if (onUpdate)
				onUpdate(ease)

			if (onThrough) {

				for (let i = 0, n = onThrough.length; i < n; i += 2) {

					let threshold = onThrough[i]
					let callback = onThrough[i + 1]

					if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
						callback(ease)

				}

			}

			if (onComplete && complete)
				onComplete(ease)

	        if (complete) {

				easeKeyMap.delete(target, key)

				resolve()

				return false

			}

			frame++

			return true

	    })

	})

}

function getEasingsOf(target, key = null) {

	return easeKeyMap.values(target, key)

}

function cancelEasingsOf(target, key = null) {

	for (let ease of easeKeyMap.values(target, key))
		ease.canceled = true

}

function forceCompleteEasingsOf(target, key = null) {

	for (let ease of easeKeyMap.values(target, key))
		ease.forceComplete = true

}





// TWEEN

import { resolveEase, resolveBundle } from './utils.js'

let tweenCount = 0

let tweenKeyMap = new KeyMap()

function tween(target, key, params = {}) {

	if (!target || typeof target !== 'object')
		throw `Animator.ease() target is not an object (key: ${key})`

	return new Promise((resolve) => {

		cancelEasingsOf(target, key)

		if (tweenKeyMap.has(target, key))
			tweenKeyMap.get(target, key).canceled = true

		let { duration = 1, delay = 0, from, to, ease, override, onStart, onUpdate, onThrough, onComplete, immediate = true } = params

		ease = resolveEase(ease)

		let { isMultiple, bundle } = resolveBundle(target, key, from, to, ease, override)

		let progress = 0, time = -delay, frame = 0

		let tween = { id: tweenCount++, target, key, time, progress, frame, isMultiple, bundle, onStart, onUpdate, onThrough, onComplete, canceled: false, forceComplete: false, params }

		tweenKeyMap.set(target, key, tween)

		let callback = !isMultiple

			? () => {

		        if (time < 0) {

					time += deltaTime

					// NOTE: check for one single first execuation
					if (tween.immediateFirstCall) {

						tween.immediateFirstCall = false

					} else {

						return true

					}

				}

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

				// NOTE: not so simple, read it one more time
				progress = duration === 0 ? 1 : time < 0 ? 0 : time / duration

				let complete = time === duration || forceComplete

				let value = fx(progress)

				let previous = target[key]

				target[key] = value

				Object.assign(tween, { value, time, progress, frame })

				if (onStart && time - deltaTime <= 0)
					onStart(tween)

				if (onUpdate)
					onUpdate(tween)

				if (onThrough) {

					for (let i = 0, n = onThrough.length; i < n; i += 2) {

						let threshold = onThrough[i]
						let callback = onThrough[i + 1]

						if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
							callback(tween)

					}

				}

				if (onComplete && complete)
					onComplete(tween)

		        if (complete) {

					tweenKeyMap.delete(target, key)

					resolve()

					return false

				}

				time += deltaTime
				frame++

				return true

			}

			: () => {

				if (time < 0) {

					time += deltaTime

					// NOTE: check for one single first execuation
					if (tween.immediateFirstCall) {

						tween.immediateFirstCall = false

					} else {

						return true

					}

				}

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

				// NOTE: not so simple, read it one more time
				progress = duration === 0 ? 1 : time < 0 ? 0 : time / duration

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

						for (let i = 0, n = onThroughItem.length; i < n; i += 2) {

							let threshold = onThroughItem[i]
							let callback = onThroughItem[i + 1]

							let value = values[index]
							let previous = previouses[index]

							if (value >= threshold && previous < threshold || value <= threshold && previous > threshold)
								callback(tween)

						}

					}

				}

				if (onComplete && complete)
					onComplete(tween)

		        if (complete) {

					tweenKeyMap.delete(target, key)

					resolve()

					return false

				}

				time += deltaTime
				frame++

				return true

			}

		if (immediate) {

			if (time < 0)
				tween.immediateFirstCall = true

			callback()

		}

		internalUpdateStack.add(callback)

	})

}

function getTweensOf(target, key = null) {

	return tweenKeyMap.values(target, key)

}

function cancelTweensOf(target, key = null) {

	for(let tween of getTweensOf(target, key)) {

		tween.canceled = true
		tweenKeyMap.delete(target, tween.key)

	}

}

function cancel(target, key = null) {

	cancelEasingsOf(target, key)
	cancelTweensOf(target, key)

}









update()

export {

	updateFrame,

	time,
	frame,
	paused,

	onUpdate,
	onTimeout,
	onFrameout,
	during,

	ease,
	getEasingsOf,
	cancelEasingsOf,
	forceCompleteEasingsOf,
	easeKeyMap,

	tween,
	tweenKeyMap,
	getTweensOf,
	cancelTweensOf,

	cancel,

}

let Animator = {

	updateFrame,

	get time() { return time },
	get frame() { return frame },
	set paused(value) { paused = value },
	get paused() { return paused },

	onUpdate,
	onTimeout,
	onFrameout,
	during,

	ease,
	getEasingsOf,
	cancelEasingsOf,
	forceCompleteEasingsOf,
	easeKeyMap,

	tween,
	tweenKeyMap,
	getTweensOf,
	cancelTweensOf,

	cancel,

}

export default Animator
