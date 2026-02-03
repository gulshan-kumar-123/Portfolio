// Portfolio – typewriter one line at a time, cursor removed when done
(function () {
  var typewriterSpeed = 65;
  var linePause = 400;
  var lineStagger = 120;
  var lineRevealDuration = 400;

  document.querySelectorAll(".page-wrap.scroll-anim > *:not(.block-title)").forEach(function (el) {
    el.classList.add("line-reveal");
  });
  document.querySelectorAll(".hero.scroll-anim .hero-inner > *:not(.hero-title)").forEach(function (el) {
    el.classList.add("line-reveal");
  });

  function runTypewriter(el, onDone) {
    if (el.dataset.typed === "1") {
      if (onDone) onDone();
      return;
    }
    el.dataset.typed = "1";
    var text = el.textContent;
    var lines = text.split("\n");
    el.textContent = "";
    el.style.overflow = "visible";
    var cursor = document.createElement("span");
    cursor.className = "typewriter-cursor";
    cursor.setAttribute("aria-hidden", "true");
    el.appendChild(cursor);
    var delay = 0;
    lines.forEach(function (line, lineIdx) {
      if (lineIdx > 0) delay += linePause;
      for (var i = 0; i < line.length; i++) {
        var span = document.createElement("span");
        span.className = "type-char";
        span.textContent = line[i];
        el.appendChild(span);
        (function (s, d) {
          setTimeout(function () {
            s.classList.add("visible");
            el.insertBefore(cursor, s.nextSibling);
          }, d);
        })(span, delay);
        delay += typewriterSpeed;
      }
      if (lineIdx < lines.length - 1) {
        el.appendChild(document.createElement("br"));
      }
    });
    setTimeout(function () {
      if (cursor.parentNode) cursor.remove();
      if (onDone) onDone();
    }, delay + typewriterSpeed);
  }

  function staggerLines(container, onDone) {
    var lines = container.querySelectorAll(".line-reveal");
    var startDelay = 200;
    if (lines.length === 0) {
      if (onDone) onDone();
      return;
    }
    lines.forEach(function (line, i) {
      (function (el, idx) {
        setTimeout(function () {
          el.classList.add("visible");
        }, startDelay + lineStagger * idx);
      })(line, i);
    });
    setTimeout(function () {
      if (onDone) onDone();
    }, startDelay + lineStagger * lines.length + lineRevealDuration);
  }

  function runSequence() {
    var sections = document.querySelectorAll(".scroll-anim");
    var idx = 0;

    function next() {
      if (idx >= sections.length) return;
      var section = sections[idx];
      section.classList.add("in-view");
      var title = section.querySelector(".type-on-scroll");
      if (title) {
        runTypewriter(title, function () {
          staggerLines(section, function () {
            idx++;
            next();
          });
        });
      } else {
        staggerLines(section, function () {
          idx++;
          next();
        });
      }
    }

    next();
  }

  document.body.addEventListener("page-revealed", runSequence);
})();
