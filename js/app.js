/* To-Do Life Dashboard — app.js */

/* =========================================================
   StorageService
   Centralised localStorage wrapper.
   - All keys are namespaced under the 'lifedb_' prefix.
   - load()  : returns parsed value or null; never throws.
   - save()  : serialises to JSON, returns true on success,
               false on failure, and dispatches
               'lifedb:storage-error' on document on failure.
   - isAvailable() : probes whether localStorage is usable.
   ========================================================= */
const StorageService = (() => {
  const PREFIX = 'lifedb_';

  /**
   * Returns true if localStorage is available and writable.
   * @returns {boolean}
   */
  function isAvailable() {
    try {
      const probe = '__lifedb_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Reads and parses the value stored under `lifedb_<key>`.
   * Returns null if the key is absent or the stored value cannot be parsed.
   * @param {string} key - Key without the prefix.
   * @returns {any|null}
   */
  function load(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Serialises `value` to JSON and writes it under `lifedb_<key>`.
   * Returns true on success. On failure, returns false and dispatches
   * a 'lifedb:storage-error' custom event on document.
   * @param {string} key   - Key without the prefix.
   * @param {any}    value - Value to serialise.
   * @returns {boolean}
   */
  function save(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      document.dispatchEvent(new CustomEvent('lifedb:storage-error', {
        detail: { key: PREFIX + key, error: e }
      }));
      return false;
    }
  }

  return { isAvailable, load, save };
})();


/* =========================================================
   GreetingWidget
   Displays the current time, date, and a time-based greeting.
   Updates every second via setInterval.
   Makes no calls to StorageService.

   Public API (all methods exposed for unit-testing):
     getGreeting(hour)  → 'Good morning' | 'Good afternoon' |
                          'Good evening' | 'Good night'
     formatTime(date)   → 'HH:MM:SS'  (24-hour, zero-padded)
     formatDate(date)   → 'DayOfWeek, Month Day, Year'
                          e.g. 'Monday, January 6, 2025'
     init(rootEl)       → void  (starts the clock)
   ========================================================= */
const GreetingWidget = (() => {
  const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Returns the appropriate greeting for the given hour (0–23).
   * 00–04 → "Good night"
   * 05–11 → "Good morning"
   * 12–17 → "Good afternoon"
   * 18–20 → "Good evening"
   * 21–23 → "Good night"
   * @param {number} hour - Integer in range 0–23.
   * @returns {string}
   */
  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good morning';
    if (hour >= 12 && hour <= 17) return 'Good afternoon';
    if (hour >= 18 && hour <= 20) return 'Good evening';
    return 'Good night'; // covers 21–23 and 00–04
  }

  /**
   * Formats a Date as HH:MM in 24-hour, zero-padded.
   * @param {Date} date
   * @returns {string}  e.g. '09:05:07', '23:59:59'
   */
  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Formats a Date as "DayOfWeek, Month Day, Year"
   * e.g. "Monday, January 6, 2025"
   * Uses hard-coded English day/month arrays to avoid locale
   * inconsistencies across test environments.
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const dayName   = DAY_NAMES[date.getDay()];
    const monthName = MONTH_NAMES[date.getMonth()];
    const day       = date.getDate();
    const year      = date.getFullYear();
    return `${dayName}, ${monthName} ${day}, ${year}`;
  }

  /**
   * Initialises the widget against the given root element.
   * Queries #greeting-text, #time-display, and #date-display
   * within rootEl and updates them every second.
   * Handles missing elements gracefully (null-checks before
   * setting textContent).
   * @param {HTMLElement} rootEl
   */
  // ── Challenge 1: Custom name ────────────────────────────
  const NAME_KEY     = 'lifedb_username';
  const DEFAULT_NAME = 'Friend';

  function _loadName() {
    const stored = StorageService.load(NAME_KEY);
    return (typeof stored === 'string' && stored.trim().length > 0)
      ? stored.trim() : DEFAULT_NAME;
  }

  function _initNameEditor(greetingEl) {
    if (!greetingEl) return null;
    greetingEl.style.cssText = 'display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;';

    const label     = document.createElement('span');
    const editBtn   = document.createElement('button');
    const nameInput = document.createElement('input');
    const saveBtn   = document.createElement('button');
    const cancelBtn = document.createElement('button');

    editBtn.type = saveBtn.type = cancelBtn.type = 'button';
    editBtn.textContent   = '\u270F';
    saveBtn.textContent   = '\u2713';
    cancelBtn.textContent = '\u2715';
    editBtn.setAttribute('aria-label',   'Edit your name');
    saveBtn.setAttribute('aria-label',   'Save name');
    cancelBtn.setAttribute('aria-label', 'Cancel name edit');
    nameInput.type = 'text';
    nameInput.setAttribute('aria-label', 'Your name');
    nameInput.maxLength = 40;

    const btnStyle = 'background:none;border:none;cursor:pointer;font-size:0.85em;padding:0 0.15rem;line-height:1;';
    editBtn.style.cssText   = btnStyle + 'opacity:0.6;';
    saveBtn.style.cssText   = btnStyle + 'color:var(--color-primary);display:none;';
    cancelBtn.style.cssText = btnStyle + 'opacity:0.5;display:none;';
    nameInput.style.cssText = 'display:none;font:inherit;border:none;border-bottom:2px solid var(--color-primary);background:transparent;outline:none;width:9rem;padding:0 0.1rem;';

    greetingEl.append(label, editBtn, nameInput, saveBtn, cancelBtn);

    function enterEdit() {
      nameInput.value = _loadName();
      label.style.display = editBtn.style.display = 'none';
      nameInput.style.display = saveBtn.style.display = cancelBtn.style.display = '';
      nameInput.focus(); nameInput.select();
    }
    function exitEdit() {
      label.style.display = editBtn.style.display = '';
      nameInput.style.display = saveBtn.style.display = cancelBtn.style.display = 'none';
    }
    function commitEdit() {
      const v = nameInput.value.trim();
      if (v.length > 0) StorageService.save(NAME_KEY, v);
      exitEdit();
    }

    editBtn.addEventListener('click', enterEdit);
    cancelBtn.addEventListener('click', exitEdit);
    saveBtn.addEventListener('click', commitEdit);
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter')  commitEdit();
      if (e.key === 'Escape') exitEdit();
    });

    return label;
  }

  function init(rootEl) {
    const greetingEl = rootEl ? rootEl.querySelector('#greeting-text') : null;
    const timeEl     = rootEl ? rootEl.querySelector('#time-display')   : null;
    const dateEl     = rootEl ? rootEl.querySelector('#date-display')   : null;

    const greetingLabel = _initNameEditor(greetingEl);

    function tick() {
      const now = new Date();
      if (greetingLabel) greetingLabel.textContent = getGreeting(now.getHours()) + ', ' + _loadName() + '!';
      if (timeEl) timeEl.textContent = formatTime(now);
      if (dateEl) dateEl.textContent = formatDate(now);
    }
    tick();
    setInterval(tick, 1000);
  }

  return { init, getGreeting, formatTime, formatDate };
})();


