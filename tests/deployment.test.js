import { strict as assert } from 'node:assert'
import test from 'node:test'
import { formatDuration, getDurationMilliseconds, getTimestamp } from '../src/deployment.js'

test('converte timestamps da Vercel em milissegundos', () => {
  assert.equal(getTimestamp(1700000000000), 1700000000000)
  assert.equal(getTimestamp('2023-11-14T22:13:20.000Z'), 1700000000000)
})

test('calcula a duracao com timestamps numericos ou ISO', () => {
  assert.equal(getDurationMilliseconds(1700000000000, 1700000004123), 4123)
  assert.equal(getDurationMilliseconds('2023-11-14T22:13:20Z', '2023-11-14T22:14:25Z'), 65000)
})

test('formata duracoes curtas e longas', () => {
  assert.equal(formatDuration(42000), '42s')
  assert.equal(formatDuration(125000), '2m 5s')
  assert.equal(formatDuration(Number.NaN), 'indisponivel')
  assert.equal(formatDuration(null), 'indisponivel')
})