'use strict';

(() => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const viewNames = {
    dashboard: 'Ringkasan',
    modulo: 'Operasi Modulo',
    converter: 'Huruf ↔ Angka',
    caesar: 'Caesar Cipher',
    xor: 'XOR Biner'
  };

  const algorithms = Object.freeze({
    modulo(first, divisor) {
      const positiveDivisor = Math.abs(divisor);
      return ((first % positiveDivisor) + positiveDivisor) % positiveDivisor;
    },
    lettersToNumbers(text) {
      return text.toUpperCase().split('').map((character) => {
        if (character === ' ') return '/';
        const position = alphabet.indexOf(character);
        if (position === -1) throw new Error('Gunakan hanya huruf A–Z dan spasi.');
        return String(position);
      }).join(' ');
    },
    numbersToLetters(text) {
      const words = text.trim().split('/');
      return words.map((word) => {
        const tokens = word.trim().split(/\s+/);
        if (tokens.length === 1 && tokens[0] === '') return '';
        return tokens.map((token) => {
          if (!/^-?\d+$/.test(token)) throw new Error('Pisahkan angka bulat dengan spasi dan gunakan / untuk spasi antarkata.');
          const number = Number(token);
          if (!Number.isSafeInteger(number) || number < 0 || number > 25) {
            throw new Error('Setiap angka harus berupa bilangan bulat dari 0 sampai 25.');
          }
          return alphabet[number];
        }).join('');
      }).join(' ');
    },
    caesar(text, key, mode) {
      const normalizedKey = ((key % 26) + 26) % 26;
      const direction = mode === 'decrypt' ? -1 : 1;
      return text.replace(/[A-Za-z]/g, (character) => {
        const position = alphabet.indexOf(character.toUpperCase());
        return alphabet[((position + direction * normalizedKey) % 26 + 26) % 26];
      });
    },
    xor(first, second) {
      const width = Math.max(first.length, second.length);
      const left = first.padStart(width, '0');
      const right = second.padStart(width, '0');
      const result = Array.from(left, (bit, index) => bit === right[index] ? '0' : '1').join('');
      return { left, right, result };
    }
  });

  window.CryptoLabAlgorithms = algorithms;

  const query = (selector, scope = document) => scope.querySelector(selector);
  const queryAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const toast = query('#toast');
  let toastTimeout;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function showError(id, message = '') {
    const element = query(`#${id}`);
    element.textContent = message;
    element.hidden = message === '';
  }

  function setReadyStatus(id, ready) {
    const element = query(`#${id}`);
    element.textContent = ready ? 'HASIL SIAP' : 'MENUNGGU INPUT';
    element.classList.toggle('is-ready', ready);
  }

  function updateView(viewName) {
    if (!Object.hasOwn(viewNames, viewName)) return;
    queryAll('[data-view]').forEach((view) => {
      const isCurrent = view.dataset.view === viewName;
      view.hidden = !isCurrent;
      view.classList.toggle('is-visible', isCurrent);
    });
    queryAll('[data-view-link]').forEach((link) => {
      const isCurrent = link.dataset.viewLink === viewName;
      link.classList.toggle('is-active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    query('#breadcrumb-current').textContent = viewNames[viewName];
    if (window.location.hash !== `#${viewName}`) {
      try {
        history.replaceState(null, '', `#${viewName}`);
      } catch {
        // File URLs can restrict history state updates; navigation still works without the hash.
      }
    }
  }

  function resetModulo() {
    query('#modulo-result').textContent = '—';
    query('#modulo-steps').textContent = 'Masukkan dua bilangan bulat untuk melihat prosesnya.';
    showError('modulo-error');
    setReadyStatus('modulo-status', false);
  }

  function resetConverter() {
    query('#converter-result').textContent = 'Hasil Anda akan muncul di sini.';
    query('#converter-result').dataset.copyValue = '';
    query('#converter-input-label').innerHTML = 'Teks <span>A–Z dan spasi</span>';
    query('#converter-hint').textContent = 'Huruf kecil akan diubah menjadi kapital. Spasi antarkata ditandai dengan /.';
    queryAll('[data-copy="converter-result"]').forEach((button) => { button.disabled = true; });
    showError('converter-error');
    setReadyStatus('converter-status', false);
  }

  function resetCaesar() {
    query('#caesar-result').textContent = 'Hasil Anda akan muncul di sini.';
    query('#caesar-result').dataset.copyValue = '';
    query('#caesar-key').value = '3';
    query('#caesar-key-number').value = '3';
    query('#caesar-key-output').value = '3';
    query('#caesar-steps').textContent = 'Kunci 3 mengubah A→D, B→E, C→F.';
    queryAll('[data-copy="caesar-result"]').forEach((button) => { button.disabled = true; });
    showError('caesar-error');
    setReadyStatus('caesar-status', false);
  }

  function resetXor() {
    query('#xor-visualization').innerHTML = '<p class="empty-visualization">Hasil dan proses tiap posisi bit akan tampil di sini.</p>';
    queryAll('[data-copy="xor-result-value"]').forEach((button) => { button.disabled = true; });
    showError('xor-error');
  }

  function handleModulo(event) {
    event.preventDefault();
    const firstText = query('#modulo-a').value.trim();
    const divisorText = query('#modulo-n').value.trim();
    if (!/^[+-]?\d+$/.test(firstText) || !/^[+-]?\d+$/.test(divisorText)) {
      showError('modulo-error', 'Masukkan dua bilangan bulat yang valid.');
      return;
    }
    const first = Number(firstText);
    const divisor = Number(divisorText);
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(divisor)) {
      showError('modulo-error', 'Gunakan bilangan bulat yang masih dalam rentang aman.');
      return;
    }
    if (divisor === 0) {
      showError('modulo-error', 'Pembagi tidak boleh 0. Masukkan bilangan lain.');
      return;
    }
    const result = algorithms.modulo(first, divisor);
    query('#modulo-result').textContent = String(result);
    const quotient = (first - result) / Math.abs(divisor);
    query('#modulo-steps').textContent = `${first} = (${quotient} × ${Math.abs(divisor)}) + ${result}; sisa positifnya adalah ${result}.`;
    showError('modulo-error');
    setReadyStatus('modulo-status', true);
  }

  function handleConverter(event) {
    event.preventDefault();
    const value = query('#converter-input').value;
    if (value.trim() === '') {
      showError('converter-error', 'Masukkan teks atau deretan angka terlebih dahulu.');
      return;
    }
    const mode = query('[name="converter-mode"]:checked').value;
    try {
      const result = mode === 'letters' ? algorithms.lettersToNumbers(value) : algorithms.numbersToLetters(value);
      query('#converter-result').textContent = result;
      query('#converter-result').dataset.copyValue = result;
      queryAll('[data-copy="converter-result"]').forEach((button) => { button.disabled = false; });
      showError('converter-error');
      setReadyStatus('converter-status', true);
    } catch (error) {
      showError('converter-error', error.message);
    }
  }

  function handleCaesar(event) {
    event.preventDefault();
    const text = query('#caesar-input').value;
    const keyText = query('#caesar-key-number').value.trim();
    if (text.trim() === '') {
      showError('caesar-error', 'Masukkan pesan yang ingin diproses.');
      return;
    }
    if (!/^\d+$/.test(keyText) || !Number.isSafeInteger(Number(keyText)) || Number(keyText) < 0 || Number(keyText) > 25) {
      showError('caesar-error', 'Kunci harus berupa bilangan bulat dari 0 sampai 25.');
      return;
    }
    const key = Number(keyText);
    const mode = query('[name="caesar-mode"]:checked').value;
    const result = algorithms.caesar(text, key, mode);
    query('#caesar-result').textContent = result;
    query('#caesar-result').dataset.copyValue = result;
    queryAll('[data-copy="caesar-result"]').forEach((button) => { button.disabled = false; });
    const direction = mode === 'decrypt' ? 'mundur' : 'maju';
    const shift = mode === 'decrypt' ? (26 - key) % 26 : key;
    const sample = Array.from({ length: 3 }, (_, index) => `${alphabet[index]}→${alphabet[(index + shift) % 26]}`).join(', ');
    query('#caesar-steps').textContent = `Kunci ${key}, geser ${direction}: ${sample}.`;
    showError('caesar-error');
    setReadyStatus('caesar-status', true);
  }

  function renderXor({ left, right, result }) {
    const container = query('#xor-visualization');
    container.replaceChildren();
    const grid = document.createElement('div');
    grid.className = 'bit-grid';
    grid.style.setProperty('--bit-count', String(result.length));
    const rows = [
      ['A', left, 'is-one'],
      ['B', right, 'is-one']
    ];
    rows.forEach(([label, bits, bitClass]) => {
      const rowLabel = document.createElement('span');
      rowLabel.className = 'bit-label';
      rowLabel.textContent = label;
      grid.append(rowLabel);
      Array.from(bits).forEach((bit) => {
        const cell = document.createElement('span');
        cell.className = `bit-cell${bit === '1' ? ` ${bitClass}` : ''}`;
        cell.textContent = bit;
        grid.append(cell);
      });
    });
    const operatorLabel = document.createElement('span');
    operatorLabel.className = 'bit-label';
    operatorLabel.textContent = 'A ⊕ B';
    grid.append(operatorLabel);
    const operator = document.createElement('span');
    operator.className = 'bit-label';
    operator.textContent = '⊕';
    operator.style.gridColumn = '2 / -1';
    grid.append(operator);
    const rule = document.createElement('span');
    rule.className = 'bit-rule';
    grid.append(rule);
    const resultLabel = document.createElement('span');
    resultLabel.className = 'bit-label';
    resultLabel.textContent = 'HASIL';
    grid.append(resultLabel);
    Array.from(result).forEach((bit) => {
      const cell = document.createElement('span');
      cell.className = `bit-cell is-result${bit === '1' ? ' is-one' : ''}`;
      cell.textContent = bit;
      grid.append(cell);
    });
    const resultText = document.createElement('output');
    resultText.className = 'xor-result-value';
    resultText.id = 'xor-result-value';
    resultText.textContent = result;
    grid.append(resultText);
    container.append(grid);
  }

  function handleXor(event) {
    event.preventDefault();
    const first = query('#xor-a').value.trim();
    const second = query('#xor-b').value.trim();
    if (first === '' || second === '') {
      showError('xor-error', 'Masukkan kedua bilangan biner terlebih dahulu.');
      return;
    }
    if (!/^[01]+$/.test(first) || !/^[01]+$/.test(second)) {
      showError('xor-error', 'Input biner hanya boleh berisi karakter 0 dan 1.');
      return;
    }
    renderXor(algorithms.xor(first, second));
    queryAll('[data-copy="xor-result-value"]').forEach((button) => { button.disabled = false; });
    showError('xor-error');
  }

  async function copyResult(button) {
    const target = query(`#${button.dataset.copy}`);
    const value = target?.dataset.copyValue || target?.textContent.trim();
    if (!value || value === 'Hasil Anda akan muncul di sini.') return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement('textarea');
        temporary.value = value;
        temporary.setAttribute('readonly', '');
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';
        document.body.append(temporary);
        temporary.select();
        const copied = document.execCommand('copy');
        temporary.remove();
        if (!copied) throw new Error('Clipboard tidak tersedia.');
      }
      showToast('Hasil berhasil disalin.');
    } catch {
      showToast('Tidak dapat menyalin otomatis. Pilih hasil lalu salin secara manual.');
    }
  }

  document.addEventListener('click', (event) => {
    const viewLink = event.target.closest('[data-view-link]');
    if (viewLink) {
      updateView(viewLink.dataset.viewLink);
      return;
    }
    const example = event.target.closest('[data-example]');
    if (example) applyExample(example);
  });

  function applyExample(button) {
    const type = button.dataset.example;
    if (type === 'modulo') {
      query('#modulo-a').value = button.dataset.a;
      query('#modulo-n').value = button.dataset.n;
      handleModulo(new Event('submit', { cancelable: true }));
    } else if (type === 'converter') {
      query(`[name="converter-mode"][value="${button.dataset.mode}"]`).checked = true;
      query('#converter-input').value = button.dataset.value;
      updateConverterMode();
      handleConverter(new Event('submit', { cancelable: true }));
    } else if (type === 'caesar') {
      query(`[name="caesar-mode"][value="${button.dataset.mode}"]`).checked = true;
      query('#caesar-input').value = button.dataset.value;
      query('#caesar-key').value = button.dataset.key;
      query('#caesar-key-number').value = button.dataset.key;
      query('#caesar-key-output').value = button.dataset.key;
      handleCaesar(new Event('submit', { cancelable: true }));
    } else if (type === 'xor') {
      query('#xor-a').value = button.dataset.a;
      query('#xor-b').value = button.dataset.b;
      handleXor(new Event('submit', { cancelable: true }));
    }
  }

  function updateConverterMode() {
    const isLettersMode = query('[name="converter-mode"]:checked').value === 'letters';
    query('#converter-input-label').innerHTML = isLettersMode ? 'Teks <span>A–Z dan spasi</span>' : 'Deretan angka <span>0–25, pisahkan dengan spasi</span>';
    query('#converter-hint').textContent = isLettersMode
      ? 'Huruf kecil akan diubah menjadi kapital. Spasi antarkata ditandai dengan /.'
      : 'Gunakan / untuk memisahkan kata. Contoh: 7 4 11 11 14 = HELLO.';
    query('#converter-input').placeholder = isLettersMode ? 'Contoh: CAT' : 'Contoh: 2 0 19';
  }

  query('#modulo-form').addEventListener('submit', handleModulo);
  query('#converter-form').addEventListener('submit', handleConverter);
  query('#caesar-form').addEventListener('submit', handleCaesar);
  query('#xor-form').addEventListener('submit', handleXor);

  query('#modulo-form').addEventListener('reset', () => window.setTimeout(resetModulo));
  query('#converter-form').addEventListener('reset', () => window.setTimeout(resetConverter));
  query('#caesar-form').addEventListener('reset', () => window.setTimeout(() => {
    resetCaesar();
    query('[name="caesar-mode"][value="encrypt"]').checked = true;
  }));
  query('#xor-form').addEventListener('reset', () => window.setTimeout(resetXor));
  queryAll('[data-copy]').forEach((button) => button.addEventListener('click', () => copyResult(button)));
  queryAll('[name="converter-mode"]').forEach((input) => input.addEventListener('change', updateConverterMode));
  query('#caesar-key').addEventListener('input', (event) => {
    query('#caesar-key-number').value = event.target.value;
    query('#caesar-key-output').value = event.target.value;
    showError('caesar-error');
  });
  query('#caesar-key-number').addEventListener('input', (event) => {
    const value = event.target.value;
    if (/^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 25) {
      query('#caesar-key').value = value;
      query('#caesar-key-output').value = value;
      showError('caesar-error');
    }
  });

  const initialView = window.location.hash.slice(1);
  updateView(Object.hasOwn(viewNames, initialView) ? initialView : 'dashboard');
})();