/* =========================================================
   FocusTimer
   A 25-minute (1500-second) countdown timer with start,
   stop, and reset controls.  State is memory-only — it is
   not persisted between page loads.

   Timer states drive a CSS class on the root element:
     timer--idle    Initial state, displays 25:00
     timer--running Countdown active
     timer--paused  Countdown paused, remaining time shown
     timer--done    Reached 00:00, visually distinct

   Public API (all methods exposed for unit-testing):
     formatDisplay(totalSeconds) → 'MM:SS'  (zero-padded)
     init(rootEl)                → void
     start()                     → void
     stop()                      → void
     reset()                     → void
   ========================================================= */
const FocusTimer = (() => {
  const INITIAL_SECONDS = 25 * 60; // 1500

  // All CSS state classes applied to the root element.
  const STATE_CLASSES = ['timer--idle', 'timer--running', 'timer--paused', 'timer--done'];

  // Module-level references set during init().
  let _rootEl      = null;
  let _displayEl   = null;
  let _startBtn    = null;
  let _stopBtn     = null;
  let _resetBtn    = null;

  // Runtime state.
  let _remaining   = INITIAL_SECONDS; // seconds left
  let _intervalId  = null;            // setInterval handle or null
  let _state       = 'idle';          // 'idle' | 'running' | 'paused' | 'done'

  // ── Helpers ────────────────────────────────────────────

  /**
   * Formats an integer number of seconds into zero-padded 'MM:SS'.
   * @param {number} totalSeconds - Integer in range 0–1500.
   * @returns {string}  e.g. '25:00', '01:30', '00:00'
   */
  function formatDisplay(totalSeconds) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  /**
   * Applies exactly one CSS state class to the root element,
   * removing all others first.
   * @param {string} newState - One of: 'idle' | 'running' | 'paused' | 'done'
   */
  function _applyState(newState) {
    _state = newState;
    if (!_rootEl) return;
    STATE_CLASSES.forEach(cls => _rootEl.classList.remove(cls));
    _rootEl.classList.add(`timer--${newState}`);
  }

  /**
   * Updates the display element to show the current remaining time.
   */
  function _updateDisplay() {
    if (_displayEl) {
      _displayEl.textContent = formatDisplay(_remaining);
    }
  }

  /**
   * Clears the running interval, if any.
   */
  function _clearInterval() {
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  }

  // ── Public controls ────────────────────────────────────

  /**
   * Starts the countdown from the current remaining time.
   * No-op if the timer is already running or in the done state.
   */
  function start() {
    if (_state === 'running' || _state === 'done') return;

    _applyState('running');

    _intervalId = setInterval(() => {
      _remaining -= 1;

      // Clamp at 0 to avoid negative values.
      if (_remaining <= 0) {
        _remaining = 0;
        _updateDisplay();
        _clearInterval();
        _applyState('done');
        return;
      }

      _updateDisplay();
    }, 1000);
  }

  /**
   * Pauses the countdown and retains the remaining time.
   * No-op if the timer is not currently running.
   */
  function stop() {
    if (_state !== 'running') return;
    _clearInterval();
    _applyState('paused');
  }

  /**
   * Stops any active countdown and resets the display to 25:00.
   * Transitions to idle state regardless of the current state.
   */
  function reset() {
    _clearInterval();
    _remaining = INITIAL_SECONDS;
    _updateDisplay();
    _applyState('idle');
  }

  // ── Initialisation ─────────────────────────────────────

  /**
   * Wires the widget to its DOM subtree.
   * Expects the following elements inside rootEl:
   *   [data-timer-display]  — the MM:SS display element
   *   [data-timer-start]    — the Start button
   *   [data-timer-stop]     — the Stop button
   *   [data-timer-reset]    — the Reset button
   * @param {HTMLElement} rootEl
   */
  function init(rootEl) {
    _rootEl    = rootEl || null;
    _displayEl = rootEl ? rootEl.querySelector('[data-timer-display]') : null;
    _startBtn  = rootEl ? rootEl.querySelector('[data-timer-start]')   : null;
    _stopBtn   = rootEl ? rootEl.querySelector('[data-timer-stop]')    : null;
    _resetBtn  = rootEl ? rootEl.querySelector('[data-timer-reset]')   : null;

    // Set initial state and display.
    _remaining = INITIAL_SECONDS;
    _intervalId = null;
    _applyState('idle');
    _updateDisplay();

    // Wire event listeners (guard against missing elements).
    if (_startBtn) _startBtn.addEventListener('click', start);
    if (_stopBtn)  _stopBtn.addEventListener('click',  stop);
    if (_resetBtn) _resetBtn.addEventListener('click', reset);
  }

  return { init, start, stop, reset, formatDisplay };
})();


