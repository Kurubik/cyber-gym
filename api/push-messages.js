// Push copy per language. Russian is the product language, so it is both the default and the
// fallback: a profile with no stored language gets Russian, not English.
const COPY = {
  ru: {
    restTitle: 'Отдых вышел 💪',
    restBody: 'Пора на следующий подход.',
    testBody: 'Тестовое уведомление ✅ — вот так выглядят оповещения.',
    dayFallbackTitle: 'Сегодня тренировка по плану',
    dayRoutineSuffix: 'сегодня',
    dayBody: 'Она в плане — погнали 💪',
  },
  en: {
    restTitle: 'Rest over 💪',
    restBody: 'Time for your next set.',
    testBody: 'Test notification ✅ — this is what alerts look like.',
    dayFallbackTitle: 'Workout planned today',
    dayRoutineSuffix: 'today',
    dayBody: "It's on your plan — let's go 💪",
  },
  'pt-BR': {
    restTitle: 'Descanso terminado 💪',
    restBody: 'Hora da próxima série.',
    testBody: 'Notificação de teste ✅ — é assim que os alertas aparecem.',
    dayFallbackTitle: 'Treino planejado para hoje',
    dayRoutineSuffix: 'hoje',
    dayBody: 'Está no seu plano — vamos treinar 💪',
  },
};

const copyFor = lang => COPY[lang] || COPY.ru;

export function restTimerPush(lang) {
  const copy = copyFor(lang);
  return { title: copy.restTitle, body: copy.restBody, tag: 'rest-timer' };
}

export function testPush(lang) {
  return { title: 'Cyber Gym', body: copyFor(lang).testBody, tag: 'test' };
}

export function dayReminderPush(lang, routine) {
  const copy = copyFor(lang);
  return {
    title: routine
      ? `${routine.emoji || '🏋️'} ${routine.name} ${copy.dayRoutineSuffix}`
      : copy.dayFallbackTitle,
    body: copy.dayBody,
    tag: 'day-reminder',
  };
}
