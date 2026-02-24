/* ======================================
   SCI-TODO // 科幻控制台应用逻辑
   ====================================== */

(function () {
  'use strict';

  // --- DOM 引用 ---
  const taskInput = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const totalCount = document.getElementById('totalCount');
  const activeCount = document.getElementById('activeCount');
  const doneCount = document.getElementById('doneCount');
  const memUsage = document.getElementById('memUsage');
  const clockDisplay = document.getElementById('clockDisplay');

  // --- 状态 ---
  const STORAGE_KEY = 'sci-todo-tasks';
  let tasks = [];
  let isComposing = false; // 输入法合成状态标志（防止中文输入法 Enter 误触发）

  // --- 初始化 ---
  function init() {
    loadFromStorage();
    renderAll();
    updateClock();
    setInterval(updateClock, 1000);

    addBtn.addEventListener('click', handleAdd);

    // 监听输入法合成开始/结束，防止中文/日文等输入法按 Enter 确认候选词时误提交
    taskInput.addEventListener('compositionstart', () => { isComposing = true; });
    taskInput.addEventListener('compositionend', () => { isComposing = false; });

    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !isComposing) handleAdd();
    });
  }

  // --- 添加任务 ---
  function handleAdd() {
    const text = taskInput.value.trim();
    if (!text) {
      // 输入为空时触发故障抖动
      taskInput.parentElement.classList.add('glitch');
      setTimeout(() => taskInput.parentElement.classList.remove('glitch'), 300);
      return;
    }

    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text,
      completed: false,
      createdAt: Date.now(),
    };

    tasks.unshift(task);
    saveToStorage();
    renderTask(task, true);
    updateStats();
    taskInput.value = '';
    taskInput.focus();
  }

  // --- 渲染单条任务 ---
  function renderTask(task, prepend = false) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    // 复选框
    const check = document.createElement('div');
    check.className = 'task-check' + (task.completed ? ' checked' : '');
    check.addEventListener('click', () => toggleComplete(task.id));

    // 文字
    const span = document.createElement('span');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.textContent = task.text;

    // 删除按钮
    const del = document.createElement('button');
    del.className = 'task-delete';
    del.textContent = 'DEL';
    del.addEventListener('click', () => removeTask(task.id));

    li.appendChild(check);
    li.appendChild(span);
    li.appendChild(del);

    if (prepend) {
      taskList.prepend(li);
    } else {
      taskList.appendChild(li);
    }

    updateEmptyState();
  }

  // --- 渲染全部 ---
  function renderAll() {
    taskList.innerHTML = '';
    tasks.forEach((task) => renderTask(task, false));
    updateStats();
    updateEmptyState();
  }

  // --- 切换完成 ---
  function toggleComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveToStorage();

    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (li) {
      const check = li.querySelector('.task-check');
      const text = li.querySelector('.task-text');
      check.classList.toggle('checked', task.completed);
      text.classList.toggle('completed', task.completed);

      // 短暂的故障闪烁特效
      li.classList.add('glitch');
      setTimeout(() => li.classList.remove('glitch'), 300);
    }

    updateStats();
  }

  // --- 删除任务 ---
  function removeTask(id) {
    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (li) {
      li.classList.add('removing');
      li.addEventListener('animationend', () => {
        li.remove();
        tasks = tasks.filter((t) => t.id !== id);
        saveToStorage();
        updateStats();
        updateEmptyState();
      });
    }
  }

  // --- 更新统计 ---
  function updateStats() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const active = total - done;

    animateCounter(totalCount, total);
    animateCounter(activeCount, active);
    animateCounter(doneCount, done);
    memUsage.textContent = total;
  }

  // --- 数字跳动动画 ---
  function animateCounter(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const diff = target - current;
    const step = diff > 0 ? 1 : -1;
    let value = current;
    const interval = setInterval(() => {
      value += step;
      el.textContent = value;
      if (value === target) clearInterval(interval);
    }, 60);
  }

  // --- 空状态切换 ---
  function updateEmptyState() {
    if (tasks.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }

  // --- 本地存储 ---
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('SCI-TODO: Storage write failed', e);
    }
  }

  function loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        tasks = JSON.parse(data);
      }
    } catch (e) {
      console.warn('SCI-TODO: Storage read failed', e);
      tasks = [];
    }
  }

  // --- 实时时钟 ---
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = `${h}:${m}:${s}`;
  }

  // --- 启动 ---
  document.addEventListener('DOMContentLoaded', init);
})();
