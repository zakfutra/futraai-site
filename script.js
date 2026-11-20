// Case study demos are loaded as soon as the page opens, but held on their
// first slide (the title card), so every card already shows a proper
// thumbnail instead of an empty box. Each one starts playing the first time
// the visitor scrolls to it, with no button and no click, so it reads as part
// of the page rather than an embedded video player.
//
// The page tells a held demo to start by posting it a message. A demo opened
// on its own (without ?hold=1) just plays straight away.
//
// Each demo reel was built as a fixed-size stage (see data-demo-width /
// data-demo-height). Rather than letting it reflow into whatever narrow
// card width the grid gives it, which breaks the tracker layout, the
// iframe is rendered at its real design size and then scaled down with a
// CSS transform to fit the card exactly, so it always looks the way it
// was designed to look.
document.querySelectorAll('.case-demo[data-demo-src]').forEach(function (demo) {
  var designWidth = parseInt(demo.getAttribute('data-demo-width'), 10) || 520;
  var designHeight = parseInt(demo.getAttribute('data-demo-height'), 10) || 650;
  // Optional portrait design size for narrow cards. A wide demo squeezed to a
  // phone-width card would scale its text to roughly half size, so below
  // MOBILE_BELOW it renders at this size instead, which also switches the
  // demo's own narrow layout on.
  var mobileWidth = parseInt(demo.getAttribute('data-demo-width-mobile'), 10);
  var mobileHeight = parseInt(demo.getAttribute('data-demo-height-mobile'), 10);
  var MOBILE_BELOW = 640;
  var iframe = null;
  var loaded = false;
  var wantPlay = false;
  var played = false;

  function dims() {
    if (mobileWidth && mobileHeight && demo.clientWidth < MOBILE_BELOW) {
      return { w: mobileWidth, h: mobileHeight, mobile: true };
    }
    return { w: designWidth, h: designHeight, mobile: false };
  }

  function fit() {
    if (!iframe) return;
    var d = dims();
    // The card's aspect ratio comes from a CSS class, so it has to follow the
    // design size or the scaled iframe is cropped or padded.
    demo.style.aspectRatio = d.mobile ? d.w + ' / ' + d.h : '';
    var scale = demo.clientWidth / d.w;
    iframe.style.width = d.w + 'px';
    iframe.style.height = d.h + 'px';
    iframe.style.transform = 'scale(' + scale + ')';
  }

  // Tells the held demo to start. If it has not finished loading yet, the
  // request is remembered and sent the moment it has.
  function play() {
    if (played) return;
    if (!loaded) { wantPlay = true; return; }
    played = true;
    try { iframe.contentWindow.postMessage({ type: 'futra-demo-play' }, '*'); } catch (e) { /* nothing to do */ }
  }

  function create() {
    var src = demo.getAttribute('data-demo-src');
    iframe = document.createElement('iframe');
    iframe.src = src + (src.indexOf('?') === -1 ? '?' : '&') + 'hold=1&v=' + Date.now();
    iframe.title = demo.getAttribute('data-demo-title') || 'Case study demo';
    iframe.addEventListener('load', function () {
      loaded = true;
      if (wantPlay) play();
    });
    demo.appendChild(iframe);
    fit();

    if (window.ResizeObserver) {
      new ResizeObserver(fit).observe(demo);
    } else {
      window.addEventListener('resize', fit);
    }
  }

  create();

  if (window.IntersectionObserver) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          play();
          observer.unobserve(demo);
        }
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.6 });
    observer.observe(demo);
  } else {
    // No IntersectionObserver support: start straight away.
    play();
  }
});
