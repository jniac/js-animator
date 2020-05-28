export const identity = x => x

/**
 * https://jsfiddle.net/jniac/1qpum68z/
 * @param  {Number} x the value
 * @param  {Number} p the power
 * @param  {Number} m the middle of the ease
 * @return {Number}
 */
export const inout = (x, p = 3, i = .5, clamp = true) => {

	if (clamp)
		x = x < 0 ? 0 : x > 1 ? 1 : x

	return x === i
		? x
		: x < i
		? 1 / Math.pow(i, p - 1) * Math.pow(x, p)
		: 1 - 1 / Math.pow(1 - i, p - 1) * Math.pow(1 - x, p)
}

/**
 * https://www.desmos.com/calculator/9h6o072i43
 * @param  {Number} x
 * @param  {Number} [a=3] power in
 * @param  {Number} [b=5] power out
 * @param  {Number} [k=-1] k, a scalar, is slow to compute, could be defined for faster predefined ease
 * @return {Number}
 */
export const pcurve = (x, a = 3, b = 5, k = -1) => {

	return (x <= 0 || x >= 1) ? 0 : (
		k !== -1 ? k :
		Math.pow(a + b, a + b) / (Math.pow(a, a) * Math.pow(b, b))
	) * Math.pow(x, a) * Math.pow(1 - x, b)
}
