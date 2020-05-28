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
    onThrough: [

        100, () => console.log('through 100!!'),
        200, () => console.log('through 200!!'),

    ],
    onComplete: ({ target }) => target.color = null,

})

```

# features

### Promise
```javascript
await Animator.tween(obj, 'x', { to: 100 })
await Animator.tween(obj, 'y', { to: 100 })
```

### Errors
```javascript
Animator.ease(null, 'x', 100)
// Error: Animator.ease() target is not an object (key: x)
Animator.tween(null, 'x', { to: 100 })
// Animator.tween() target is not an object (key: x)
```

### Multiple key
```javascript
Animator.tween(obj, 'x,rotation', { to: [100, 90] })
```

### from, to
```javascript
Animator.tween(obj, 'x,rotation', { to: [300, 90] })
Animator.tween(obj, 'x,rotation', { from: [100, -90] })
Animator.tween(obj, 'x,rotation', { from: [100, -90], to: [300, 90] })
```

### callbacks
```javascript
Animator.tween(obj, 'x', { to: 300, delay: .4, ease: 'inout',

    onStart: ({ target }) => target.color = 'red',
    onUpdate: () => { ... },
    onThrough: [

        100, () => console.log('through 100!!'),
        200, () => console.log('through 200!!'),

    ],
    onComplete: ({ target }) => target.color = null,

})
```

### canceling
```javascript
Animator.tween(obj, 'x', { to: 100 })
Animator.ease(obj, 'rotation', 180)

Animator.cancelEasingsOf(obj)
Animator.cancelTweensOf(obj)
// or
Animator.cancel(obj)
```

options:
```javascript
// cancel animation for only one property
Animator.cancel(obj, 'x')
```




### build
```shell
rollup -c && git add build && git commit -m "Build" && git push
```
et voilà!
