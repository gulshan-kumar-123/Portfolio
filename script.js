(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Keep the complete document readable without JavaScript or with reduced motion.
  // Reveal each command and output row at a deliberate pace.
  function startTerminalReveal() {
    if (reducedMotion.matches) return;
    const stages = [
      {command: document.querySelector('.profile-header .typed-command'),
        output: Array.from(document.querySelectorAll('.whoami-summary'))},
      ...Array.from(document.querySelectorAll('main > .section')).map(section => ({
        command: section.querySelector('.typed-command'),
        output: Array.from(section.querySelectorAll('.experience-row, .background-grid > div, .project-card, .profile-links > a')),
        section
      }))
    ];
    let stopped = false;
    const boot = document.getElementById('terminal-boot');
    const bootOutput = document.getElementById('boot-output');
    const firstPrompt = document.querySelector('.profile-header .shell-command');
    boot.hidden = false;
    firstPrompt.classList.add('terminal-pending');
    const originals = new Map();
    const promptOriginals = new Map();
    const hidden = [];
    const pending = [];
    for (const stage of stages) {
      originals.set(stage.command, stage.command.textContent);
      stage.command.textContent = '';
      stage.prefix = Array.from(stage.command.parentElement.childNodes)
        .filter(node => node !== stage.command);
      for (const node of stage.prefix) {
        promptOriginals.set(node, node.textContent);
        node.textContent = '';
      }
      if (stage.section) {
        stage.section.classList.add('terminal-pending');
        pending.push(stage.section);
      }
      for (const output of stage.output) {
        output.classList.add('terminal-output-pending');
        hidden.push(output);
      }
    }
    const tail = Array.from(document.querySelectorAll('.bottom-contact'));
    tail.forEach(el => el.classList.add('terminal-output-pending'));
    hidden.push(...tail);
    const onEscape = event => { if (event.key === 'Escape') finish(); };
    function finish() {
      stopped = true;
      firstPrompt.classList.remove('terminal-pending');
      bootOutput.classList.remove('typing-command');
      bootOutput.textContent = 'Session ready.';
      boot.hidden = true;
      promptOriginals.forEach((text, node) => { node.textContent = text; });
      originals.forEach((text, el) => {
        el.textContent = text;
        el.classList.remove('typing-command');
      });
      hidden.forEach(el => el.classList.remove('terminal-output-pending'));
      pending.forEach(el => el.classList.remove('terminal-pending'));
      window.removeEventListener('keydown', onEscape);
      reducedMotion.removeEventListener('change', finish);
    }
    window.addEventListener('keydown', onEscape);
    reducedMotion.addEventListener('change', finish);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    (async () => {
      try {
        for (const line of ['Opening portfolio...', 'Loading profile...', 'Session ready.']) {
          if (stopped) return;
          bootOutput.classList.add('typing-command');
          for (let i = 0; i < line.length; i++) {
            if (stopped) return;
            bootOutput.textContent = line.slice(0, i + 1);
            await wait(26);
          }
          await wait(240);
        }
        bootOutput.classList.remove('typing-command');
        await wait(1000);
        if (stopped) return;
        boot.hidden = true;
        firstPrompt.classList.remove('terminal-pending');
        for (const stage of stages) {
          if (stopped) return;
          if (stage.section) stage.section.classList.remove('terminal-pending');
          for (const node of stage.prefix) {
            const prefixText = promptOriginals.get(node);
            if (stage !== stages[0]) {
              node.textContent = prefixText;
              continue;
            }
            for (let i = 0; i < prefixText.length; i++) {
              if (stopped) return;
              node.textContent = prefixText.slice(0, i + 1);
              await wait(24);
            }
          }
          stage.command.classList.add('typing-command');
          const text = originals.get(stage.command);
          for (let i = 0; i < text.length; i++) {
            if (stopped) return;
            stage.command.textContent = text.slice(0, i + 1);
            await wait(45 + (i % 3) * 14);
          }
          stage.command.classList.remove('typing-command');
          for (const output of stage.output) {
            if (stopped) return;
            output.classList.remove('terminal-output-pending');
            output.classList.add('terminal-output-arriving');
            await wait(280);
          }
          await wait(380);
        }
      } finally {
        finish();
      }
    })();
  }
  if (!location.hash) startTerminalReveal();
})();
