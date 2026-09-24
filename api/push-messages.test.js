import test from 'node:test';
import assert from 'node:assert/strict';
import { dayReminderPush, restTimerPush, testPush } from './push-messages.js';

test('localizes every server-generated notification in Russian', () => {
  assert.deepEqual(restTimerPush('ru'), {
    title: 'Отдых вышел 💪',
    body: 'Пора на следующий подход.',
    tag: 'rest-timer',
  });
  assert.deepEqual(testPush('ru'), {
    title: 'Cyber Gym',
    body: 'Тестовое уведомление ✅ — вот так выглядят оповещения.',
    tag: 'test',
  });
  assert.deepEqual(dayReminderPush('ru', { name: 'Тренировка A', emoji: '💪' }), {
    title: '💪 Тренировка A сегодня',
    body: 'Она в плане — погнали 💪',
    tag: 'day-reminder',
  });
});

test('localizes every server-generated notification in pt-BR', () => {
  assert.deepEqual(restTimerPush('pt-BR'), {
    title: 'Descanso terminado 💪',
    body: 'Hora da próxima série.',
    tag: 'rest-timer',
  });
  assert.deepEqual(testPush('pt-BR'), {
    title: 'Cyber Gym',
    body: 'Notificação de teste ✅ — é assim que os alertas aparecem.',
    tag: 'test',
  });
  assert.deepEqual(dayReminderPush('pt-BR', { name: 'Treino A', emoji: '💪' }), {
    title: '💪 Treino A hoje',
    body: 'Está no seu plano — vamos treinar 💪',
    tag: 'day-reminder',
  });
});

test('falls back to Russian, the product language, for anything else', () => {
  assert.deepEqual(restTimerPush('fr'), restTimerPush('ru'));
  assert.equal(dayReminderPush('unknown', null).title, 'Сегодня тренировка по плану');
  assert.equal(testPush(undefined).body, 'Тестовое уведомление ✅ — вот так выглядят оповещения.');
  // The English copy is still carried, it is simply no longer the fallback.
  assert.equal(testPush('en').body, 'Test notification ✅ — this is what alerts look like.');
});
