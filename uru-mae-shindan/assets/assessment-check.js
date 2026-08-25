(() => {
  'use strict';

  const form = document.getElementById('assessment-check-form');
  const result = document.getElementById('assessment-result');
  const title = document.getElementById('assessment-result-title');
  const summary = document.getElementById('assessment-result-summary');
  const reasons = document.getElementById('assessment-result-reasons');
  const error = document.getElementById('assessment-error');
  const affiliateOffer = document.getElementById('instrument-affiliate-offer');
  const affiliateTemplate = document.getElementById('instrument-affiliate-template');
  const affiliateLink = document.getElementById('instrument-affiliate-link');
  if (!form || !result || !title || !summary || !reasons || !error || !affiliateOffer || !affiliateTemplate || !affiliateLink) return;

  const requiredNames = ['history', 'item', 'region', 'eligibleItem', 'deadline', 'method'];

  const addReason = (list, text) => list.push(text);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const missing = requiredNames.some((name) => !data.get(name));
    error.hidden = !missing;
    if (missing) {
      result.hidden = true;
      affiliateOffer.hidden = true;
      affiliateLink.replaceChildren();
      error.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const blockers = [];
    const warnings = [];
    const positives = [];

    const history = data.get('history');
    if (history === 'used') addReason(blockers, '新規利用だけを成果・受付対象とするサービスでは、過去利用や同一世帯の再申込みが対象外になる場合があります。');
    else if (history === 'unknown') addReason(warnings, '本人・同一世帯の過去利用歴を確認してください。');
    else addReason(positives, '初回利用として整理されています。');

    const item = data.get('item');
    if (item === 'piano') addReason(blockers, 'ピアノ・電子ピアノ等を対象外とする楽器買取サービスがあります。ピアノ専門サービスも比較してください。');
    else if (item === 'japanese') addReason(blockers, '和楽器を対象外とするサービスがあります。和楽器対応の専門店を確認してください。');
    else if (item === 'audio') addReason(warnings, 'オーディオ機器は楽器買取とは別区分になる場合があります。対象品を事前確認してください。');
    else if (item === 'unknown') addReason(warnings, '商品名・型番を整理し、対象品かを事前確認してください。');
    else addReason(positives, '一般的な楽器・機材の区分として整理されています。');

    const region = data.get('region');
    if (region === 'okinawa-miyazaki') addReason(blockers, '沖縄県・宮崎県を対象外とする出張査定サービスがあります。宅配・店頭・別事業者も比較してください。');
    else if (region === 'hokkaido-outside-sapporo') addReason(blockers, '北海道では札幌市以外を対象外とする出張査定サービスがあります。');
    else if (region === 'aomori-akita-winter') addReason(blockers, '青森県・秋田県は冬季に対象外となるサービスがあります。時期と地域条件を確認してください。');
    else if (region === 'aomori-akita-other') addReason(warnings, '青森県・秋田県は季節によって対応条件が変わる場合があります。申込時点の条件を確認してください。');
    else addReason(positives, '選択した地域は、今回の事前確認上の明確な除外候補には該当していません。');

    const eligibleItem = data.get('eligibleItem');
    if (eligibleItem === 'no') addReason(blockers, 'コピー品や買取不可品だけの申込みは対象外になるため、申込みを進めないでください。');
    else if (eligibleItem === 'unknown') addReason(warnings, '少なくとも1点が買取対象になり得るか、型番・状態を伝えて事前確認してください。');
    else addReason(positives, '買取対象になり得る実物商品がある前提で整理されています。');

    const deadline = data.get('deadline');
    if (deadline === 'no') addReason(blockers, '一定期間内の査定完了が成果条件になる場合があります。日程を確保してから申し込んでください。');
    else if (deadline === 'unknown') addReason(warnings, '査定日時・発送・訪問日程を確認し、期限内に完了できるか確認してください。');
    else addReason(positives, '申込み後の査定日程を確保できる見込みです。');

    const method = data.get('method');
    const methodText = {
      visit: '出張査定では対象地域、訪問料、搬出条件、契約書面を確認してください。',
      delivery: '宅配査定では送料、梱包、返送料、キャンセル、入金時期を確認してください。',
      store: '店頭査定では持込み費用、本人確認、支払方法、持ち帰り条件を確認してください。',
      undecided: '出張・宅配・店頭の費用と手間を比較してから方法を選んでください。'
    };
    addReason(positives, methodText[method]);

    let heading;
    let lead;
    let output;
    if (blockers.length > 0) {
      heading = 'そのまま申し込まず、対象条件を再確認してください';
      lead = '対象外となる可能性が高い項目があります。別の買取方法やフリマも含めて比較するのが安全です。';
      output = [...blockers, ...warnings, ...positives];
    } else if (warnings.length > 0) {
      heading = '公式条件を確認してから申し込む段階です';
      lead = '明確な対象外候補はありませんが、未確認事項があります。商品名・地域・利用歴を伝えて確認してください。';
      output = [...warnings, ...positives];
    } else {
      heading = '申込み前の基本条件を整理できました';
      lead = '事前確認上の大きな除外候補は見当たりません。公式条件と費用を確認したうえで判断してください。';
      output = positives;
    }

    title.textContent = heading;
    summary.textContent = lead;
    reasons.replaceChildren(...output.map((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));

    const showAffiliateOffer = blockers.length === 0 && warnings.length === 0 && method === 'visit';
    affiliateOffer.hidden = !showAffiliateOffer;
    if (showAffiliateOffer) {
      if (!affiliateLink.hasChildNodes()) affiliateLink.append(affiliateTemplate.content.cloneNode(true));
    } else {
      affiliateLink.replaceChildren();
    }
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
      affiliateOffer.hidden = true;
      affiliateLink.replaceChildren();
    }, 0);
  });
})();
