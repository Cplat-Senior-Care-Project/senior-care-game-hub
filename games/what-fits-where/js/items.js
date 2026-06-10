/* ===== ITEM POOL (임시 이모티콘) ===== */
const I = {
  글러브:{n:"장갑",img:"assets/goods/glove.png"},
  목도리:{n:"목도리",img:"assets/goods/muffler.png"},
  털모자:{n:"털모자",img:"assets/goods/fur_hat.png"},
  수영복:{n:"수영복",img:"assets/goods/swimsuit.png"},
  부채:{n:"부채",img:"assets/goods/folding_fan.png"},
  선풍기:{n:"선풍기",img:"assets/goods/electric_fan.png"},
  난로:{n:"난로",img:"assets/goods/stove.png"},
  수박:{n:"수박",img:"assets/goods/watermelon.png"},
  우산:{n:"우산",img:"assets/goods/umbrella.png"},
  장화:{n:"장화",img:"assets/goods/boots.png"},
  우비:{n:"우비",img:"assets/goods/raincoat.png"},
  선글라스:{n:"선글라스",img:"assets/goods/sunglass.png"},
  장바구니:{n:"장바구니",img:"assets/goods/basket.png"},
  지갑:{n:"지갑",img:"assets/goods/wallet.png"},
  등산화:{n:"등산화",img:"assets/goods/hiking_boots.png"},
  물통:{n:"물통",img:"assets/goods/bucket.png"},
  모자:{n:"모자",img:"assets/goods/cap.png"},
  책가방:{n:"책가방",img:"assets/goods/backpack.png"},
  공책:{n:"공책",img:"assets/goods/textbook.png"},
  연필:{n:"연필",img:"assets/goods/pencil.png"},
  진료카드:{n:"진료카드",img:"assets/goods/patient_card.png"},
  마스크:{n:"마스크",img:"assets/goods/mask.png"},
  약:{n:"약",img:""},
  칫솔:{n:"칫솔",img:"assets/goods/toothbrush.png"},
  치약:{n:"치약",img:"assets/goods/toothpaste.png"},
  수건:{n:"수건",img:"assets/goods/towel.png"},
  컵:{n:"컵",img:"assets/goods/cup.png"},
  숟가락:{n:"숟가락",img:"assets/goods/spoon.png"},
  젓가락:{n:"젓가락",img:"assets/goods/chopsticks.png"},
  밥그릇:{n:"밥그릇",img:"assets/goods/bowl.png"},
  국그릇:{n:"국그릇",img:""},
  프라이팬:{n:"프라이팬",img:"assets/goods/pan.png"},
  냄비:{n:"냄비",img:"assets/goods/pot.png"},
  베개:{n:"베개",img:"assets/goods/pillow.png"},
  이불:{n:"이불",img:"assets/goods/blanket.png"},
  빗자루:{n:"빗자루",img:"assets/goods/broom.png"},
  걸레:{n:"걸레",img:"assets/goods/rag.png"},
  손전등:{n:"손전등",img:"assets/goods/flashlight.png"},
  소화기:{n:"소화기",img:""},
  튜브:{n:"튜브",img:"assets/goods/tube.png"},
  비누:{n:"비누",img:"assets/goods/soap.png"},
  샴푸:{n:"샴푸",img:"assets/goods/shampoo.png"},
  쓰레기통:{n:"쓰레기통",img:""},
  삽:{n:"삽",img:"assets/goods/shovel.png"},
  호미:{n:"호미",img:"assets/goods/shovel.png"},
  씨앗:{n:"씨앗",img:"assets/goods/seeds.png"},
  쌀:{n:"쌀",img:"assets/goods/rice.png"},
  교통카드:{n:"교통카드",img:"assets/goods/transit_card.png"},
  노트북:{n:"노트북",img:"assets/goods/laptop.png"},
  물뿌리개:{n:"물뿌리개",img:"assets/goods/watering_can.png"},
  휴대폰:{n:"휴대폰",img:"assets/goods/smartphone.png"},
  현금:{n:"현금",img:"assets/goods/cash.png"},
  돈봉투:{n:"현금",img:"assets/goods/cash.png"},
  성경:{n:"성경책",img:"assets/goods/bible.png"},
};
const it = k => ({k, ...I[k]});

/* Render image with name-text fallback for missing/broken images */
function phHtml(i){
  if(i && i.img){
    const safeName = String(i.n||"").replace(/"/g,"&quot;");
    return `<img src="${i.img}" alt="${safeName}" draggable="false" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${safeName}',className:'ph-fallback'}))">`;
  }
  return `<span class="ph-fallback">${i ? (i.n||"") : ""}</span>`;
}
