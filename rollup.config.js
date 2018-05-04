import path from 'path'

function date() {

	let date = new Date()

	const f = n => n.toFixed().padStart(2, '0')
	const signed = n => n < 0 ? n.toString() : '+' + n.toString()

	let gmt = signed(-date.getTimezoneOffset() / 60)

	return date.getFullYear() + '-' + f(1 + date.getMonth()) + '-' + f(date.getDate()) + ' ' + f(date.getHours()) + ':' + f(date.getMinutes()) + ` GMT(${gmt})`

}

function banner() {

	return `

/*

	Animator.js
	${date()}

*/

`.trim() + '\n'

}

export default {
	input: './src/Animator/index.js',
	plugins: [

	],
	// external: [path.resolve('./src/event.js')],
	// sourceMap: true,
	output: [
		// {
		// 	format: 'umd',
		// 	name: 'timeline',
		// 	file: 'build/timeline.bundle.js',
		// 	indent: '\t'
		// },
		{
			format: 'es',
			file: 'build/Animator.js',
			banner: banner(),
			indent: '\t'
		}
	]
}
