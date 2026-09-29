import { test } from '@japa/runner'
import { allowedTransitions, canTransition, isFinalStatus } from '#domain/order_status'

test.group('Order status flow', () => {
  test('follows pending → preparing → ready → completed', ({ assert }) => {
    assert.isTrue(canTransition('pending', 'preparing'))
    assert.isTrue(canTransition('preparing', 'ready'))
    assert.isTrue(canTransition('ready', 'completed'))
  })

  test('does not skip or go back', ({ assert }) => {
    assert.isFalse(canTransition('pending', 'ready'))
    assert.isFalse(canTransition('pending', 'completed'))
    assert.isFalse(canTransition('ready', 'preparing'))
    assert.isFalse(canTransition('preparing', 'pending'))
  })

  test('cancels any order that is not finished', ({ assert }) => {
    assert.isTrue(canTransition('pending', 'canceled'))
    assert.isTrue(canTransition('preparing', 'canceled'))
    assert.isTrue(canTransition('ready', 'canceled'))
    assert.isFalse(canTransition('completed', 'canceled'))
  })

  test('a canceled order never changes again', ({ assert }) => {
    assert.isTrue(isFinalStatus('canceled'))
    assert.deepEqual(allowedTransitions('canceled'), [])
    for (const status of ['pending', 'preparing', 'ready', 'completed'] as const) {
      assert.isFalse(canTransition('canceled', status))
    }
  })
})
