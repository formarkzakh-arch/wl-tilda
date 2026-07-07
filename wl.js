/* Превращаем характеристики товара Tilda в аккордеоны (как в макете WL).
   Tilda перерисовывает характеристики асинхронно, поэтому наблюдатель НЕ отключаем —
   пересобираем аккордеон каждый раз, когда снова появляются "сырые" <p>. */
(function(){
  /* ===== КОНФИГУРАЦИЯ ===== */
  var WL_BRAND          = 'WILLIAM LIKHACHEV'; /* название бренда в баре Экрана 2 */
  var WL_SIZE_GUIDE_URL = 'https://dance-emotive-treeboa.tilda.ws'; /* URL таблицы размеров; если '' — кнопка скрыта */
  var WISHLIST_KEY      = 'wl-wish-v1';

  var HEART_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var RULER_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="9" width="20" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="9" x2="6" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="9" x2="10" y2="15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="14" y1="9" x2="14" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="18" y1="9" x2="18" y2="15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  /* ===== WISHLIST (localStorage) ===== */
  function getWishlist(){ try{ return JSON.parse(localStorage.getItem(WISHLIST_KEY)||'[]'); }catch(e){ return []; } }
  function setWishlist(l){ try{ localStorage.setItem(WISHLIST_KEY, JSON.stringify(l)); }catch(e){} }
  function getProductUid(){ var m = location.pathname.match(/\/tproduct\/(\d+)/); return m ? m[1] : null; }
  function isWishlisted(uid){ return getWishlist().indexOf(uid) !== -1; }
  function toggleWishlist(uid){
    var l = getWishlist(), i = l.indexOf(uid);
    if(i !== -1) l.splice(i, 1); else l.push(uid);
    setWishlist(l); return i === -1;
  }
  function convert(){
    /* берём только НЕобработанные параграфы характеристик */
    var items = document.querySelectorAll('p.js-store-prod-charcs');
    if(!items.length) return;
    var cont = items[0].closest('.js-store-prod-all-charcs') || items[0].parentNode;
    if(cont) cont.classList.add('wl-acc');
    items.forEach(function(p){
      var txt = (p.textContent || '').trim();
      var idx = txt.indexOf(':');
      var title = idx > -1 ? txt.slice(0, idx).trim() : txt;
      var body  = idx > -1 ? txt.slice(idx + 1).trim() : '';
      var item = document.createElement('div');
      item.className = 'wl-acc__item';
      item.innerHTML =
        '<div class="wl-acc__head">' + title + '<span class="wl-acc__sign">+</span></div>' +
        '<div class="wl-acc__body"><div class="wl-acc__body-inner">' + body + '</div></div>';
      p.replaceWith(item);
      item.querySelector('.wl-acc__head').addEventListener('click', function(){
        item.classList.toggle('is-open');
      });
    });
  }
  /* ----- STICKY-КНОПКА "В КОРЗИНУ" на мобайле ----- */
  function sticky(){
    /* только на странице товара: URL /tproduct/ ИЛИ кнопка реально видима
       (на каталоге попап-контейнер есть, но скрыт — там sticky не нужен) */
    var onProductPage = location.pathname.indexOf('/tproduct') !== -1;
    if(document.querySelector('.wl-sticky-add')) return;
    var btn = document.querySelector('.js-store-prod-popup-add-btn, .t-store__prod-popup__btn');
    if(!btn) return;
    if(!onProductPage && btn.offsetParent === null) return;   /* кнопка в скрытом попапе каталога — пропускаем */
    var priceEl = document.querySelector('.t-store__prod-popup__price-value, .t-store__prod-popup__price');
    var bar = document.createElement('div');
    bar.className = 'wl-sticky-add';
    bar.innerHTML =
      '<button type="button" class="wl-sticky-add__btn">' +
        '<span>добавить в корзину</span>' +
        '<span class="wl-sticky-add__price"></span>' +
      '</button>';
    document.body.appendChild(bar);
    document.body.classList.add('wl-has-sticky');
    var sp = bar.querySelector('.wl-sticky-add__price');
    function formatPrice(raw){
      var n = parseFloat(raw.replace(/[^\d,\.]/g, '').replace(',', '.'));
      if(isNaN(n)) return raw;
      return Math.round(n).toLocaleString('ru-RU') + ' ₽';
    }
    function syncPrice(){ if(!priceEl) return; var v=formatPrice(priceEl.textContent.trim()); if(sp.textContent!==v) sp.textContent=v; }
    syncPrice();
    /* клик по sticky: если размер не выбран (кнопка Tilda дизейблится) и мы на
       мобайле — открываем панель экрана 2, чтобы выбрать размер; иначе клик по
       штатной кнопке Tilda (логику не дублируем). */
    bar.querySelector('.wl-sticky-add__btn').addEventListener('click', function(){
      var realBtn = document.querySelector('.js-store-prod-popup-add-btn, .t-store__prod-popup__btn');
      if(!realBtn) return;
      var off = realBtn.classList.contains('t-store__prod-popup__btn_disabled')
             || realBtn.classList.contains('t-btn_disabled') || realBtn.disabled;
      if(off && isMobileProd()){
        var opts = document.querySelector('.js-product-controls-wrapper');
        if(opts) opts.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      realBtn.click();
    });
    if(priceEl) new MutationObserver(syncPrice).observe(priceEl, {childList:true, subtree:true, characterData:true});
    requestAnimationFrame(function(){ bar.classList.add('is-ready'); });
  }

  /* ----- ПОРЯДОК как в макете: цена → описание → артикул → [линия] опции ----- */
  /* ВАЖНО: описание Tilda держит в .js-store-prod-text (внизу колонки) и может пересоздавать
     его при перерисовке. Поэтому НЕ переносим узел "насовсем" (так возникал дубликат),
     а каждый тик переносим актуальное описание из его "дома" в слот под ценой. Слот всегда
     чистится перед вставкой → две копии не накапливаются. Характеристики-аккордеоны
     остаются в .js-store-prod-text внизу. */
  function reorderProduct(){
    if(location.pathname.indexOf('/tproduct') === -1) return;
    var price = document.querySelector('.js-store-price-wrapper, .t-store__prod-popup__price-wrapper');
    if(!price || !price.parentNode) return;

    /* слот под ценой (создаём один раз) */
    var slot = document.querySelector('.wl-descr-slot');
    if(!slot){
      slot = document.createElement('div');
      slot.className = 'wl-descr-slot';
      price.parentNode.insertBefore(slot, price.nextSibling);
    }
    /* описание из "дома" Tilda → в слот (если оно там появилось/пересоздалось) */
    var home  = document.querySelector('.js-store-prod-text');
    var descr = home && home.querySelector('.js-store-prod-all-text');
    if(descr){ slot.innerHTML = ''; slot.appendChild(descr); }

    /* артикул — сразу под слотом описания. title-wrapper Tilda
       не пересоздаёт, поэтому достаточно перенести один раз. */
    var sku = document.querySelector('.js-store-prod-sku-wrap, .t-store__prod-popup__sku');
    if(sku && !sku.dataset.wlMoved){
      sku.dataset.wlMoved = '1';
      slot.parentNode.insertBefore(sku, slot.nextSibling);
    }
  }

  /* ----- "СМОТРЕТЬ ТАКЖЕ": карточки оформляем как в каталоге ----- */
  function relevantsLikeCatalog(){
    document.querySelectorAll('.t-store__relevants__container .t-store__card').forEach(function(card){
      /* как в каталоге: убираем описание/артикул/sku. У описания (.t-store__card__descr,
         .js-store-prod-descr) Tilda ставит ИНЛАЙН `display:-webkit-box !important` для
         line-clamp и ПЕРЕЗАПИСЫВАЕТ style-атрибут после нашего скрытия — поэтому ни CSS
         (`display:none !important`), ни inline-`display:none` его не держат. Надёжно —
         УДАЛИТЬ узел: удаление ловит наблюдатель childList (если Tilda пересоздаст карточку,
         удалим снова); атрибуты не наблюдаем → петли нет. */
      card.querySelectorAll(
        '.t-store__card__descr, .js-store-prod-descr, [class*="card__descr"],'+
        '.t-store__card__sku, .js-store-prod-sku-wrap, [class*="card__article"],'+
        '[class*="card__sku"], .js-store-prod-all-text, .js-store-prod-charcs'
      ).forEach(function(el){ el.style.setProperty('display','none','important'); });

      /* название слева / цена справа */
      if(!card.querySelector('.wl-cap-row')){
        var title = card.querySelector('.t-store__card__title');
        var price = card.querySelector('.t-store__card__price-wrapper')
                 || card.querySelector('.t-store__card__price');
        if(title && price){
          var row = document.createElement('div');
          row.className = 'wl-cap-row';
          title.parentNode.insertBefore(row, title);
          row.appendChild(title); row.appendChild(price);
        }
      }
      /* опции: цвет прячем, размеры — мелкой строкой */
      card.querySelectorAll('.t-product__option').forEach(function(group){
        if(group.dataset.wlOpt) return;
        group.dataset.wlOpt = '1';
        var input = group.querySelector('input[name]');
        var name = (input ? input.getAttribute('name') : '').toLowerCase();
        if(/цвет|color|колор|колір/.test(name)){ group.style.display = 'none'; return; }
        group.classList.add('wl-card-sizes');
        group.querySelectorAll('.t-product__option-title').forEach(function(ttl){
          if(!ttl.closest('.t-product__option-item')) ttl.style.display = 'none';
        });
      });

      /* ♡ кнопка избранного на карточке рекомендации */
      var imgWrap = card.querySelector('.t-store__card__img-wrapper, .t-store__card__img');
      if(imgWrap && !card.querySelector('.wl-card-heart')){
        var cardLink = card.querySelector('a[href*="/tproduct/"]');
        var cardUid = cardLink ? (cardLink.href.match(/\/tproduct\/(\d+)/) || [])[1] : null;
        var heart = document.createElement('button');
        heart.type = 'button'; heart.className = 'wl-card-heart'; heart.setAttribute('aria-label', 'В избранное');
        heart.innerHTML = HEART_SVG;
        if(cardUid) heart.classList.toggle('is-active', isWishlisted(cardUid));
        heart.addEventListener('click', function(e){
          e.preventDefault(); e.stopPropagation();
          if(!cardUid) return;
          toggleWishlist(cardUid);
          heart.classList.toggle('is-active', isWishlisted(cardUid));
        });
        imgWrap.style.position = 'relative';
        imgWrap.appendChild(heart);
      }
    });

    /* переименовываем заголовок раздела рекомендаций */
    var relTitle = document.querySelector('.t-store__relevants__title');
    if(relTitle && !relTitle.dataset.wlRenamed){
      relTitle.dataset.wlRenamed = '1';
      relTitle.textContent = 'МОЖЕТ ВАМ ПОНРАВИТЬСЯ';
    }
  }

  /* =====================================================================
     МОБИЛЬНАЯ КАРТОЧКА — 2 экрана (Figma 166-537 / 184-751).
     Всё гейтится isMobileProd(): ≤640px И страница товара /tproduct →
     десктоп/каталог/прочие страницы не затрагиваются. Функции идемпотентны
     (гард-флаги в dataset / проверка существования), переживают перерисовку
     Tilda через тот же MutationObserver + rAF-дебаунс, что и десктоп-логика. */
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 640px)') : { matches: false };
  function isMobileProd(){
    return MQ.matches && location.pathname.indexOf('/tproduct') !== -1;
  }
  /* класс-переключатель мобильного режима для CSS. При уходе с мобайла
     (ресайз окна через брейкпоинт) возвращаем перенесённые узлы на место —
     чтобы десктоп-вид не остался с инфо-колонкой внутри скрытой панели. */
  function mobileGate(){
    document.body.classList.toggle('wl-mobile-prod', isMobileProd());
  }

  /* помечаем группы опций: цвет / размер (как в каталоге, по name инпута) */
  function classifyOptions(scope){
    if(!scope) return;
    scope.querySelectorAll('.t-product__option').forEach(function(group){
      if(group.dataset.wlKind) return;
      var input = group.querySelector('input[name]');
      var name = (input ? input.getAttribute('name') : '').toLowerCase();
      var isColor = /цвет|color|колор|колір/.test(name);
      group.dataset.wlKind = isColor ? 'color' : 'size';
      group.classList.add(isColor ? 'wl-color-group' : 'wl-size-group');
    });
  }

  /* достаём URL всех фото товара из (уже отрендеренного) слайдера Tilda.
     Источники — по приоритету; классы могут отличаться → несколько фолбэков. */
  function galleryUrls(slider){
    var urls = [];
    function push(u){
      if(!u) return;
      u = String(u).replace(/^url\((['"]?)(.*?)\1\)$/i, '$2').replace(/^["']|["']$/g, '');
      if(u && u.indexOf('data:') !== 0 && urls.indexOf(u) === -1) urls.push(u);
    }
    function bg(el){
      var s = el.getAttribute('data-original') || el.getAttribute('data-slide-bg') || '';
      if(!s){ var m = (el.style.backgroundImage || '').match(/url\((['"]?)(.*?)\1\)/); if(m) s = m[2]; }
      return s;
    }
    slider.querySelectorAll('.t-slds__bgimg, .t-slds__main, .t-slds__item').forEach(function(el){ push(bg(el)); });
    if(!urls.length) slider.querySelectorAll('.t-slds__thumbsbullet, .t-store__prod-popup__slider-thumbs [style*="background-image"]').forEach(function(el){ push(bg(el)); });
    if(!urls.length) slider.querySelectorAll('img').forEach(function(im){ push(im.getAttribute('data-original') || im.getAttribute('src')); });
    if(!urls.length){ var ph = slider.querySelector('.js-product-img'); if(ph) push(bg(ph)); }
    return urls;
  }

  /* строим вертикальную скролл-стопку фото + индикатор-точки слева */
  function buildMobileGallery(){
    var slider = document.querySelector('.t-store__prod-popup__slider.js-store-prod-slider, .t-store__prod-popup__slider');
    if(!slider) return;
    var urls = galleryUrls(slider);
    if(!urls.length) return;                                  /* фолбэк: оставляем нативный слайдер */
    var gal = slider.querySelector('.wl-mgal');
    if(gal && +gal.dataset.count === urls.length) return;     /* уже построено для этого набора */
    if(gal) gal.remove();
    var oldDots = slider.querySelector('.wl-mgal__dots'); if(oldDots) oldDots.remove();

    gal = document.createElement('div');
    gal.className = 'wl-mgal'; gal.dataset.count = urls.length;
    urls.forEach(function(u){
      var s = document.createElement('div');
      s.className = 'wl-mgal__slide';
      s.style.backgroundImage = 'url("' + u + '")';
      gal.appendChild(s);
    });
    var dots = document.createElement('div'); dots.className = 'wl-mgal__dots';
    urls.forEach(function(_, i){
      var d = document.createElement('span');
      d.className = 'wl-mgal__dot' + (i === 0 ? ' is-active' : '');
      dots.appendChild(d);
    });
    slider.appendChild(gal);
    slider.appendChild(dots);

    var dotEls = dots.children;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var idx = Array.prototype.indexOf.call(gal.children, e.target);
        for(var i = 0; i < dotEls.length; i++) dotEls[i].classList.toggle('is-active', i === idx);
      });
    }, { root: gal, threshold: 0.5 });
    Array.prototype.forEach.call(gal.children, function(s){ io.observe(s); });

  }

  /* оверлеи поверх фото на экране 1: имя (слева) + кружок цвета «+N» (справа).
     Крепим к body (не к слайдеру) — transform на слайдере ломает overflow:hidden в Safari,
     из-за чего absolute-позиционированный элемент вываливался наружу. position:fixed решает. */
  function buildHeroOverlay(){
    if(document.querySelector('.wl-hero-overlay')) return;
    var nameEl = document.querySelector('.js-store-prod-name');
    var ov = document.createElement('div');
    ov.className = 'wl-hero-overlay';
    ov.innerHTML =
      '<div class="wl-hero-overlay__name">' + (nameEl ? nameEl.textContent.trim() : '') + '</div>' +
      '<div class="wl-hero-overlay__color"><span class="wl-hero-overlay__swatch"></span><span class="wl-hero-overlay__more"></span></div>';
    document.body.appendChild(ov);
    ov.querySelector('.wl-hero-overlay__color').addEventListener('click', openScreen2);
    /* скрываем оверлей когда инфо-секция (Screen 2) становится видимой */
    var info = document.querySelector('.t-store__prod-popup__info');
    if(info){
      new IntersectionObserver(function(entries){
        ov.classList.toggle('wl-ov-hidden', entries[0].intersectionRatio > 0.05);
      }, { threshold: [0.05] }).observe(info);
    }
    updateHeroColor();
  }

  /* кружок цвета: превью выбранного образца + «+N» (всего цветов − 1) */
  function updateHeroColor(){
    var ov = document.querySelector('.wl-hero-overlay'); if(!ov) return;
    var box = ov.querySelector('.wl-hero-overlay__color');
    var group = document.querySelector('.js-product-controls-wrapper .wl-color-group');
    var items = group ? group.querySelectorAll('.t-product__option-item') : [];
    if(!items.length){ box.style.display = 'none'; return; }
    box.style.display = '';
    ov.querySelector('.wl-hero-overlay__more').textContent = items.length > 1 ? ('+' + (items.length - 1)) : '';
    var active = group.querySelector('.t-product__option-item_active') || items[0];
    var v = active.querySelector('.t-product__option-variant') || active;
    var cs = window.getComputedStyle(v);
    if(cs.backgroundImage && cs.backgroundImage !== 'none') ov.querySelector('.wl-hero-overlay__swatch').style.backgroundImage = cs.backgroundImage;
    else if(cs.backgroundColor) ov.querySelector('.wl-hero-overlay__swatch').style.backgroundColor = cs.backgroundColor;
  }

  /* ----- ЭКРАН 2: инфо-колонка идёт под галереей в обычном потоке ----- */
  function openScreen2(){
    var info = document.querySelector('.t-store__prod-popup__info');
    if(info) info.scrollIntoView({ behavior: 'smooth' });
  }
  function closeScreen2(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ----- СВАЙП-ТРИГГЕР: свайп вверх по галерее → открыть Screen 2 -----
     Вешаем touch-события на slider один раз (dataset-гард).
     Для фотогалереи с несколькими фото: Screen 2 открывается только когда
     внутренний скролл галереи достиг конца (пользователь уже посмотрел все фото).
     Для товара с одним фото: любой свайп вверх ≥ 50px открывает Screen 2. */
  function setupScrollTrigger(){
    if(!isMobileProd()) return;
    var slider = document.querySelector('.t-store__prod-popup__slider');
    if(!slider || slider.dataset.wlSwipeTrigger) return;
    slider.dataset.wlSwipeTrigger = '1';

    var startY = 0;
    slider.addEventListener('touchstart', function(e){
      startY = e.touches[0].clientY;
    }, { passive: true });
    slider.addEventListener('touchend', function(e){
      var dy = startY - e.changedTouches[0].clientY;   /* >0 = свайп вверх */
      if(dy < 50) return;                              /* слишком короткий — игнорируем */
      var gal = slider.querySelector('.wl-mgal');
      if(!gal){ openScreen2(); return; }               /* нет галереи — открываем сразу */
      /* для многофото: ждём окончания scroll-snap и проверяем позицию */
      setTimeout(function(){
        var atEnd = gal.scrollTop + gal.clientHeight >= gal.scrollHeight - 40;
        if(atEnd) openScreen2();
      }, 320);
    }, { passive: true });
  }

  /* экран 2: описание + артикул сворачиваем в аккордеон «ОПИСАНИЕ» (открыт),
     ставим его первым над остальными (ОБМЕРЫ/СОСТАВ…). На десктопе НЕ вызываем. */
  function mobileDescrAccordion(){
    var acc = document.querySelector('.wl-acc');                    /* контейнер аккордеонов (из convert) */
    if(!acc) return;
    var item = acc.querySelector('.wl-acc__descr');
    if(!item){
      item = document.createElement('div');
      item.className = 'wl-acc__item wl-acc__descr is-open';
      item.innerHTML =
        '<div class="wl-acc__head">описание<span class="wl-acc__sign">+</span></div>' +
        '<div class="wl-acc__body"><div class="wl-acc__body-inner"></div></div>';
      acc.insertBefore(item, acc.firstChild);
      item.querySelector('.wl-acc__head').addEventListener('click', function(){ item.classList.toggle('is-open'); });
    } else if(acc.firstChild !== item){
      acc.insertBefore(item, acc.firstChild);                       /* держим первым */
    }
    var inner = item.querySelector('.wl-acc__body-inner');
    /* порядок как в макете: сначала артикул, затем описание (slot обновляет reorderProduct) */
    var sku = document.querySelector('.js-store-prod-sku-wrap, .t-store__prod-popup__sku');
    if(sku && sku.parentNode !== inner) inner.appendChild(sku);
    var slot = document.querySelector('.wl-descr-slot');
    if(slot && slot.parentNode !== inner) inner.appendChild(slot);
  }

  /* ♡ кнопка избранного — верхний правый угол галереи на Экране 1 */
  function buildWishlistBtn(){
    var slider = document.querySelector('.t-store__prod-popup__slider');
    if(!slider || slider.querySelector('.wl-wishlist-btn')) return;
    var uid = getProductUid(); if(!uid) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'wl-wishlist-btn'; btn.setAttribute('aria-label', 'В избранное');
    btn.innerHTML = HEART_SVG;
    btn.classList.toggle('is-active', isWishlisted(uid));
    btn.addEventListener('click', function(){
      toggleWishlist(uid);
      btn.classList.toggle('is-active', isWishlisted(uid));
    });
    slider.appendChild(btn);
  }

  /* ссылка «ПОДОБРАТЬ РАЗМЕР» под блоком вариантов размера */
  function buildSizeGuide(){
    if(!WL_SIZE_GUIDE_URL) return;
    var ctrl = document.querySelector('.js-product-controls-wrapper');
    if(!ctrl || ctrl.querySelector('.wl-size-guide')) return;
    var a = document.createElement('a');
    a.className = 'wl-size-guide'; a.href = WL_SIZE_GUIDE_URL; a.target = '_blank';
    a.innerHTML = RULER_SVG + '<span>подобрать размер</span>';
    ctrl.appendChild(a);
  }

  /* Включаем/выключаем pointer-events на невидимом враппере-оверлее.
     Disabled → none → тап падает на sticky-бар → скролл к опциям.
     Enabled  → auto → тап идёт на реальную кнопку Tilda (isTrusted=true) → корзина. */
  function syncBtnState(){
    if(!isMobileProd()) return;
    var wrapper = document.querySelector('.t-store__prod-popup__btn-wrapper');
    if(!wrapper) return;
    if(!wrapper.dataset.wlBtnWatch){
      wrapper.dataset.wlBtnWatch = '1';
      new MutationObserver(function(){ syncBtnState(); })
        .observe(wrapper, { attributes: true, subtree: true, attributeFilter: ['class', 'disabled'] });
    }
    var btn = wrapper.querySelector('.t-store__prod-popup__btn, .js-store-prod-popup-add-btn');
    var disabled = !btn
      || btn.classList.contains('t-store__prod-popup__btn_disabled')
      || btn.classList.contains('t-btn_disabled')
      || btn.disabled;
    wrapper.style.pointerEvents = disabled ? 'none' : 'auto';
  }


  /* ----- ДЕСКТОП: центрирование мини-галереи относительно главного фото -----
     Tilda может заново записывать inline-стили после загрузки товара.
     Поэтому правило дублируется через JS и вызывается из общего tick(). */
  function centerDesktopThumbs(){
    if(window.innerWidth <= 640) return;

    document.querySelectorAll(
      '.t-store__prod-popup__slider .t-slds__thumbsbullet-wrapper'
    ).forEach(function(wrapper){
      wrapper.style.setProperty('display', 'inline-flex', 'important');
      wrapper.style.setProperty('align-items', 'center', 'important');
      wrapper.style.setProperty('justify-content', 'flex-start', 'important');
      wrapper.style.setProperty('flex-wrap', 'nowrap', 'important');

      wrapper.style.setProperty('width', 'max-content', 'important');
      wrapper.style.setProperty('max-width', '100%', 'important');

      wrapper.style.setProperty('position', 'relative', 'important');
      wrapper.style.setProperty('left', '50%', 'important');
      wrapper.style.setProperty('right', 'auto', 'important');
      wrapper.style.setProperty('transform', 'translateX(-50%)', 'important');

      wrapper.style.setProperty('margin-left', '0', 'important');
      wrapper.style.setProperty('margin-right', '0', 'important');
      wrapper.style.setProperty('padding-left', '0', 'important');
      wrapper.style.setProperty('padding-right', '0', 'important');

      wrapper.style.setProperty('float', 'none', 'important');
      wrapper.style.setProperty('box-sizing', 'border-box', 'important');

      wrapper.querySelectorAll(':scope > .t-slds__thumbsbullet').forEach(function(thumb){
        thumb.style.setProperty('display', 'block', 'important');
        thumb.style.setProperty('flex', '0 0 auto', 'important');
        thumb.style.setProperty('float', 'none', 'important');
      });

      /* Один ResizeObserver на контейнер: повторно применяет центрирование,
         когда Tilda пересчитала размеры после загрузки изображений. */
      if(!wrapper.dataset.wlCenterWatch && window.ResizeObserver){
        wrapper.dataset.wlCenterWatch = '1';
        new ResizeObserver(function(){
          requestAnimationFrame(centerDesktopThumbs);
        }).observe(wrapper);
      }
    });
  }

  /* ----- НАТИВНОЕ МЕНЮ TILDA: не мешаем ему открываться/закрываться -----
     Причина бага «меню пропадает при тапе на бургер»: глобальный MutationObserver
     будил tick() на КАЖДОЙ мутации, включая анимацию открытия меню, а tick() двигал
     узлы в body → релэйаут посреди transition ломал toggle меню (на iOS особенно).
     MENU_SEL покрывает основные виджеты меню Tilda (современный tmenu-mobile, TM966,
     старый t-menu__mobile). isInsideMenu() → игнорируем такие мутации в observer.
     Плюс: пока меню открыто, гасим свои fixed-оверлеи (см. CSS body.wl-menu-open),
     чтобы невидимая прокси-кнопка (z:9601) и sticky-бар не перехватывали тапы. */
  var MENU_SEL = '.tmenu-mobile, [class*="tmenu-mobile"], .t966, .t-menu__mobile, .t-menusub__menu';
  function isInsideMenu(node){
    if(!node) return false;
    if(node.nodeType !== 1) node = node.parentElement;
    return !!(node && node.closest && node.closest(MENU_SEL));
  }
  function isMenuOpen(){
    return !!document.querySelector(
      '[class*="tmenu-mobile"][class*="opened"], [class*="tmenu-mobile"][class*="showed"],' +
      '[class*="burger"][class*="opened"], [class*="burger"][class*="active"],' +
      '.t966__burger_active, .t-menu__mobile_showed, .t-menu__mobile-nav.opened'
    );
  }
  function syncMenuOpen(){
    document.body.classList.toggle('wl-menu-open', isMenuOpen());
  }
  /* лёгкий наблюдатель, ПРИВЯЗАННЫЙ к самому меню (не к body) → дёшево, без петли:
     ловит переключение класса-открытия и держит body.wl-menu-open в актуальном виде */
  function watchMenu(){
    document.querySelectorAll(MENU_SEL).forEach(function(root){
      if(root.dataset.wlMenuWatch) return;
      root.dataset.wlMenuWatch = '1';
      new MutationObserver(syncMenuOpen)
        .observe(root, { attributes:true, subtree:true, attributeFilter:['class','style'] });
    });
    syncMenuOpen();
  }

  function tick(){
    convert(); sticky(); reorderProduct(); relevantsLikeCatalog(); centerDesktopThumbs();
    mobileGate(); watchMenu();
    if(isMobileProd()){
      classifyOptions(document.querySelector('.js-product-controls-wrapper'));
      buildMobileGallery();
      buildHeroOverlay();
      buildWishlistBtn();      /* ♡ в правом верхнем углу галереи */
      updateHeroColor();
      syncBtnState();          /* оверлей: pointer-events ↔ состояние кнопки */
      mobileDescrAccordion();
      buildSizeGuide();        /* «подобрать размер» — если задан URL и есть размеры */
      setupScrollTrigger();    /* скролл-триггер: уход галереи вверх → Screen 2 */
    }
  }

  /* дебаунс через rAF, чтобы не зациклиться на собственных изменениях DOM */
  var scheduled = false;
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){ scheduled = false; tick(); });
  }
  function start(){
    tick();
    /* мутации ВНУТРИ меню игнорируем — не дёргаем tick(), пока Tilda анимирует
       открытие/закрытие меню (иначе перерисовка body ломает toggle на iOS) */
    new MutationObserver(function(muts){
      for(var i = 0; i < muts.length; i++){
        if(!isInsideMenu(muts[i].target)){ schedule(); return; }
      }
    }).observe(document.body, { childList:true, subtree:true });
  }
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
