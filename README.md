# js-animator
for animations of js properties (kind of TweenMax)

```javascript

Animator.tween(obj, 'x', { to: 300 })
Animator.tween(obj, 'x', { from: 100, ease: 'out' })
Animator.tween(obj, 'x,rotation', { from: [100, 0], to: [300, 90], ease: 'out,3', delay: .5, duration: 2 })

```

### build
```shell
rollup -c
```
et voilà!
