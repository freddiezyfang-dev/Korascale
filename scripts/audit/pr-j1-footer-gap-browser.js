/* Browser-side footer gap measurement — loaded as string into Playwright evaluate */
() => {
  const docRect = (el) => {
    const r = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    return { top: r.top + scrollY, bottom: r.bottom + scrollY, height: r.height };
  };

  const elementSummary = (el) => {
    const cs = getComputedStyle(el);
    const rect = docRect(el);
    const htmlEl = el;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      className: typeof htmlEl.className === 'string' ? htmlEl.className.slice(0, 200) : '',
      testId: htmlEl.getAttribute('data-testid') || '',
      height: rect.height,
      docTop: rect.top,
      docBottom: rect.bottom,
      textLength: (htmlEl.innerText || '').replace(/\s+/g, ' ').trim().length,
      childCount: el.children.length,
      styles: {
        minHeight: cs.minHeight,
        height: cs.height,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        flexGrow: cs.flexGrow,
        flexShrink: cs.flexShrink,
        display: cs.display,
        position: cs.position,
        gridTemplateRows: cs.gridTemplateRows,
        backgroundColor: cs.backgroundColor,
      },
    };
  };

  const footer = document.querySelector('[data-testid="site-footer"]');
  if (!footer) return { error: 'no footer' };

  const footerRect = docRect(footer);
  const footerPrev = footer.previousElementSibling;

  const blockTags = ['section', 'article', 'main', 'footer', 'header', 'aside', 'nav'];
  let lastSectionBottom = 0;
  let lastSectionEl = null;
  for (const el of Array.from(document.body.querySelectorAll(blockTags.join(',')))) {
    if (footer.contains(el) || el === footer) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none') continue;
    const rect = docRect(el);
    if (rect.bottom > lastSectionBottom && rect.bottom <= footerRect.top + 2) {
      lastSectionBottom = rect.bottom;
      lastSectionEl = el;
    }
  }

  let lastContentBottom = 0;
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (footer.contains(el) || el === footer) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.offsetHeight < 2) continue;
    const rect = docRect(el);
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (text.length > 0 && rect.bottom > lastContentBottom && rect.bottom <= footerRect.top + 5) {
      lastContentBottom = rect.bottom;
    }
  }

  const footerPrevBottom = footerPrev ? docRect(footerPrev).bottom : lastSectionBottom;
  const footerPrevLastChild = footerPrev ? footerPrev.lastElementChild : null;
  const footerPrevLastChildBottom = footerPrevLastChild ? docRect(footerPrevLastChild).bottom : footerPrevBottom;

  const wrapperInternalGap = footerPrevBottom - footerPrevLastChildBottom;
  const structuralGap = footerRect.top - footerPrevBottom;
  const unexplainedGap = footerRect.top - Math.max(lastContentBottom, lastSectionBottom);

  const footerViewportTop = footer.getBoundingClientRect().top;
  const sampleY = Math.max(20, footerViewportTop - 60);
  const sampleX = window.innerWidth / 2;
  const fromPoint = document.elementsFromPoint(sampleX, sampleY).slice(0, 10);

  const gapElements = fromPoint.map(elementSummary);

  // Visual gap in viewport: last painted content above footer
  let visualLastBottom = 0;
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    if (footer.contains(el) || el === footer) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.offsetHeight < 2) continue;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight || rect.bottom > footerViewportTop) continue;
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (text.length > 0 && rect.bottom > visualLastBottom) {
      visualLastBottom = rect.bottom;
    }
  }
  const viewportGap = footerViewportTop - visualLastBottom;

  const emptyTallElements = [];
  const walk = (root) => {
    for (const child of Array.from(root.children)) {
      if (footer.contains(child)) continue;
      const rect = docRect(child);
      if (rect.top >= lastSectionBottom - 5 && rect.bottom <= footerRect.top + 5) {
        const sum = elementSummary(child);
        if (sum.height >= 80 && sum.textLength < 20) {
          emptyTallElements.push(sum);
        }
      }
      walk(child);
    }
  };
  if (footerPrev) walk(footerPrev);

  let culprit = null;
  let maxEmpty = 0;
  for (const el of emptyTallElements) {
    if (el.height > maxEmpty) {
      maxEmpty = el.height;
      culprit = el;
    }
  }
  if (!culprit && wrapperInternalGap > 80 && footerPrevLastChild) {
    culprit = elementSummary(footerPrevLastChild);
  }

  const mains = Array.from(document.querySelectorAll('main'));
  const main = mains[mains.length - 1];
  const mainLast = main ? main.lastElementChild : null;

  return {
    scrollY: window.scrollY,
    lastContentBottom,
    lastSectionBottom,
    footerPrevBottom,
    footerTop: footerRect.top,
    wrapperInternalGap,
    structuralGap,
    unexplainedGap,
    lastSectionTag: lastSectionEl ? lastSectionEl.tagName : null,
    lastSectionClass: lastSectionEl ? lastSectionEl.className : null,
    footerPrevSibling: footerPrev
      ? `${footerPrev.tagName.toLowerCase()}${footerPrev.id ? `#${footerPrev.id}` : ''}.${String(footerPrev.className).slice(0, 100)}`
      : 'none',
    footerPrevLastChild: footerPrevLastChild
      ? `${footerPrevLastChild.tagName.toLowerCase()}.${String(footerPrevLastChild.className).slice(0, 100)}`
      : 'none',
    mainLastChild: mainLast
      ? `${mainLast.tagName.toLowerCase()}.${String(mainLast.className).slice(0, 100)}`
      : 'none',
    gapElements,
    emptyTallElements,
    culprit,
    viewportGap,
    visualLastBottom,
    samplePoint: { x: sampleX, y: sampleY },
  };
};
