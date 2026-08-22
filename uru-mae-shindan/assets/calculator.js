
(() => {
 const root=document.querySelector('#calculator'); if(!root)return;
 const ids=['price','fee-rate','shipping','packing','discount','transfer','minutes','hourly'];
 const els=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
 const platform=document.getElementById('platform');
 const yen=n=>`${Math.max(0,Math.floor(Number.isFinite(n)?n:0)).toLocaleString('ja-JP')}円`;
 function num(el){const n=parseFloat(el.value);return Number.isFinite(n)?Math.max(0,n):0;}
 function calc(){const price=num(els.price),rate=num(els['fee-rate']),fee=Math.floor(price*rate/100),shipping=num(els.shipping),packing=num(els.packing),discount=num(els.discount),transfer=num(els.transfer),minutes=num(els.minutes),hourly=num(els.hourly);const cash=price-fee-shipping-packing-discount-transfer;const timeCost=minutes/60*hourly;const adjusted=cash-timeCost;document.getElementById('fee-out').textContent=yen(fee);document.getElementById('cash-out').textContent=yen(cash);document.getElementById('adjusted-out').textContent=yen(adjusted);document.getElementById('break-even-cash').textContent=yen(cash);document.getElementById('break-even-adjusted').textContent=yen(adjusted);}
 platform.addEventListener('change',()=>{if(platform.value!=='custom')els['fee-rate'].value=platform.value;els['fee-rate'].disabled=platform.value!=='custom';calc();});
 ids.forEach(id=>els[id].addEventListener('input',calc));
 els['fee-rate'].disabled=true; calc();
})();
