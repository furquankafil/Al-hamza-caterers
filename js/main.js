/* Al-Hamza Caterers — shared interactions */
(function () {
  "use strict";
  var WA_NUMBER = "919818776891";
  var WA_DEFAULT = "Hello Al-Hamza Caterers, I would like to enquire about catering for my event.";

  function waLink(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message || WA_DEFAULT);
  }

  // Expose for inline use
  window.ALHAMZA_WA = waLink;

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header");
    var onScroll = function () {
      if (!header) return;
      if (window.scrollY > 40) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile drawer
    var drawer = document.getElementById("drawer");
    var openBtns = document.querySelectorAll("[data-open-drawer]");
    var closeBtns = document.querySelectorAll("[data-close-drawer]");
    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var first = drawer.querySelector("a,button");
      if (first) first.focus({ preventScroll: true });
    }
    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    openBtns.forEach(function (b) { b.addEventListener("click", openDrawer); });
    closeBtns.forEach(function (b) { b.addEventListener("click", closeDrawer); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDrawer(); closeLightbox(); }
    });

    // Reveal on scroll
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var els = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    }

    // Wire generic WhatsApp buttons with data-wa attribute
    document.querySelectorAll("[data-wa]").forEach(function (a) {
      var msg = a.getAttribute("data-wa-message") || WA_DEFAULT;
      if (!a.getAttribute("href") || a.getAttribute("href") === "#") {
        a.setAttribute("href", waLink(msg));
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      }
    });

    // Gallery filter
    var filterBtns = document.querySelectorAll(".filter-btn");
    var gItems = document.querySelectorAll(".g-item");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        var f = btn.getAttribute("data-filter");
        gItems.forEach(function (item) {
          var show = f === "all" || item.getAttribute("data-cat") === f;
          item.style.display = show ? "" : "none";
        });
      });
    });

    // Lightbox
    var lb = document.getElementById("lightbox");
    var lbImg = lb ? lb.querySelector("img") : null;
    var lbCount = lb ? lb.querySelector(".lb-count") : null;
    var visibleItems = function () {
      return Array.prototype.filter.call(gItems, function (i) { return i.style.display !== "none"; });
    };
    var idx = 0;
    function openLightbox(i) {
      if (!lb || !lbImg) return;
      var list = visibleItems();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var img = list[idx].querySelector("img");
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      if (lbCount) lbCount.textContent = (idx + 1) + " / " + list.length;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      if (!lb) return;
      lb.classList.remove("open");
      document.body.style.overflow = "";
    }
    window.__closeLightbox = closeLightbox;
    gItems.forEach(function (item) {
      item.addEventListener("click", function () {
        openLightbox(visibleItems().indexOf(item));
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(visibleItems().indexOf(item)); }
      });
    });
    function closeLightboxSafe() { closeLightbox(); }
    window.closeLightbox = closeLightboxSafe;
    if (lb) {
      lb.querySelector("[data-lb-close]").addEventListener("click", closeLightbox);
      lb.querySelector("[data-lb-prev]").addEventListener("click", function (e) { e.stopPropagation(); openLightbox(idx - 1); });
      lb.querySelector("[data-lb-next]").addEventListener("click", function (e) { e.stopPropagation(); openLightbox(idx + 1); });
      lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    }

    // Enquiry form -> Web3Forms (primary submission; no WhatsApp redirect)
    var form = document.getElementById("enquiryForm");
    if (form) {
      var WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
      var WEB3FORMS_KEY = "21253ec8-73e7-43bc-8e51-57510aaa8d33";
      var WEB3FORMS_SUBJECT = "New Catering Enquiry \u2014 Al-Hamza Caterers";
      var submitBtn = document.getElementById("enquirySubmit") || form.querySelector('[type="submit"]');
      var originalBtnLabel = submitBtn ? submitBtn.textContent : "Send Enquiry";

      function showNote(message, isSuccess) {
        var note = document.getElementById("formNote");
        if (!note) return;
        note.hidden = false;
        note.textContent = message;
        note.classList.toggle("form-note-success", !!isSuccess);
        note.classList.toggle("form-note-error", !isSuccess);
        try { note.focus({ preventScroll: false }); } catch (e) { note.focus(); }
      }

      function hideNote() {
        var note = document.getElementById("formNote");
        if (!note) return;
        note.hidden = true;
        note.textContent = "";
        note.classList.remove("form-note-success", "form-note-error");
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        hideNote();
        var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
        var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        var fields = [
          { id: "fName", test: function (v) { return v.length >= 2; }, msg: "Please enter your name." },
          { id: "fEmail", test: function (v) { return emailRe.test(v); }, msg: "Please enter a valid email address." },
          { id: "fPhone", test: function (v) { return /^[+\d][\d\s-]{7,15}$/.test(v); }, msg: "Please enter a valid phone number." },
          { id: "fEvent", test: function (v) { return v.length > 0; }, msg: "Please select an event type." },
          { id: "fDate", test: function (v) { return v.length > 0; }, msg: "Please choose an event date." },
          { id: "fGuests", test: function (v) { return v.length > 0; }, msg: "Please select guest count." }
        ];
        var ok = true, firstBad = null;
        fields.forEach(function (f) {
          var wrap = document.getElementById(f.id + "Wrap");
          var val = get(f.id);
          var valid = f.test(val);
          if (wrap) {
            wrap.classList.toggle("invalid", !valid);
            var err = wrap.querySelector(".err");
            if (err && !valid) err.textContent = f.msg;
          }
          if (!valid) { ok = false; if (!firstBad) firstBad = document.getElementById(f.id); }
        });
        if (!ok) { if (firstBad) firstBad.focus(); return; }

        var nameVal = get("fName");
        var emailVal = get("fEmail");
        var phoneVal = get("fPhone");
        var eventVal = get("fEvent");
        var dateVal = get("fDate");
        var guestsVal = get("fGuests");
        var locationVal = get("fLocation");
        var messageVal = get("fMessage");
        var botEl = document.getElementById("botcheck");

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.setAttribute("aria-disabled", "true");
          submitBtn.textContent = "Sending Enquiry...";
        }

        var payload = {
          access_key: WEB3FORMS_KEY,
          subject: WEB3FORMS_SUBJECT,
          from_name: nameVal,
          reply_to: emailVal,
          name: nameVal,
          email: emailVal,
          phone: phoneVal,
          event_type: eventVal,
          event_date: dateVal,
          guest_count: guestsVal,
          event_location: locationVal || "-",
          message: messageVal || "-",
          botcheck: botEl && botEl.checked ? true : false
        };

        fetch(WEB3FORMS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        }).then(function (res) {
          return res.json().then(function (data) {
            return { httpOk: res.ok, data: data };
          }).catch(function () {
            return { httpOk: res.ok, data: null };
          });
        }).then(function (out) {
          var success = !!(out && out.httpOk && out.data && out.data.success === true);
          if (success) {
            showNote("Thank you! Your catering enquiry has been submitted successfully. Our team will review your enquiry.", true);
            form.reset();
            form.querySelectorAll(".field.invalid").forEach(function (w) { w.classList.remove("invalid"); });
          } else {
            var apiMsg = out && out.data && out.data.message ? out.data.message : "";
            showNote("Sorry, we could not send your enquiry" + (apiMsg ? ": " + apiMsg : ".") + " Please check your connection and try again, or contact us on WhatsApp at +91 98187 76891.", false);
          }
        }).catch(function () {
          showNote("Sorry, we could not send your enquiry due to a network error. Please check your connection and try again, or contact us on WhatsApp at +91 98187 76891.", false);
        }).then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute("aria-disabled");
            submitBtn.textContent = originalBtnLabel;
          }
        });
      });
      // live clear
      form.querySelectorAll("input,select,textarea").forEach(function (el) {
        el.addEventListener("input", function () {
          var wrap = el.closest(".field");
          if (wrap) wrap.classList.remove("invalid");
        });
      });
    }

    // Video modal (gallery films — lazy load source on open)
    var vm = document.getElementById("videoModal");
    var vmVideo = document.getElementById("vmVideo");
    var vmCap = document.getElementById("vmCap");
    function openVideo(src, poster, title) {
      if (!vm || !vmVideo) return;
      vmVideo.poster = poster || "";
      vmVideo.src = src;
      vmVideo.setAttribute("aria-label", title || "Al-Hamza Caterers event film");
      if (vmCap) vmCap.textContent = title || "";
      vm.classList.add("open");
      vm.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var pr = vmVideo.play();
      if (pr && pr.catch) pr.catch(function () {});
    }
    function closeVideo() {
      if (!vm || !vmVideo) return;
      try { vmVideo.pause(); } catch (e) {}
      vmVideo.removeAttribute("src");
      vmVideo.load();
      vm.classList.remove("open");
      vm.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    document.querySelectorAll(".v-card").forEach(function (card) {
      card.addEventListener("click", function () {
        openVideo(card.getAttribute("data-video"), card.getAttribute("data-poster"), card.getAttribute("data-title"));
      });
    });
    if (vm) {
      var vmClose = vm.querySelector("[data-vm-close]");
      if (vmClose) vmClose.addEventListener("click", closeVideo);
      vm.addEventListener("click", function (e) { if (e.target === vm) closeVideo(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeVideo(); });
    }

    // Footer year
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
