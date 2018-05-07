# js-animator
animations of js properties (kind of TweenMax)

```javascript
let obj = { x: 0, rotation: 0 }

Animator.tween(obj, 'x', { to: 300 })
Animator.tween(obj, 'x', { from: 100, ease: 'out' })
Animator.tween(obj, 'x,rotation', { from: [100, 0], to: [300, 90], ease: 'out,3', delay: .5, duration: 2 })

Animator.tween(obj, 'x', { to: 300, delay: .4, ease: 'inout',

    onStart: ({ target }) => target.color = 'red',
    onUpdate: () => { ... },
    onThrough: [100, () => console.log('through 100!!')],
    onComplete: ({ target }) => target.color = null,

})

```

### build
```shell
rollup -c
```
et voilà!
