(() => {
  'use strict';

  const form = document.querySelector('[data-category-precheck]');
  const result = document.getElementById('precheck-result');
  const title = document.getElementById('precheck-result-title');
  const summary = document.getElementById('precheck-result-summary');
  const reasons = document.getElementById('precheck-result-reasons');
  const error = document.getElementById('precheck-error');
  const submitButton = document.getElementById('precheck-submit');
  if (!form || !result || !title || !summary || !reasons || !error || !submitButton) return;

  const questionNames = [...new Set(
    [...form.querySelectorAll('input[type="radio"]')].map((input) => input.name)
  )];

  submitButton.addEventListener('click', () => {
    const selected = questionNames.map((name) =>
      form.querySelector(`input[name="${name}"]:checked`)
    );
    const missing = selected.some((input) => !input);
    error.hidden = !missing;

    if (missing) {
      result.hidden = true;
      error.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const stopItems = selected.filter((input) => input.dataset.level === 'stop');
    const reviewItems = selected.filter((input) => input.dataset.level === 'review');
    const readyItems = selected.filter((input) => input.dataset.level === 'ready');

    let heading;
    let lead;
    let output;
    if (stopItems.length > 0) {
      heading = '申込みや発送を進めず、先に確認してください';
      lead = '安全・所有・データ等に関する重要な未確認項目があります。解決してから売却方法を選びます。';
      output = [...stopItems, ...reviewItems, ...readyItems];
    } else if (reviewItems.length > 0) {
      heading = '公式条件を確認してから進める段階です';
      lead = '基本情報は整理できていますが、未確認項目があります。利用する事業者の公式条件と照合してください。';
      output = [...reviewItems, ...readyItems];
    } else {
      heading = '申込み前の基本準備を整理できました';
      lead = 'このページで扱う確認項目は整理できました。対象商品・地域・費用・返却条件は公式情報で最終確認してください。';
      output = readyItems;
    }

    title.textContent = heading;
    summary.textContent = lead;
    reasons.replaceChildren(...output.map((input) => {
      const item = document.createElement('li');
      item.textContent = input.dataset.message || '選択内容を確認してください。';
      return item;
    }));

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      result.hidden = true;
      error.hidden = true;
      title.textContent = '';
      summary.textContent = '';
      reasons.replaceChildren();
    }, 0);
  });
})();