/* =========================================================
   TaskList
   Manages an in-memory array of Task objects that mirrors
   what is stored in localStorage under 'lifedb_tasks'.
   All mutations update the array first, then call
   StorageService.save.

   Data model — Task:
     @property {string}  id         UUID v4 (crypto.randomUUID or Date.now() fallback)
     @property {string}  name       1–200 characters
     @property {boolean} completed  false on creation
     @property {number}  createdAt  Unix timestamp (ms)

   Public API:
     init(rootEl)                  → void
     addTask(name)                 → Task | null  (null = validation failure)
     editTask(id, name)            → boolean
     toggleComplete(id)            → void
     deleteTask(id)                → void
     validateName(name)            → ValidationResult  { valid, message? }
   ========================================================= */
const TaskList = (() => {
  const STORAGE_KEY = 'lifedb_tasks';
  const CSS_DONE    = 'task--completed'; // applied to completed task rows

  // In-memory store — single source of truth after init.
  let _tasks = [];

  // DOM references set during init().
  let _rootEl      = null;
  let _listEl      = null;   // <ul> or <ol> that holds task items
  let _inputEl     = null;   // <input type="text"> for new task name
  let _addBtn      = null;   // button that triggers addTask
  let _alertEl     = null;   // <span role="alert"> for validation messages
  let _sortOrder   = 'default'; // Challenge 3: 'default' | 'az'

  // ── Helpers ────────────────────────────────────────────

  /**
   * Generates a UUID v4 using crypto.randomUUID() when available,
   * falling back to a Date.now()-based identifier.
   * @returns {string}
   */
  function _generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: base-36 timestamp + random suffix (not a true UUID but unique enough).
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  /**
   * Persists the current _tasks array via StorageService.
   * If save() returns false, dispatches lifedb:storage-error on document.
   */
  function _persist() {
    const ok = StorageService.save(STORAGE_KEY, _tasks);
    if (!ok) {
      document.dispatchEvent(new CustomEvent('lifedb:storage-error', {
        detail: { key: STORAGE_KEY }
      }));
    }
  }

  // ── Public business logic ──────────────────────────────

  /**
   * Validates a task name.
   * A name is valid iff its length is between 1 and 200 characters
   * (raw input, no trimming applied).
   * @param {string} name
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateName(name) {
    if (typeof name !== 'string' || name.length === 0) {
      return { valid: false, message: 'Task name cannot be empty.' };
    }
    if (name.length > 200) {
      return { valid: false, message: 'Task name must be 200 characters or fewer.' };
    }
    return { valid: true };
  }

  /**
   * Creates a new task and appends it to the in-memory array,
   * then persists.  Returns the new Task on success or null on
   * validation failure.
   * @param {string} name
   * @returns {Task|null}
   */
  function addTask(name) {
    const result = validateName(name);
    if (!result.valid) return null;

    /** @type {Task} */
    const task = {
      id:        _generateId(),
      name:      name,
      completed: false,
      createdAt: Date.now(),
    };

    _tasks.push(task);
    _persist();
    return task;
  }

  /**
   * Updates only the name of the task identified by id.
   * Returns false without persisting if the new name is empty
   * (fails validation) or the task is not found.
   * @param {string} id
   * @param {string} name
   * @returns {boolean}
   */
  function editTask(id, name) {
    const result = validateName(name);
    if (!result.valid) return false;

    const task = _tasks.find(t => t.id === id);
    if (!task) return false;

    task.name = name;
    _persist();
    return true;
  }

  /**
   * Flips the completed flag of the task identified by id
   * and persists the updated array.
   * @param {string} id
   */
  function toggleComplete(id) {
    const task = _tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    _persist();
    _renderList();
  }

  /**
   * Removes the task identified by id from the in-memory array
   * and persists.
   * @param {string} id
   */
  function deleteTask(id) {
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _tasks.splice(idx, 1);
    _persist();
    _renderList();
  }

  // ── Rendering ──────────────────────────────────────────

  /**
   * Builds or rebuilds the task list in the DOM.
   * Each task renders as an <li> with:
   *   - A <button> to toggle completion (checkbox-style)
   *   - A <span> or <input> displaying the task name
   *   - A <button> to enter edit mode
   *   - A <button> to delete the task
   * Completed tasks receive the CSS_DONE class.
   */
  function _renderList() {
    if (!_listEl) return;

    // Clear existing items.
    _listEl.innerHTML = '';

    // Challenge 3 — apply sort before rendering.
    const displayTasks = _sortOrder === 'az'
      ? [..._tasks].sort((a, b) => a.name.localeCompare(b.name))
      : _tasks;

    displayTasks.forEach(task => {
      const li = document.createElement('li');
      li.dataset.taskId = task.id;
      if (task.completed) li.classList.add(CSS_DONE);

      // ── Toggle complete button ──────────────────────
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.setAttribute('aria-label',
        (task.completed ? 'Mark incomplete: ' : 'Mark complete: ') + task.name);
      toggleBtn.classList.add('task__toggle');
      toggleBtn.setAttribute('data-action', 'toggle');
      toggleBtn.setAttribute('data-id', task.id);

      // ── Name display / edit input ───────────────────
      const nameSpan = document.createElement('span');
      nameSpan.classList.add('task__name');
      nameSpan.textContent = task.name;

      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.classList.add('task__edit-input');
      editInput.value = task.name;
      editInput.setAttribute('aria-label', 'Edit task name');
      editInput.hidden = true;

      // Inline validation alert for edit input.
      const editAlert = document.createElement('span');
      editAlert.setAttribute('role', 'alert');
      editAlert.classList.add('task__edit-alert');
      editAlert.hidden = true;

      // ── Edit button ─────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.name);
      editBtn.classList.add('task__edit-btn');
      editBtn.setAttribute('data-action', 'edit');
      editBtn.setAttribute('data-id', task.id);

      // ── Save button (hidden until edit mode) ────────
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      saveBtn.setAttribute('aria-label', 'Save edit');
      saveBtn.classList.add('task__save-btn');
      saveBtn.hidden = true;

      // ── Delete button ────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.name);
      deleteBtn.classList.add('task__delete-btn');
      deleteBtn.setAttribute('data-action', 'delete');
      deleteBtn.setAttribute('data-id', task.id);

      // ── Enter / exit edit mode ───────────────────────
      function enterEditMode() {
        nameSpan.hidden = true;
        editInput.hidden = false;
        editInput.value = task.name;
        editBtn.hidden = true;
        saveBtn.hidden = false;
        editAlert.hidden = true;
        editAlert.textContent = '';
        editInput.focus();
      }

      function exitEditMode() {
        nameSpan.hidden = false;
        editInput.hidden = true;
        editBtn.hidden = false;
        saveBtn.hidden = true;
        editAlert.hidden = true;
        editAlert.textContent = '';
      }

      editBtn.addEventListener('click', enterEditMode);

      saveBtn.addEventListener('click', () => {
        const newName = editInput.value;
        const validation = validateName(newName);
        if (!validation.valid) {
          editAlert.textContent = validation.message;
          editAlert.hidden = false;
          return;
        }
        const ok = editTask(task.id, newName);
        if (ok) {
          // Re-render reflects the updated name.
          _renderList();
        } else {
          editAlert.textContent = 'Could not save — please try again.';
          editAlert.hidden = false;
        }
      });

      // Allow saving with Enter key in the edit input.
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
        if (e.key === 'Escape') exitEditMode();
      });

      // Clear the inline alert as soon as the user types.
      editInput.addEventListener('input', () => {
        if (!editAlert.hidden && editInput.value.length > 0) {
          editAlert.hidden = true;
          editAlert.textContent = '';
        }
      });

      toggleBtn.addEventListener('click', () => toggleComplete(task.id));
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      li.appendChild(toggleBtn);
      li.appendChild(nameSpan);
      li.appendChild(editInput);
      li.appendChild(editAlert);
      li.appendChild(editBtn);
      li.appendChild(saveBtn);
      li.appendChild(deleteBtn);

      _listEl.appendChild(li);
    });
  }

  /**
   * Shows a validation message in the add-task alert span.
   * @param {string} message
   */
  function _showAddAlert(message) {
    if (!_alertEl) return;
    _alertEl.textContent = message;
    _alertEl.hidden = false;
  }

  /**
   * Hides the add-task alert span.
   */
  function _hideAddAlert() {
    if (!_alertEl) return;
    _alertEl.hidden = true;
    _alertEl.textContent = '';
  }

  // ── Initialisation ─────────────────────────────────────

  /**
   * Wires the TaskList widget to its DOM subtree and loads
   * persisted tasks.
   *
   * Expects the following elements inside rootEl:
   *   [data-task-list]       — <ul> or <ol> container for task items
   *   [data-task-input]      — <input type="text"> for new task name
   *   [data-task-add]        — button to submit a new task
   *   [data-task-alert]      — <span role="alert"> for add-form validation
   *
   * @param {HTMLElement} rootEl
   */
  function init(rootEl) {
    _rootEl   = rootEl || null;
    _listEl   = rootEl ? rootEl.querySelector('[data-task-list]')  : null;
    _inputEl  = rootEl ? rootEl.querySelector('[data-task-input]') : null;
    _addBtn   = rootEl ? rootEl.querySelector('[data-task-add]')   : null;
    _alertEl  = rootEl ? rootEl.querySelector('[data-task-alert]') : null;

    // If the alert span is missing from the HTML, create it and insert it
    // adjacent to the input so it is always present (create-once pattern).
    if (!_alertEl && _inputEl) {
      _alertEl = document.createElement('span');
      _alertEl.setAttribute('role', 'alert');
      _alertEl.classList.add('task__add-alert');
      _alertEl.hidden = true;
      _inputEl.insertAdjacentElement('afterend', _alertEl);
    }

    // Challenge 3 — inject sort dropdown next to the Tasks heading.
    const taskHeading = rootEl ? rootEl.querySelector('h2') : null;
    if (taskHeading && !rootEl.querySelector('[data-task-sort]')) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;';
      const sel = document.createElement('select');
      sel.setAttribute('data-task-sort', '');
      sel.setAttribute('aria-label', 'Sort tasks');
      sel.style.cssText =
        'margin-left:auto;font:inherit;font-size:0.8rem;' +
        'border:1px solid var(--color-border);border-radius:0.3rem;' +
        'padding:0.15rem 0.3rem;background:var(--color-surface);cursor:pointer;';
      [['default', 'Default'], ['az', 'A \u2013 Z']].forEach(function(pair) {
        const o = document.createElement('option');
        o.value = pair[0]; o.textContent = pair[1];
        sel.appendChild(o);
      });
      sel.value = _sortOrder;
      sel.addEventListener('change', function() { _sortOrder = sel.value; _renderList(); });
      taskHeading.parentNode.insertBefore(wrapper, taskHeading);
      wrapper.appendChild(taskHeading);
      wrapper.appendChild(sel);
    }

    // Load persisted tasks; treat null (missing or corrupted) as empty array.
    const stored = StorageService.load(STORAGE_KEY);
    _tasks = Array.isArray(stored) ? stored : [];

    // Initial render.
    _renderList();

    // Wire add-task button.
    if (_addBtn) {
      _addBtn.addEventListener('click', _handleAdd);
    }

    // Wire Enter key on the input field.
    if (_inputEl) {
      _inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') _handleAdd();
      });

      // Hide validation alert while user is typing a non-empty value.
      _inputEl.addEventListener('input', () => {
        if (_inputEl.value.length > 0) _hideAddAlert();
      });
    }
  }

  /**
   * Handles the "add task" action triggered by the button or Enter key.
   */
  function _handleAdd() {
    if (!_inputEl) return;
    const name = _inputEl.value;
    const result = validateName(name);

    if (!result.valid) {
      _showAddAlert(result.message);
      return;
    }

    // Challenge 2 — reject duplicates (case-insensitive).
    const isDuplicate = _tasks.some(
      t => t.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      _showAddAlert('A task with that name already exists.');
      return;
    }

    _hideAddAlert();
    const task = addTask(name);
    if (task) {
      _inputEl.value = '';
      _renderList();
    }
  }

  return { init, addTask, editTask, toggleComplete, deleteTask, validateName };
})();


