// Serialized into the preview and published hosting bootstrap. Keep standalone.
export function installAutomaticEditing(options = {}) {
  const prefix = "__rcms_auto__";
  const values = Object.create(null);
  let editing = !!options.editing;
  let websiteId = "";
  let scheduled = false;
  let started = false;
  let observer;
  let timer;
  let courses = null;
  function updateCourseListings(container, courses, buildEntry) {
    if (!container?.isConnected) return;
    const existing = new Map(Array.from(container.querySelectorAll(":scope > [data-rocket-course]"))
      .map((element) => [element.dataset.rocketCourse, element]));
    courses.forEach((course) => {
      const title = String(course.title || course.slug || "Course") + (course.draft ? " (Draft)" : "");
      const entry = existing.get(course.path);
      existing.delete(course.path);
      if (entry?.dataset.rocketCourseTitle === title) return;
    const replacement = buildEntry(course.path, title, course);
      if (!replacement) return;
      replacement.dataset.rocketCourse = course.path;
      replacement.dataset.rocketCourseTitle = title;
      const link = replacement.matches("a") ? replacement : replacement.querySelector("a");
      if (link && options.preview && course.pageId) link.dataset.rocketPreviewCourse = course.pageId;
      if (entry) entry.replaceWith(replacement);
      else container.appendChild(replacement);
    });
    existing.forEach((element) => element.remove());
  }

  function copyCourseListing(template, path, title, linkSelector, titleSelector, omittedSelector) {
    if (!template) return;
    const entry = template.cloneNode(true);
    entry.querySelectorAll(omittedSelector).forEach((element) => element.remove());
    for (const element of [entry, ...entry.querySelectorAll("[data-rcms-region]")]) {
      element.removeAttribute("data-rcms-region");
      element.removeAttribute("data-rcms-type");
      element.removeAttribute("data-rcms-label");
    }
    const link = linkSelector ? entry.querySelector(linkSelector) : entry;
    const heading = entry.querySelector(titleSelector);
    if (!link || !heading) return;
    link.href = path;
    heading.textContent = title;
    entry.classList.add("is-visible");
    const label = entry.querySelector(".course-card__label, .courses-list-card__label");
    if (label) {
      Array.from(label.childNodes).filter((node) => node.nodeType === 3).forEach((node) => node.remove());
      label.appendChild(document.createTextNode(title));
    }
    const brand = entry.querySelector(".courses-list-card__col--brand");
    if (brand) brand.style.gridColumn = "1 / -1";
    return entry;
  }

  function syncCourseListings() {
    if (!courses) return;
    const tracks = document.querySelector(".hero-section__tracks");
    const grid = document.querySelector(".our-courses__grid");
    const journey = document.querySelector(".ai-journey__actions");
    const catalogue = document.querySelector(".courses-list-section__container");
    const registration = document.querySelector(".wizard-step__courses-list");
    updateCourseListings(tracks, courses, (path, title) => {
      const template = tracks.querySelector(".hero-track-wrapper:not([data-rocket-course])");
      const entry = copyCourseListing(template, path, title, ".hero-track", ".hero-track > span",
        ":scope > :not(.hero-track)");
      if (entry) entry.querySelector(".hero-track").style.paddingInline = "16px";
      return entry;
    });
    updateCourseListings(journey, courses, (path, title) =>
      copyCourseListing(journey.querySelector(".ai-journey__button--copy:not([data-rocket-course])"),
        path, title, null, "span", "script"));
    updateCourseListings(grid, courses, (path, title) =>
      copyCourseListing(grid.querySelector(".course-card--promptx:not([data-rocket-course])"),
        path, title, ".course-card__button", "h3", "p, ul"));
    updateCourseListings(catalogue, courses, (path, title) =>
      copyCourseListing(catalogue.querySelector(".courses-list-card--promptx:not([data-rocket-course])"),
        path, title, ".courses-list-card__btn", ".courses-list-card__title",
        ".courses-list-card__desc, .courses-list-card__col--learn, .courses-list-card__col--details"));
    updateCourseListings(registration, courses, (path, title, course) => {
      if (options.preview) {
        const templates = Array.from(registration.querySelectorAll(":scope > .wizard-step__list-card:not([data-rocket-course])"));
        const templateIndex = ["/promptx", "/growthx", "/brandx", "/copycraft"].indexOf(course.templateRoute);
        const template = templates[templateIndex < 0 ? 3 : templateIndex];
        if (template) {
          const card = template.cloneNode(true);
          card.classList.remove("selected");
          card.querySelectorAll(".wizard-step__radio-dot, .wizard-step__popular-badge").forEach((element) => element.remove());
          card.querySelector(".wizard-step__card-badge-name").textContent = title;
          return card;
        }
      }
      const link = document.createElement("a");
      link.className = "wizard-step__list-card";
      link.href = path;
      link.style.gridTemplateColumns = "minmax(0, 1fr) auto";
      link.style.textDecoration = "none";
      link.style.setProperty("--course-accent", "#3127b2");
      const heading = document.createElement("h3");
      heading.className = "wizard-step__card-badge-name";
      heading.textContent = title;
      const action = document.createElement("span");
      action.textContent = "View course →";
      link.append(heading, action);
      return link;
    });
  }
  const carouselRegion = "__rcms_auto__carousel_slides";
  const carouselSettingsRegion = "__rcms_auto__carousel_settings";
  let carouselOrder = [];
  let activeSlideId = "";
  let carouselTimer;
  let carouselTouchStart;
  let carouselDrag;
  const originalSlideImageStyles = new WeakMap();
  const originalSlideSrcsets = new WeakMap();
  const mobileBannerQuery = "(max-width: 720px)";
  function syncMobileSlideImage(slide, image, mobileImage) {
    if (!image) return;
    let url;
    try { if (mobileImage?.trim()) url = new URL(mobileImage, document.baseURI); } catch {}
    const src = url && ["http:", "https:"].includes(url.protocol)
      ? url.href.replaceAll(",", "%2C")
      : "";
    slide.toggleAttribute("data-rocket-mobile-image", Boolean(src));
    const picture = image.parentElement;
    if (picture.matches("picture")) {
      let source = picture.querySelector("source[data-rocket-mobile-source]");
      if (!src) { source?.remove(); return; }
      if (!source) {
        source = document.createElement("source");
        source.setAttribute("data-rocket-mobile-source", "");
        source.media = mobileBannerQuery;
        source.srcset = src;
        picture.prepend(source);
      } else if (source.getAttribute("srcset") !== src) {
        source.srcset = src;
      }
      return;
    }
    if (src && window.matchMedia(mobileBannerQuery).matches) {
      if (!originalSlideSrcsets.has(image)) originalSlideSrcsets.set(image, image.getAttribute("srcset"));
      if (image.getAttribute("srcset") !== src) image.srcset = src;
    } else if (originalSlideSrcsets.has(image)) {
      const original = originalSlideSrcsets.get(image);
      if (original === null) image.removeAttribute("srcset");
      else image.srcset = original;
      originalSlideSrcsets.delete(image);
    }
  }
  const clampPosition = (value) => Math.max(0, Math.min(100, value));
  function restoreSlideImage(slide) {
    const image = slide.querySelector("img");
    const original = originalSlideImageStyles.get(image);
    if (original) {
      Object.assign(image.style, original);
      originalSlideImageStyles.delete(image);
    }
  }

  function fitButtonAxis(offset, artworkSize, frameSize, anchor, inset) {
    const center = offset + anchor;
    const visibleCenter = Math.max(inset, Math.min(frameSize - inset, center));
    const adjustedOffset = Math.max(frameSize - artworkSize, Math.min(0, offset + visibleCenter - center));
    return {
      center: Math.max(inset, Math.min(frameSize - inset, adjustedOffset + anchor)),
      objectPosition: artworkSize > frameSize ? adjustedOffset / (frameSize - artworkSize) * 100 : 50
    };
  }

  function slideImageBounds(slide) {
    const image = slide.querySelector("img");
    const width = slide.clientWidth;
    const height = slide.clientHeight;
    if (!image?.naturalWidth || !image.naturalHeight || !width || !height) return null;
    const style = getComputedStyle(image);
    const fit = style.objectFit;
    if (fit !== "cover" && fit !== "contain") return { left: 0, top: 0, width, height };
    const ratios = [width / image.naturalWidth, height / image.naturalHeight];
    const scale = fit === "contain" ? Math.min(...ratios) : Math.max(...ratios);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    const [x, y] = style.objectPosition.split(" ").map(parseFloat);
    return {
      left: (width - imageWidth) * (Number.isFinite(x) ? x : 50) / 100,
      top: (height - imageHeight) * (Number.isFinite(y) ? y : 50) / 100,
      width: imageWidth,
      height: imageHeight,
      fit
    };
  }
  function positionSlideButton(link, position) {
    const slide = link.parentElement;
    const image = slide.querySelector("img");
    const followsArtwork = position.coordinateSpace === "image" || slide.hasAttribute("data-rocket-slide");
    restoreSlideImage(slide);
    const bounds = followsArtwork && slideImageBounds(slide);
    if (bounds) {
      const anchorX = bounds.width * (Number.isFinite(position.x) ? clampPosition(position.x) : 50) / 100;
      const anchorY = bounds.height * (Number.isFinite(position.y) ? clampPosition(position.y) : 76) / 100;
      const insetX = Math.min(link.offsetWidth / 2 + 12, slide.clientWidth / 2);
      const insetY = Math.min(link.offsetHeight / 2 + 12, slide.clientHeight / 2);
      if (bounds.fit === "contain") {
        link.style.left = Math.max(insetX, Math.min(slide.clientWidth - insetX, bounds.left + anchorX)) + "px";
        const artworkBottom = bounds.top + bounds.height;
        const halfHeight = link.offsetHeight / 2;
        const center = bounds.top + anchorY;
        const y = center + halfHeight > artworkBottom ? artworkBottom + halfHeight : center;
        link.style.top = Math.min(slide.clientHeight - insetY, y) + "px";
        return;
      }
      const x = fitButtonAxis(bounds.left, bounds.width, slide.clientWidth, anchorX, insetX);
      const y = fitButtonAxis(bounds.top, bounds.height, slide.clientHeight, anchorY, insetY);
      originalSlideImageStyles.set(image, {
        objectPosition: image.style.objectPosition,
        transform: image.style.transform
      });
      image.style.objectPosition = x.objectPosition + "% " + y.objectPosition + "%";
      image.style.transform = "none";
      link.style.left = x.center + "px";
      link.style.top = y.center + "px";
      return;
    }
    link.style.left = (Number.isFinite(position.x) ? clampPosition(position.x) : 50) + "%";
    link.style.top = (Number.isFinite(position.y) ? clampPosition(position.y) : 76) + "%";
  }
  function syncSlideButton(slide, id, button) {
    let link = slide.querySelector("[data-rocket-slide-button]");
    let url;
    try { if (button?.url?.trim()) url = new URL(button.url, document.baseURI); } catch {}
    if (!url || !["https:", "http:"].includes(url.protocol) || !button?.text?.trim()) {
      link?.remove();
      restoreSlideImage(slide);
      return;
    }
    if (!link) {
      link = document.createElement("a");
      link.setAttribute("data-rocket-slide-button", id);
      link.style.cssText = "position:absolute;z-index:2;transform:translate(-50%,-50%);max-width:90%;padding:12px 20px;border-radius:10px;background:#ffce16;color:#171023;text-decoration:none;text-align:center;font:700 16px system-ui;touch-action:none";
      slide.appendChild(link);
    }
    link.href = url.href;
    link.style.cursor = editing ? "grab" : "pointer";
    if (link.textContent !== button.text) link.textContent = button.text;
    if (carouselDrag?.link !== link) positionSlideButton(link, button);
  }
  function showCarouselSlide(id) {
    activeSlideId = id;
    carouselOrder.forEach(({ slide, dot, id: slideId }) => {
      const active = slideId === id;
      slide.style.opacity = active ? "1" : "0";
      slide.style.visibility = active ? "visible" : "hidden";
      slide.setAttribute("aria-hidden", String(!active));
      dot.style.width = active ? "30px" : "10px";
      dot.style.background = active ? "#f8cb12" : "rgba(255,255,255,.34)";
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }
  function advanceCarousel(step) {
    const index = carouselOrder.findIndex(({ id }) => id === activeSlideId);
    if (carouselOrder.length) showCarouselSlide(carouselOrder[(index + step + carouselOrder.length) % carouselOrder.length].id);
  }
  function syncCarousel() {
    const carousel = document.querySelector(".home-carousel");
    const slides = carousel?.querySelector(".home-carousel__slides");
    const dots = carousel?.querySelector(".home-carousel__dots");
    if (!slides || !dots) return;
    const additions = Array.isArray(values[carouselRegion]) ? values[carouselRegion] : [];
    const settings = values[carouselSettingsRegion] || {};
    const baseSlides = Array.from(slides.children).filter((slide) => !slide.hasAttribute("data-rocket-slide"));
    const baseDots = Array.from(dots.children).filter((dot) => !dot.hasAttribute("data-rocket-slide"));
    const order = baseSlides.flatMap((slide, index) => baseDots[index] ? [{ id: "original-" + index, slide, dot: baseDots[index] }] : []);
    const wanted = new Set();
    for (const item of additions) {
      if (!item || !/^slide-[a-z0-9-]+$/.test(item.id) || wanted.has(item.id)) continue;
      const anchor = order.findIndex(({ id }) => id === item.anchor);
      if (anchor < 0) continue;
      let url;
      try { url = new URL(item.src, document.baseURI); } catch { continue; }
      if (!["https:", "http:"].includes(url.protocol)) continue;
      wanted.add(item.id);
      let slide = slides.querySelector('[data-rocket-slide="' + item.id + '"]');
      let dot = dots.querySelector('[data-rocket-slide="' + item.id + '"]');
      if (!slide) {
        slide = document.createElement("div");
        slide.className = "home-carousel__slide";
        slide.setAttribute("data-rocket-slide", item.id);
        const image = document.createElement("img");
        image.src = url.href;
        image.alt = String(item.alt || "");
        slide.appendChild(image);
        slides.appendChild(slide);
      }
      if (!dot) {
        dot = document.createElement("button");
        dot.className = "home-carousel__dot";
        dot.type = "button";
        dot.setAttribute("data-rocket-slide", item.id);
        dots.appendChild(dot);
      }
      order.splice(anchor + (item.position === "after" ? 1 : 0), 0, { id: item.id, slide, dot });
    }
    carousel.querySelectorAll("[data-rocket-slide]").forEach((element) => {
      if (!wanted.has(element.getAttribute("data-rocket-slide"))) element.remove();
    });
    const visibleOrder = order.filter(({ id, slide, dot }) => {
      const image = slide.querySelector("img");
      const regionId = image?.getAttribute("data-rcms-region") || (image ? prefix + encodeURIComponent(selector(image)) : "");
      const override = values[regionId];
      const hidden = settings[id]?.deleted === true || override?.src === "" || override === "";
      slide.hidden = hidden;
      dot.hidden = hidden;
      syncMobileSlideImage(slide, image, settings[id]?.mobileImage);
      syncSlideButton(slide, id, hidden ? null : settings[id]?.button);
      return !hidden;
    });
    if (!wanted.size && !Object.keys(settings).length && visibleOrder.length === order.length && !editing) {
      carouselOrder.forEach(({ slide, dot }) => {
        slide.style.removeProperty("opacity");
        slide.style.removeProperty("visibility");
        dot.style.removeProperty("width");
        dot.style.removeProperty("background");
        dot.style.removeProperty("order");
        dot.removeAttribute("data-rocket-dot");
        slide.setAttribute("aria-hidden", String(!slide.classList.contains("is-active")));
        if (dot.classList.contains("is-active")) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      carouselOrder = [];
      window.clearInterval(carouselTimer);
      carouselTimer = undefined;
      return;
    }
    carouselOrder = visibleOrder;
    visibleOrder.forEach(({ id, dot }, index) => {
      dot.style.order = String(index);
      dot.setAttribute("data-rocket-dot", id);
      dot.setAttribute("aria-label", "Show slide " + (index + 1));
    });
    showCarouselSlide(visibleOrder.some(({ id }) => id === activeSlideId) ? activeSlideId : visibleOrder[0]?.id);
    if (editing && carouselTimer) { window.clearInterval(carouselTimer); carouselTimer = undefined; }
    if (!editing && !carouselTimer && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      carouselTimer = window.setInterval(() => advanceCarousel(1), 4000);
    }
  }
  function selector(element) {
    const parts = [];
    while (element && element !== document.body) {
      if (element.hasAttribute("data-rocket-course") && element.parentElement?.matches(".wizard-step__courses-list")) {
        return ".wizard-step__courses-list > [data-rocket-course=" + JSON.stringify(element.dataset.rocketCourse) + "]"
          + (parts.length ? " > " + parts.join(" > ") : "");
      }
      const tag = element.tagName.toLowerCase();
      const siblings = Array.from(element.parentElement?.children || []).filter((item) => item.tagName === element.tagName);
      parts.unshift(tag + ":nth-of-type(" + (siblings.indexOf(element) + 1) + ")");
      element = element.parentElement;
    }
    return "body > " + parts.join(" > ");
  }
  function send(type, payload) {
    window.parent.postMessage({ rcms: true, version: "v1", websiteId, type, payload }, "*");
  }
  function valueOf(element, type) {
    if (type === "image") {
      let src = element.getAttribute("src") || "";
      try { src = new URL(src, location.href).searchParams.get("asset") || src; } catch {}
      return { src, alt: element.getAttribute("alt") || "" };
    }
    if (type === "button") return { text: element.textContent.trim(), url: element.getAttribute("href") || "" };
    if (type === "section") return { background: getComputedStyle(element).backgroundColor };
    return element.textContent;
  }
  function apply(id, value) {
    if (!id.startsWith(prefix)) return;
    let element;
    try { element = document.querySelector(decodeURIComponent(id.slice(prefix.length))); } catch { return; }
    if (!element) return;
    const type = element.getAttribute("data-rcms-type");
    const object = value && typeof value === "object" ? value : {};
    const text = typeof value === "string" ? value : object.text;
    if (typeof text === "string" && type !== "section") {
      // Preserve nested emphasis, icons, and application-owned elements.
      const walker = document.createTreeWalker(element, 4);
      const nodes = [];
      while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
      if (nodes.length && nodes.map((node) => node.textContent).join("") !== text) {
        nodes[0].textContent = text;
        nodes.slice(1).forEach((node) => { node.textContent = ""; });
      }
    }
    if (element.tagName === "IMG" && typeof object.src === "string" && !/^\s*(javascript|vbscript):/i.test(object.src)) {
      if (element.getAttribute("src") !== object.src) element.setAttribute("src", object.src);
      element.removeAttribute("srcset");
      if (typeof object.alt === "string") element.setAttribute("alt", object.alt);
    }
    if (element.tagName === "A" && typeof object.url === "string" && !/^\s*(javascript|vbscript|data):/i.test(object.url)) element.setAttribute("href", object.url);
    ["color", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "background", "backgroundColor"].forEach((key) => {
      if (object[key] !== undefined) element.style[key] = String(object[key]);
    });
    if (object.align) element.style.textAlign = object.align;
    if (Number.isFinite(object.paddingY)) { element.style.paddingTop = object.paddingY + "px"; element.style.paddingBottom = object.paddingY + "px"; }
  }
  function discover() {
    scheduled = false;
    syncCarousel();
    syncCourseListings();
    // Mixed footer copy contains direct text beside links. Expose each plain
    // text run separately so editing it never clears the adjacent link/icon.
    document.querySelectorAll("p,li,div").forEach((element) => {
      if (element.closest("[data-rcms-node],script,style,svg,form,[contenteditable=true]")) return;
      const region = element.closest("[data-rcms-region]");
      if (region && !region.getAttribute("data-rcms-region").startsWith(prefix)) return;
      if (!element.querySelector("a,button") || element.querySelector("p,li,div,section,ul,ol,form")) return;
      Array.from(element.childNodes).forEach((node) => {
        if (node.nodeType !== 3 || !node.textContent.trim()) return;
        const span = document.createElement("span");
        span.setAttribute("data-rcms-auto-text", "true");
        node.replaceWith(span);
        span.appendChild(node);
      });
    });
    document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,label,a,button,img,section,header,footer,main,span,strong,b,em,i,small").forEach((element) => {
      if (element.closest("[data-rocket-slide-button],[data-rcms-node],script,style,svg,form,input,textarea,select,[contenteditable=true]")) return;
      const existing = element.closest("[data-rcms-region]");
      if (existing && !existing.getAttribute("data-rcms-region").startsWith(prefix)) return;
      if (!element.matches("img,section,header,footer,main,a,button") && (!element.textContent.trim() || element.querySelector("h1,h2,h3,h4,p,li,a,button,img"))) return;
      const customSlide = element.tagName === "IMG" && element.closest("[data-rocket-slide]");
      const id = prefix + encodeURIComponent(customSlide
        ? '[data-rocket-slide="' + customSlide.getAttribute("data-rocket-slide") + '"] img'
        : selector(element));
      const type = element.matches("img") ? "image" : element.matches("a,button") ? "button" : element.matches("section,header,footer,main") ? "section" : "text";
      element.setAttribute("data-rcms-region", id);
      element.setAttribute("data-rcms-type", type);
      element.setAttribute("data-rcms-label", (element.getAttribute("alt") || element.textContent || type).trim().slice(0, 70));
    });
    Object.keys(values).forEach((id) => apply(id, values[id]));
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    timer = window.setTimeout(discover, 16);
  }
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (event.source !== window.parent || !message?.rcms || message.version !== "v1") return;
    websiteId = message.websiteId || websiteId;
    if (options.preview && message.type === "rcms/v1/preview-course-links" && Array.isArray(message.payload?.courses)) {
      courses = message.payload.courses.filter((course) => course && /^\/[a-z0-9-]+$/.test(course.path) && typeof course.pageId === "string");
      schedule();
      return;
    }
    if (message.type === "rcms/v1/enter-edit-mode") { editing = true; document.documentElement.setAttribute("data-rcms-auto-editing", "true"); schedule(); }
    if (message.type === "rcms/v1/exit-edit-mode") { editing = false; document.documentElement.setAttribute("data-rcms-auto-editing", "false"); schedule(); }
    if (message.type === "rcms/v1/field-update" && message.payload?.regionId?.startsWith(prefix)) {
      values[message.payload.regionId] = message.payload.value;
      if (message.payload.regionId === carouselRegion || message.payload.regionId === carouselSettingsRegion) { schedule(); return; }
      apply(message.payload.regionId, message.payload.value);
      if (message.payload.regionId.startsWith(prefix)) schedule();
    }
  });
  document.addEventListener("click", (event) => {
    if (editing && event.target.closest?.("[data-rocket-slide-button]")) {
      event.preventDefault(); event.stopImmediatePropagation();
      return;
    }
    const course = event.target.closest?.("[data-rocket-preview-course]");
    if (options.preview && course) {
      event.preventDefault();
      event.stopImmediatePropagation();
      send("rcms/v1/open-course-editor", { pageId: course.getAttribute("data-rocket-preview-course") });
      return;
    }
    const dot = event.target.closest?.("[data-rocket-dot]");
    if (dot) {
      event.preventDefault(); event.stopImmediatePropagation();
      showCarouselSlide(dot.getAttribute("data-rocket-dot"));
      return;
    }
    if (!editing) return;
    const element = event.target.closest?.("[data-rcms-region]");
    const id = element?.getAttribute("data-rcms-region");
    if (!id?.startsWith(prefix)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const type = element.getAttribute("data-rcms-type");
    const carouselSlide = type === "image" && carouselOrder.find(({ slide }) => slide.contains(element));
    send("rcms/v1/region-selected", { regionId: id, type, label: element.getAttribute("data-rcms-label"), value: values[id] ?? valueOf(element, type), ...(carouselSlide ? { carouselSlideId: carouselSlide.id } : {}), additive: event.ctrlKey || event.metaKey || event.shiftKey });
  }, true);
  document.addEventListener("pointerdown", (event) => {
    const link = editing && event.target.closest?.("[data-rocket-slide-button]");
    if (!link || event.button !== 0) return;
    event.preventDefault();
    const slide = link.parentElement.getBoundingClientRect();
    const button = link.getBoundingClientRect();
    if (!slide.width || !slide.height) return;
    carouselDrag = {
      link, slide, pointerId: event.pointerId,
      image: slideImageBounds(link.parentElement),
      offsetX: event.clientX - button.left - button.width / 2,
      offsetY: event.clientY - button.top - button.height / 2
    };
    link.setPointerCapture?.(event.pointerId);
  });
  document.addEventListener("pointermove", (event) => {
    if (!carouselDrag || carouselDrag.pointerId !== event.pointerId) return;
    const { link, slide, image, offsetX, offsetY } = carouselDrag;
    const x = event.clientX - slide.left - offsetX;
    const y = event.clientY - slide.top - offsetY;
    carouselDrag.position = {
      x: clampPosition((x - (image?.left || 0)) / (image?.width || slide.width) * 100),
      y: clampPosition((y - (image?.top || 0)) / (image?.height || slide.height) * 100),
      coordinateSpace: "image"
    };
    link.style.left = clampPosition(x / slide.width * 100) + "%";
    link.style.top = clampPosition(y / slide.height * 100) + "%";
  });
  document.addEventListener("pointerup", (event) => {
    if (!carouselDrag || carouselDrag.pointerId !== event.pointerId) return;
    const { link, position } = carouselDrag;
    carouselDrag = undefined;
    if (position) send("rcms/v1/carousel-button-position", { slideId: link.getAttribute("data-rocket-slide-button"), ...position });
  });
  window.addEventListener("resize", schedule);
  document.addEventListener("load", (event) => {
    if (event.target.closest?.(".home-carousel__slide img")) schedule();
  }, true);
  document.addEventListener("pointercancel", (event) => {
    if (carouselDrag?.pointerId === event.pointerId) { carouselDrag = undefined; schedule(); }
  });
  document.addEventListener("touchstart", (event) => {
    if (carouselOrder.length && event.target.closest?.(".home-carousel__slides")) {
      carouselTouchStart = event.touches[0]?.clientX;
    }
  }, { passive: true });
  document.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0]?.clientX - carouselTouchStart;
    carouselTouchStart = undefined;
    if (Math.abs(distance) >= 45) advanceCarousel(distance > 0 ? -1 : 1);
  }, { passive: true });
  function start() {
    if (started) return;
    started = true;
    const mobileBannerStyle = document.createElement("style");
    mobileBannerStyle.textContent = '@media(max-width:720px){.home-carousel__slide[data-rocket-slide]:not([data-rocket-mobile-image]) img{object-fit:contain!important;object-position:center!important;transform:none!important}.home-carousel__slide[data-rocket-mobile-image] img{object-fit:cover;transform:none!important}}';
    document.head.appendChild(mobileBannerStyle);
    if (options.preview) {
      const style = document.createElement("style");
      style.textContent = 'html[data-rcms-auto-editing="true"] [data-rcms-region^="__rcms_auto__"]:hover{outline:2px solid #ef4444!important;outline-offset:2px;cursor:pointer!important}';
      document.head.appendChild(style);
      document.documentElement.setAttribute("data-rcms-auto-editing", String(editing));
    }
    discover();
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    if (options.preview) send("rcms/v1/runtime-ready", { automaticEditing: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
  return {
    applyCourses(nextCourses) { courses = nextCourses; syncCourseListings(); },
    applyRegions(regions) { Object.keys(values).forEach((key) => delete values[key]); Object.assign(values, regions); discover(); },
    destroy() { observer?.disconnect(); window.clearTimeout(timer); window.clearInterval(carouselTimer); document.removeEventListener("DOMContentLoaded", start); }
  };
}
