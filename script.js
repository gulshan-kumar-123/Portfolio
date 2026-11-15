(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.getElementById('reload-terminal').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname + location.search);
    location.reload();
  });
  const terminalWindow = document.getElementById('terminal-window');
  const terminalContent = document.getElementById('terminal-content');
  const minimize = document.getElementById('minimize-terminal');
  const reopenPanel = document.getElementById('terminal-reopen');
  minimize.addEventListener('click', () => {
    const collapsed = !terminalContent.hidden;
    terminalContent.hidden = collapsed;
    minimize.textContent = collapsed ? '□' : '−';
    minimize.setAttribute('aria-expanded', String(!collapsed));
    minimize.setAttribute('aria-label', collapsed ? 'Restore terminal' : 'Minimize terminal');
  });
  document.getElementById('close-terminal').addEventListener('click', () => {
    terminalWindow.hidden = true;
    reopenPanel.hidden = false;
    document.getElementById('open-terminal').focus();
  });
  document.getElementById('open-terminal').addEventListener('click', () => {
    terminalWindow.hidden = false;
    reopenPanel.hidden = true;
    minimize.focus();
  });
  const database = {};
  const text = (element, selector) => element.querySelector(selector)?.textContent.trim() || '';
  function renderTable(rows, columns) {
    const wrapper = document.createElement('div');
    wrapper.className = 'sql-output';
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    for (const column of columns) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = column;
      head.append(th);
    }
    const body = table.createTBody();
    for (const row of rows) {
      const tr = body.insertRow();
      for (const column of columns) {
        const td = tr.insertCell();
        td.dataset.label = column;
        const value = String(row[column] ?? 'NULL');
        if (/^(https?:|mailto:|tel:)/.test(value) || value.endsWith('.pdf')) {
          const link = document.createElement('a');
          link.href = value;
          link.textContent = value;
          td.append(link);
        } else td.textContent = value;
      }
    }
    wrapper.append(table);
    const count = document.createElement('p');
    count.className = 'sql-row-count';
    count.textContent = `${rows.length} row${rows.length === 1 ? '' : 's'} in set`;
    wrapper.append(count);
    return wrapper;
  }
  for (const section of document.querySelectorAll('main .section')) {
    const name = section.id;
    let rows;
    if (name === 'experience') rows = [...section.querySelectorAll('.experience-row')].map(el => ({
      company: text(el, 'h3').replace(/\s+active$/, ''), role: text(el, '.role'),
      period: text(el, '.experience-date'), description: text(el, ':scope > p:last-child')
    }));
    else if (name === 'projects') rows = [...section.querySelectorAll('.project-card')].map(el => ({
      project: text(el, 'h3'), stack: text(el, '.eyebrow'), description: text(el, '.project-content > p:not(.eyebrow)'), source: el.querySelector('a').getAttribute('href')
    }));
    else if (name === 'links' || name === 'contact') rows = [...section.querySelectorAll('.profile-links > a')].map(el => ({
      label: el.querySelector('span').firstChild.textContent.trim(), url: el.getAttribute('href')
    }));
    else rows = [...section.querySelectorAll('.background-grid > div')].map(el => ({
      [name === 'skills' ? 'category' : 'name']: text(el, 'h3'), details: text(el, 'p')
    }));
    database[name] = rows;
    const heading = section.querySelector('.section-heading');
    heading.querySelector('.typed-command').textContent = `SELECT * FROM ${name};`;
    const title = heading.querySelector('h2');
    title.querySelector('.prompt').textContent = 'mysql';
    title.querySelector('.path').textContent = '';
    // Replace the shell's dollar prompt with the MySQL prompt.
    for (const node of title.childNodes) if (node.nodeType === 3) node.textContent = '> ';
    [...section.children].filter(el => el !== heading).forEach(el => el.remove());
    section.append(renderTable(rows, Object.keys(rows[0])));
  }
  const exitSection = document.createElement('div');
  exitSection.className = 'sql-exit';
  exitSection.innerHTML = '<p class="shell-command"><span class="prompt">mysql</span>&gt; <span class="typed-command">exit;</span></p><div class="exit-output"><p>Bye</p><p class="shell-command"><span class="prompt">gulshan@portfolio</span><span class="path">:~</span>$ <span class="terminal-cursor" aria-hidden="true"></span></p></div>';
  document.querySelector('main').append(exitSection);
  // Keep the complete document readable without JavaScript or with reduced motion.
  // Reveal each command and output row at a deliberate pace.
  function startTerminalReveal() {
    if (reducedMotion.matches) return;
    const stages = [
      {command: document.querySelector('.profile-header .typed-command'),
        output: Array.from(document.querySelectorAll('.whoami-summary'))},
      {command: document.querySelector('.mysql-session .typed-command'),
        output: [document.querySelector('.connection-output')], section: document.querySelector('.mysql-session')},
      ...Array.from(document.querySelectorAll('main .section')).map(section => ({
        command: section.querySelector('.typed-command'),
        output: Array.from(section.querySelectorAll('.experience-row, .background-grid > div, .project-card, .profile-links > a, .sql-output')),
        section
      })),
      {command: exitSection.querySelector('.typed-command'), output: [exitSection.querySelector('.exit-output')], section: exitSection}
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
        for (const line of ['Opening terminal...']) {
          if (stopped) return;
          bootOutput.classList.add('typing-command');
          for (let i = 0; i < line.length; i++) {
            if (stopped) return;
            bootOutput.textContent = line.slice(0, i + 1);
            await wait(12);
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
              await wait(10);
            }
          }
          stage.command.classList.add('typing-command');
          const text = originals.get(stage.command);
          for (let i = 0; i < text.length; i++) {
            if (stopped) return;
            stage.command.textContent = text.slice(0, i + 1);
            await wait(16 + (i % 3) * 4);
          }
          stage.command.classList.remove('typing-command');
          for (const output of stage.output) {
            if (stopped) return;
            output.classList.remove('terminal-output-pending');
            output.classList.add('terminal-output-arriving');
            await wait(120);
          }
          await wait(180);
        }
      } finally {
        finish();
      }
    })();
  }
  if (!location.hash) startTerminalReveal();
})();