/* =========================================================
   QuickLinks
   Manages an in-memory array of QuickLink objects that mirrors
   what is stored in localStorage under 'lifedb_links'.
   All mutations update the array first, then call
   StorageService.save.

   Data model — QuickLink:
     @property {string} id        UUID v4 (crypto.randomUUID or Date.now() fallback)
     @property {string} label     1–50 characters
     @property {string} url       starts with http:// or https://, at least one non-whitespace char after
     @property {number} createdAt Unix timestamp (ms); used to preserve insertion order on restore

   Public API:
     init(rootEl)                      → void
     addLink(label, url)               → QuickLink | null  (null = validation failure or cap reached)
     deleteLink(id)                    → void
     openLink(id)                      → void
     validateLabel(label)              → ValidationResult  { valid, message? }
     validateUrl(url)                  → ValidationResult  { valid, message? }
   ========================================================= */
const QuickLinks = (() => {
  const STORAGE_KEY = 'lifedb_links';
  const MAX_LINKS   = 20;

  // In-memory store — single source of truth after init.
  let _links = [];

  // DOM references set during init().
  let _rootEl       = null;
  let _listEl       = null;   // container that holds link items
  let _labelInputEl = null;   // <input type="text"> for new link label
  let _urlInputEl   = null;   // <input type="url"> for new link URL
  let _addBtn       = null;   // button that triggers addLink
  let _labelAlertEl = null;   // <span role="alert"> for label validation messages
  let _urlAlertEl   = null;   // <span role="alert"> for URL validation messages
  let _capAlertEl   = null;   // <span role="alert"> for cap-reached message

  // ── Helpers ────────────────────────────────────────────

  /**
   * Generates a UUID v4 using crypto.randomUUID() when available,
   * falling back to a Date.now()-based identifier.
   * @returns {string}
   */
  function _generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  /**
   * Persists the current _links array via StorageService.
   */
  function _persist() {
    const ok = StorageService.save(STORAGE_KEY, _links);
    if (!ok) {
      document.dispatchEvent(new CustomEvent('lifedb:storage-error', {
        detail: { key: STORAGE_KEY }
      }));
    }
  }

  // ── Public business logic ──────────────────────────────

  /**
   * Validates a quick link label.
   * A label is valid iff its length is between 1 and 50 characters.
   * @param {string} label
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateLabel(label) {
    if (typeof label !== 'string' || label.length === 0) {
      return { valid: false, message: 'Label cannot be empty.' };
    }
    if (label.length > 50) {
      return { valid: false, message: 'Label must be 50 characters or fewer.' };
    }
    return { valid: true };
  }

  /**
   * Validates a quick link URL.
   * A URL is valid iff it starts with http:// or https:// followed
   * by at least one non-whitespace character.
   * @param {string} url
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateUrl(url) {
    if (typeof url !== 'string' || url.length === 0) {
      return { valid: false, message: 'URL cannot be empty.' };
    }
    // Must start with http:// or https:// followed by at least one non-whitespace char.
    if (!/^https?:\/\/\S+/.test(url)) {
      return { valid: false, message: 'URL must start with http:// or https:// followed by a valid address.' };
    }
    return { valid: true };
  }

  /**
   * Creates a new QuickLink and appends it to the in-memory array,
   * then persists and re-renders. Returns the new QuickLink on success,
   * or null on validation failure or if the 20-link cap has been reached.
   * @param {string} label
   * @param {string} url
   * @returns {QuickLink|null}
   */
  function addLink(label, url) {
    const labelResult = validateLabel(label);
    if (!labelResult.valid) return null;

    const urlResult = validateUrl(url);
    if (!urlResult.valid) return null;

    if (_links.length >= MAX_LINKS) return null;

    /** @type {QuickLink} */
    const link = {
      id:        _generateId(),
      label:     label,
      url:       url,
      createdAt: Date.now(),
    };

    _links.push(link);
    _persist();
    return link;
  }

  /**
   * Removes the QuickLink identified by id from the in-memory array
   * and persists.
   * @param {string} id
   */
  function deleteLink(id) {
    const idx = _links.findIndex(l => l.id === id);
    if (idx === -1) return;
    _links.splice(idx, 1);
    _persist();
    _renderList();
  }

  /**
   * Opens the URL of the QuickLink identified by id in a new tab.
   * Uses noopener,noreferrer for security.
   * @param {string} id
   */
  function openLink(id) {
    const link = _links.find(l => l.id === id);
    if (!link) return;
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }

  // ── Rendering ──────────────────────────────────────────

  /**
   * Builds or rebuilds the link list in the DOM.
   * Each link renders as an <li> with:
   *   - A <button> to open the link in a new tab
   *   - A <span> displaying the label
   *   - A <button> to delete the link
   */
  function _renderList() {
    if (!_listEl) return;

    _listEl.innerHTML = '';

    _links.forEach(link => {
      const li = document.createElement('li');
      li.dataset.linkId = link.id;

      // ── Open link button ────────────────────────────
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.textContent = link.label;
      openBtn.setAttribute('aria-label', 'Open ' + link.label + ' in a new tab');
      openBtn.classList.add('link__open-btn');
      openBtn.setAttribute('data-action', 'open');
      openBtn.setAttribute('data-id', link.id);

      // ── URL hint (visible as small text) ────────────
      const urlSpan = document.createElement('span');
      urlSpan.classList.add('link__url');
      urlSpan.textContent = link.url;

      // ── Delete button ────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
      deleteBtn.classList.add('link__delete-btn');
      deleteBtn.setAttribute('data-action', 'delete');
      deleteBtn.setAttribute('data-id', link.id);

      openBtn.addEventListener('click', () => openLink(link.id));
      deleteBtn.addEventListener('click', () => deleteLink(link.id));

      li.appendChild(openBtn);
      li.appendChild(urlSpan);
      li.appendChild(deleteBtn);

      _listEl.appendChild(li);
    });

    // Show or hide the cap-reached message.
    if (_capAlertEl) {
      if (_links.length >= MAX_LINKS) {
        _capAlertEl.textContent = 'Maximum of 20 links reached. Delete a link to add more.';
        _capAlertEl.hidden = false;
      } else {
        _capAlertEl.hidden = true;
        _capAlertEl.textContent = '';
      }
    }
  }

  /**
   * Shows a validation message in the label alert span.
   * @param {string} message
   */
  function _showLabelAlert(message) {
    if (!_labelAlertEl) return;
    _labelAlertEl.textContent = message;
    _labelAlertEl.hidden = false;
  }

  /**
   * Hides the label alert span.
   */
  function _hideLabelAlert() {
    if (!_labelAlertEl) return;
    _labelAlertEl.hidden = true;
    _labelAlertEl.textContent = '';
  }

  /**
   * Shows a validation message in the URL alert span.
   * @param {string} message
   */
  function _showUrlAlert(message) {
    if (!_urlAlertEl) return;
    _urlAlertEl.textContent = message;
    _urlAlertEl.hidden = false;
  }

  /**
   * Hides the URL alert span.
   */
  function _hideUrlAlert() {
    if (!_urlAlertEl) return;
    _urlAlertEl.hidden = true;
    _urlAlertEl.textContent = '';
  }

  // ── Initialisation ─────────────────────────────────────

  /**
   * Wires the QuickLinks widget to its DOM subtree and loads
   * persisted links.
   *
   * Expects the following elements inside rootEl:
   *   [data-links-list]        — container for link items
   *   [data-link-label-input]  — <input type="text"> for new link label
   *   [data-link-url-input]    — <input type="url"> for new link URL
   *   [data-link-add]          — button to submit a new link
   *   [data-link-label-alert]  — <span role="alert"> for label validation
   *   [data-link-url-alert]    — <span role="alert"> for URL validation
   *   [data-link-cap-alert]    — <span role="alert"> for cap-reached message
   *
   * @param {HTMLElement} rootEl
   */
  function init(rootEl) {
    _rootEl       = rootEl || null;
    _listEl       = rootEl ? rootEl.querySelector('[data-links-list]')       : null;
    _labelInputEl = rootEl ? rootEl.querySelector('[data-link-label-input]') : null;
    _urlInputEl   = rootEl ? rootEl.querySelector('[data-link-url-input]')   : null;
    _addBtn       = rootEl ? rootEl.querySelector('[data-link-add]')         : null;
    _labelAlertEl = rootEl ? rootEl.querySelector('[data-link-label-alert]') : null;
    _urlAlertEl   = rootEl ? rootEl.querySelector('[data-link-url-alert]')   : null;
    _capAlertEl   = rootEl ? rootEl.querySelector('[data-link-cap-alert]')   : null;

    // Create label alert span if missing (create-once pattern).
    if (!_labelAlertEl && _labelInputEl) {
      _labelAlertEl = document.createElement('span');
      _labelAlertEl.setAttribute('role', 'alert');
      _labelAlertEl.classList.add('link__label-alert');
      _labelAlertEl.hidden = true;
      _labelInputEl.insertAdjacentElement('afterend', _labelAlertEl);
    }

    // Create URL alert span if missing.
    if (!_urlAlertEl && _urlInputEl) {
      _urlAlertEl = document.createElement('span');
      _urlAlertEl.setAttribute('role', 'alert');
      _urlAlertEl.classList.add('link__url-alert');
      _urlAlertEl.hidden = true;
      _urlInputEl.insertAdjacentElement('afterend', _urlAlertEl);
    }

    // Create cap alert span if missing.
    if (!_capAlertEl && _listEl) {
      _capAlertEl = document.createElement('span');
      _capAlertEl.setAttribute('role', 'alert');
      _capAlertEl.classList.add('link__cap-alert');
      _capAlertEl.hidden = true;
      _listEl.insertAdjacentElement('afterend', _capAlertEl);
    }

    // Load persisted links.
    const stored = StorageService.load(STORAGE_KEY);

    if (stored === null) {
      // Key absent — treat as empty array (fresh start or key was never written).
      _links = [];
    } else if (Array.isArray(stored)) {
      _links = stored;
    } else {
      // Data is present but not a valid array — corrupted storage (Req 4.7).
      _links = [];
      if (_rootEl) {
        const errorMsg = document.createElement('p');
        errorMsg.classList.add('link__data-error');
        errorMsg.setAttribute('role', 'alert');
        errorMsg.textContent = 'Could not load saved links — the stored data appears to be corrupted. Starting fresh.';
        _rootEl.prepend(errorMsg);
      }
    }

    // Initial render.
    _renderList();

    // Wire add-link button.
    if (_addBtn) {
      _addBtn.addEventListener('click', _handleAdd);
    }

    // Wire Enter key on URL input (last field in the form).
    if (_urlInputEl) {
      _urlInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') _handleAdd();
      });

      _urlInputEl.addEventListener('input', () => {
        if (_urlInputEl.value.length > 0) _hideUrlAlert();
      });
    }

    // Clear label alert as user types.
    if (_labelInputEl) {
      _labelInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') _handleAdd();
      });

      _labelInputEl.addEventListener('input', () => {
        if (_labelInputEl.value.length > 0) _hideLabelAlert();
      });
    }
  }

  /**
   * Handles the "add link" action triggered by the button or Enter key.
   */
  function _handleAdd() {
    const label = _labelInputEl ? _labelInputEl.value : '';
    const url   = _urlInputEl   ? _urlInputEl.value   : '';

    const labelResult = validateLabel(label);
    const urlResult   = validateUrl(url);

    let hasError = false;

    if (!labelResult.valid) {
      _showLabelAlert(labelResult.message);
      hasError = true;
    } else {
      _hideLabelAlert();
    }

    if (!urlResult.valid) {
      _showUrlAlert(urlResult.message);
      hasError = true;
    } else {
      _hideUrlAlert();
    }

    if (hasError) return;

    // Check cap before attempting to add.
    if (_links.length >= MAX_LINKS) {
      if (_capAlertEl) {
        _capAlertEl.textContent = 'Maximum of 20 links reached. Delete a link to add more.';
        _capAlertEl.hidden = false;
      }
      return;
    }

    const link = addLink(label, url);
    if (link) {
      if (_labelInputEl) _labelInputEl.value = '';
      if (_urlInputEl)   _urlInputEl.value   = '';
      _renderList();
    }
  }

  return { init, addLink, deleteLink, openLink, validateLabel, validateUrl };
})();


/* =========================================================
   Bootstrap — DOMContentLoaded
   Wires all widgets to their DOM roots and registers
   top-level event listeners.

   Sequence (per design.md initialisation order):
     1. Check localStorage availability (Req 7.5)
     2. GreetingWidget.init()
     3. FocusTimer.init()
     4. TaskList.init()
     5. QuickLinks.init()
     6. Register lifedb:storage-error handler (Req 5.3)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Browser-support check (Req 7.5) ─────────────────
  // localStorage is the only Web API required beyond universals
  // (Date, setInterval, crypto.*).  If it is unavailable, show
  // the support banner and continue with degraded (in-memory) mode.
  if (!StorageService.isAvailable()) {
    const supportBanner = document.getElementById('browser-support-banner');
    if (supportBanner) {
      supportBanner.textContent =
        'This browser does not support localStorage, which is required for ' +
        'data persistence. Please switch to a supported browser ' +
        '(Chrome, Firefox, Edge, or Safari).';
      supportBanner.hidden = false;
    }
  }

  // ── 2. GreetingWidget ───────────────────────────────────
  const greetingRoot = document.getElementById('greeting-widget');
  GreetingWidget.init(greetingRoot);

  // ── 3. FocusTimer ───────────────────────────────────────
  const timerRoot = document.getElementById('focus-timer');
  FocusTimer.init(timerRoot);

  // ── 4. TaskList ─────────────────────────────────────────
  const taskRoot = document.getElementById('task-list');
  TaskList.init(taskRoot);

  // ── 5. QuickLinks ───────────────────────────────────────
  const linksRoot = document.getElementById('quick-links');
  QuickLinks.init(linksRoot);

  // ── 6. Storage-error banner (Req 5.3) ───────────────────
  // Shows a non-blocking banner when any widget dispatches
  // lifedb:storage-error.  Auto-dismisses after 5 seconds.
  // Uses a single timer ref so rapid errors don't stack timers.
  let _storageErrorTimer = null;

  document.addEventListener('lifedb:storage-error', () => {
    const banner = document.getElementById('storage-error-banner');
    if (!banner) return;

    banner.textContent =
      'Your data could not be saved — storage may be full or unavailable. ' +
      'Changes will be lost when you close the page.';
    banner.hidden = false;

    // Clear any existing auto-dismiss timer before setting a new one.
    if (_storageErrorTimer !== null) {
      clearTimeout(_storageErrorTimer);
    }

    _storageErrorTimer = setTimeout(() => {
      banner.hidden = true;
      banner.textContent = '';
      _storageErrorTimer = null;
    }, 5000);
  });

});
