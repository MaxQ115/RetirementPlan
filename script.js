/**
 * Retirement Plan Application Script
 * Implements real-time financial simulation, dynamic Chart.js rendering,
 * and the Shawshank Redemption digging progress tracker.
 */

// Global Chart Instance
let assetChart = null;

// Target amount in RMB
const RETIREMENT_TARGET = 5000000; // 500万

// Shawshank Storage Keys
const STORAGE_KEYS = {
  SAVINGS: 'shawshank_current_savings',
  LOGS: 'shawshank_dig_logs',
  TODOS: 'shawshank_todos'
};

// DOM Elements
const elements = {
  // Inputs
  initialCapital: document.getElementById('initialCapital'),
  monthlyContribution: document.getElementById('monthlyContribution'),
  cagrRate: document.getElementById('cagrRate'),
  yearsPeriod: document.getElementById('yearsPeriod'),

  // Tags
  displayInitialTag: document.getElementById('displayInitialTag'),
  displayMonthlyTag: document.getElementById('displayMonthlyTag'),
  displayCagrTag: document.getElementById('displayCagrTag'),
  displayYearsTag: document.getElementById('displayYearsTag'),

  // KPIs
  kpiInitial: document.getElementById('kpiInitial'),
  kpiCagr: document.getElementById('kpiCagr'),
  kpiFinalBalance: document.getElementById('kpiFinalBalance'),
  chartTargetBadge: document.getElementById('chartTargetBadge'),

  // Advice
  strategyAdviceText: document.getElementById('strategyAdviceText'),

  // Shawshank Tunnel
  tunnelPercent: document.getElementById('tunnelPercent'),
  dugChannelBar: document.getElementById('dugChannelBar'),
  currentSavingsDisplay: document.getElementById('currentSavingsDisplay'),
  currentMetersDisplay: document.getElementById('currentMetersDisplay'),
  remainingMetersDisplay: document.getElementById('remainingMetersDisplay'),
  currentMilestoneStage: document.getElementById('currentMilestoneStage'),
  stageCards: document.querySelectorAll('.stage-card'),

  // Hammer & Logs
  depositInput: document.getElementById('depositInput'),
  btnDeposit: document.getElementById('btnDeposit'),
  quickPillBtns: document.querySelectorAll('.pill-btn'),
  logsList: document.getElementById('logsList'),

  // Discipline Todos
  todoCheckboxes: document.querySelectorAll('.todo-cb'),
  checkedCount: document.getElementById('checkedCount')
};

// Currency Formatter
function formatCurrency(amount) {
  return '¥' + Math.round(amount).toLocaleString('en-US');
}

function formatCompactRMB(val) {
  if (val >= 100000000) {
    return '¥' + (val / 100000000).toFixed(2) + '亿';
  } else if (val >= 10000) {
    return '¥' + (val / 10000).toFixed(1) + 'W';
  }
  return '¥' + Math.round(val).toLocaleString('en-US');
}

function formatChartY(val) {
  if (val >= 10000000) {
    return '¥' + (val / 1000000).toFixed(1) + 'M';
  } else if (val >= 1000000) {
    return '¥' + (val / 1000000).toFixed(1) + 'M';
  } else if (val >= 10000) {
    return '¥' + (val / 10000).toFixed(0) + 'W';
  }
  return '¥' + val;
}

/**
 * Calculate yearly asset projection
 * @param {number} P Initial Capital
 * @param {number} PMT Monthly Contribution
 * @param {number} r Annual CAGR (0.05 = 5%)
 * @param {number} years Years
 */
function calculateProjection(P, PMT, r, years) {
  const dataPoints = [];
  const costPoints = [];
  const labels = [];
  
  // Effective monthly return rate
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

  for (let year = 0; year <= years; year++) {
    labels.push(year === 0 ? '0' : `${year}`);
    if (year === 0) {
      dataPoints.push(P);
      costPoints.push(P);
      continue;
    }

    const totalMonths = year * 12;
    // Initial principal compounded over totalMonths
    const futureValueOfP = P * Math.pow(1 + monthlyRate, totalMonths);

    // Future value of ordinary annuity for monthly contribution
    let futureValueOfPMT = 0;
    if (monthlyRate > 0) {
      futureValueOfPMT = PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    } else {
      futureValueOfPMT = PMT * totalMonths;
    }

    const totalBalance = futureValueOfP + futureValueOfPMT;
    const totalInvested = P + (PMT * totalMonths);

    dataPoints.push(Math.round(totalBalance));
    costPoints.push(Math.round(totalInvested));
  }

  return { labels, dataPoints, costPoints };
}

/**
 * Update Simulation UI & Chart
 */
function updateSimulation() {
  const P = parseFloat(elements.initialCapital.value) || 0;
  const PMT = parseFloat(elements.monthlyContribution.value) || 0;
  const cagrPercent = parseFloat(elements.cagrRate.value) || 0;
  const r = cagrPercent / 100;
  const years = parseInt(elements.yearsPeriod.value) || 5;

  // Update Tag Texts
  elements.displayInitialTag.textContent = formatCurrency(P);
  elements.displayMonthlyTag.textContent = formatCurrency(PMT);
  elements.displayCagrTag.textContent = `${cagrPercent.toFixed(1)}%`;
  elements.displayYearsTag.textContent = `${years} 年`;

  // Update KPI Row
  elements.kpiInitial.textContent = formatCurrency(P);
  elements.kpiCagr.textContent = `${cagrPercent.toFixed(1)}%`;

  // Compute Projections
  const { labels, dataPoints, costPoints } = calculateProjection(P, PMT, r, years);
  const finalBalance = dataPoints[dataPoints.length - 1];

  // Format KPI Final Balance
  if (finalBalance >= 10000000) {
    elements.kpiFinalBalance.textContent = '¥' + (finalBalance / 1000000).toFixed(2) + 'M';
  } else if (finalBalance >= 1000000) {
    elements.kpiFinalBalance.textContent = '¥' + (finalBalance / 1000000).toFixed(2) + 'M';
  } else {
    elements.kpiFinalBalance.textContent = formatCompactRMB(finalBalance);
  }

  // Target status badge
  if (finalBalance >= RETIREMENT_TARGET) {
    elements.chartTargetBadge.textContent = '🎉 已达成 500W 自由目标';
    elements.chartTargetBadge.className = 'chart-status success';
  } else {
    const gap = RETIREMENT_TARGET - finalBalance;
    elements.chartTargetBadge.textContent = `差 ${formatCompactRMB(gap)} 达标`;
    elements.chartTargetBadge.className = 'chart-status';
  }

  // Update dynamic Chart
  renderOrUpdateChart(labels, dataPoints, costPoints);

  // Update Strategy Advice
  renderStrategyAdvice(P, PMT, cagrPercent, years, finalBalance);
}

/**
 * Render or update Chart (supports Chart.js or Native Canvas fallback)
 */
function renderOrUpdateChart(labels, dataPoints, costPoints) {
  const canvas = document.getElementById('assetChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const targetLineData = labels.map(() => RETIREMENT_TARGET);

  // If Chart.js library is loaded
  if (typeof Chart !== 'undefined') {
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

    if (assetChart) {
      assetChart.data.labels = labels;
      assetChart.data.datasets[0].data = dataPoints;
      assetChart.data.datasets[1].data = costPoints;
      assetChart.data.datasets[2].data = targetLineData;
      assetChart.update('none');
    } else {
      assetChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: '账户总资产预测',
              data: dataPoints,
              borderColor: '#3b82f6',
              borderWidth: 2.5,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#3b82f6',
              pointRadius: 3.5,
              pointHoverRadius: 6,
              fill: true,
              backgroundColor: gradient,
              tension: 0.35
            },
            {
              label: '纯本金累计',
              data: costPoints,
              borderColor: '#64748b',
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false,
              tension: 0
            },
            {
              label: '500W 目标基准线',
              data: targetLineData,
              borderColor: '#e36c09',
              borderWidth: 1.5,
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
              tension: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              titleColor: '#cbd5e1',
              bodyColor: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                title: (items) => `第 ${items[0].label} 年末`,
                label: (context) => {
                  const name = context.dataset.label || '';
                  return `${name}: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: '年数', color: '#64748b', font: { size: 11 } },
              grid: { color: 'rgba(0, 0, 0, 0.06)', drawBorder: false },
              ticks: { color: '#64748b', font: { size: 11 } }
            },
            y: {
              grid: { color: 'rgba(0, 0, 0, 0.06)', drawBorder: false },
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: (value) => formatChartY(value)
              }
            }
          }
        }
      });
    }
  } else {
    // High-fidelity native Canvas fallback (100% offline proof)
    renderNativeCanvasChart(canvas, ctx, labels, dataPoints, costPoints, targetLineData);
  }
}

/**
 * Native Canvas Drawing Fallback (if CDN is blocked or offline)
 */
function renderNativeCanvasChart(canvas, ctx, labels, dataPoints, costPoints, targetLineData) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.parentElement.clientWidth || 340;
  const height = 220;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 20, right: 20, bottom: 30, left: 55 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxVal = Math.max(RETIREMENT_TARGET * 1.15, ...dataPoints, ...costPoints);
  const minVal = 0;

  const getX = (i) => padding.left + (i / (labels.length - 1)) * plotW;
  const getY = (v) => padding.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const yVal = (maxVal / steps) * s;
    const y = getY(yVal);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatChartY(yVal), padding.left - 6, y + 3);
  }

  // X Axis labels
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  labels.forEach((lbl, i) => {
    const x = getX(i);
    ctx.fillText(lbl, x, height - 10);
  });

  // 500W Target Line
  const targetY = getY(RETIREMENT_TARGET);
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#e36c09';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, targetY);
  ctx.lineTo(width - padding.right, targetY);
  ctx.stroke();
  ctx.restore();

  // Cost Line
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  costPoints.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  // Asset Growth Area Gradient
  const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  grad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
  grad.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

  ctx.beginPath();
  ctx.moveTo(getX(0), getY(dataPoints[0]));
  for (let i = 1; i < dataPoints.length; i++) {
    ctx.lineTo(getX(i), getY(dataPoints[i]));
  }
  ctx.lineTo(getX(dataPoints.length - 1), height - padding.bottom);
  ctx.lineTo(getX(0), height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Asset Growth Line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  dataPoints.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  dataPoints.forEach((val, i) => {
    const x = getX(i);
    const y = getY(val);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
  });
}

/**
 * Provide sensible, actionable financial advice
 */
function renderStrategyAdvice(P, PMT, cagrPercent, years, finalBalance) {
  let adviceHTML = '';
  
  if (PMT === 0 && years <= 5 && cagrPercent > 40) {
    adviceHTML = `
      <strong>🚨 警惕孤注一掷：</strong>零定投纯靠复合增长率 <strong>${cagrPercent}%</strong> 在现实中几乎注定会遭遇巨大回撤！建议：只要你每月坚持定投 <strong>¥10,000 ~ ¥15,000</strong>，年化收益要求即可大幅暴降至 <strong>8%~12%</strong>（优质红利/标普500历史中位水平），这才是可复制的越狱之路。
    `;
  } else if (finalBalance >= RETIREMENT_TARGET) {
    const totalPrincipal = P + PMT * 12 * years;
    const profit = finalBalance - totalPrincipal;
    const profitRatio = ((profit / totalPrincipal) * 100).toFixed(0);
    adviceHTML = `
      <strong>🎯 计划可行且健康：</strong>在 <strong>${years} 年</strong> 内，总共投入本金 <strong>${formatCompactRMB(totalPrincipal)}</strong>，复利带来增值 <strong>${formatCompactRMB(profit)}</strong> (+${profitRatio}%)。只要保持自律、抵御熊市情绪波动，500万退休目标触手可及！
    `;
  } else {
    const diff = RETIREMENT_TARGET - finalBalance;
    // Suggest alternative
    const neededPMT = Math.round((PMT + (diff / (years * 12))));
    adviceHTML = `
      <strong>🛠️ 达标优化方案：</strong>当前测算尚有 <strong>${formatCompactRMB(diff)}</strong> 缺口。你可以通过两个途径解决：<br>
      1. <strong>增加储蓄：</strong>将每月定投提升至约 <strong>${formatCurrency(neededPMT)}</strong>；<br>
      2. <strong>放宽期限：</strong>将退休年限由 ${years} 年放宽至 <strong>${years + 3} 年</strong>，给复利更宽裕的时间发酵。
    `;
  }

  elements.strategyAdviceText.innerHTML = adviceHTML;
}

/**
 * =========================================================
 * Shawshank Digging Tunnel System
 * =========================================================
 */
function initShawshankSystem() {
  // Load saved savings or default to 350,000
  let currentSavings = parseFloat(localStorage.getItem(STORAGE_KEYS.SAVINGS));
  if (isNaN(currentSavings) || currentSavings === null) {
    currentSavings = 350000;
    localStorage.setItem(STORAGE_KEYS.SAVINGS, currentSavings);
  }

  updateTunnelUI(currentSavings);

  // Setup Strike Hammer Button
  elements.btnDeposit.addEventListener('click', () => {
    const val = parseFloat(elements.depositInput.value);
    if (!val || val <= 0) {
      alert('请输入有效的储蓄金额！');
      return;
    }
    strikeHammer(val, '现金定投储蓄入账');
    elements.depositInput.value = '';
  });

  // Setup Quick Pill Buttons
  elements.quickPillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseFloat(btn.dataset.amount);
      const label = btn.textContent.split('(')[1]?.replace(')', '') || '追加储蓄';
      strikeHammer(amount, label);
    });
  });

  // Load Todo list state
  initTodoList();

  // Load logs
  renderLogs();
}

/**
 * Record a hammer strike (deposit savings)
 */
function strikeHammer(amount, reason = '追加储蓄') {
  let current = parseFloat(localStorage.getItem(STORAGE_KEYS.SAVINGS)) || 350000;
  current += amount;
  localStorage.setItem(STORAGE_KEYS.SAVINGS, current);

  // Meters gained: 10,000 RMB = 1 meter
  const metersGained = (amount / 10000).toFixed(2);

  // Add Log
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const newLog = {
    date: dateStr,
    text: `${reason} (+${formatCurrency(amount)})`,
    meters: `+${metersGained} 米`
  };

  const logs = getLogs();
  logs.unshift(newLog);
  if (logs.length > 20) logs.pop();
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

  // Visual Update
  updateTunnelUI(current);
  renderLogs();

  // Highlight Andy runner animation
  const andy = document.querySelector('.andy-runner');
  if (andy) {
    andy.style.transform = 'scale(1.4) scaleX(-1)';
    setTimeout(() => {
      andy.style.transform = 'scale(1) scaleX(-1)';
    }, 400);
  }
}

/**
 * Update the tunnel display, milestones, and meters
 */
function updateTunnelUI(savings) {
  // 500W = 500 meters
  const totalMeters = 500;
  const currentMeters = Math.min(savings / 10000, 500);
  const percent = Math.min((currentMeters / totalMeters) * 100, 100);
  const remainingMeters = Math.max(0, totalMeters - currentMeters);

  elements.tunnelPercent.textContent = `${percent.toFixed(1)}%`;
  elements.dugChannelBar.style.width = `${Math.max(percent, 5)}%`; // Keep at least 5% visible for icon
  elements.currentSavingsDisplay.textContent = formatCurrency(savings);
  elements.currentMetersDisplay.textContent = `${currentMeters.toFixed(1)} 米`;
  elements.remainingMetersDisplay.textContent = `${remainingMeters.toFixed(1)} 米`;

  // Milestone Stages Check
  let currentStageName = '第一关：圣经中的小石锤';
  elements.stageCards.forEach(card => {
    const meterTarget = parseFloat(card.dataset.meter);
    const checkEl = card.querySelector('.stage-check');

    if (currentMeters >= meterTarget) {
      card.className = 'stage-card passed';
      checkEl.textContent = '✓';
    } else if (currentMeters < meterTarget && card.previousElementSibling?.classList.contains('passed') || (!card.previousElementSibling && currentMeters < meterTarget)) {
      card.className = 'stage-card active';
      checkEl.textContent = '⛏️';
      currentStageName = card.querySelector('.stage-name').textContent;
    } else {
      card.className = 'stage-card';
      checkEl.textContent = '🔒';
    }
  });

  if (currentMeters >= 500) {
    currentStageName = '🏆 已冲破高墙，抵达太平洋！';
  }
  elements.currentMilestoneStage.textContent = currentStageName;
}

function getLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      date: '初始记录',
      text: '启动本金 ¥350,000，牢房高墙被掘出基石',
      meters: '+35.0 米'
    }
  ];
}

function renderLogs() {
  const logs = getLogs();
  elements.logsList.innerHTML = logs.map(log => `
    <li class="log-item">
      <span class="log-date">${log.date}</span>
      <span class="log-text">${log.text}</span>
      <span class="log-dist">${log.meters}</span>
    </li>
  `).join('');
}

/**
 * Todo list state management
 */
function initTodoList() {
  let savedTodos = [];
  try {
    savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEYS.TODOS)) || [];
  } catch(e) {}

  elements.todoCheckboxes.forEach((cb, index) => {
    if (savedTodos.length > index) {
      cb.checked = savedTodos[index];
    }
    cb.addEventListener('change', () => {
      saveTodoList();
      updateTodoCount();
    });
  });

  updateTodoCount();
}

function saveTodoList() {
  const state = Array.from(elements.todoCheckboxes).map(cb => cb.checked);
  localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(state));
}

function updateTodoCount() {
  const total = elements.todoCheckboxes.length;
  const checked = Array.from(elements.todoCheckboxes).filter(cb => cb.checked).length;
  elements.checkedCount.textContent = `已践行 ${checked}/${total}`;
}

// Bind Sliders to real-time update
[
  elements.initialCapital,
  elements.monthlyContribution,
  elements.cagrRate,
  elements.yearsPeriod
].forEach(input => {
  input.addEventListener('input', () => {
    // Clear active preset state if user manually touches slider
    const fBtn = document.getElementById('btnPresetFantasy');
    const rBtn = document.getElementById('btnPresetRealistic');
    if (fBtn) fBtn.classList.remove('active');
    if (rBtn) rBtn.classList.remove('active');
    updateSimulation();
  });
});

// Setup Presets
function setupPresetButtons() {
  const btnFantasy = document.getElementById('btnPresetFantasy');
  const btnRealistic = document.getElementById('btnPresetRealistic');

  if (btnFantasy) {
    btnFantasy.addEventListener('click', () => {
      elements.initialCapital.value = 350000;
      elements.monthlyContribution.value = 0;
      elements.cagrRate.value = 70.2;
      elements.yearsPeriod.value = 5;

      btnFantasy.classList.add('active');
      btnRealistic?.classList.remove('active');
      updateSimulation();
    });
  }

  if (btnRealistic) {
    btnRealistic.addEventListener('click', () => {
      elements.initialCapital.value = 350000;
      elements.monthlyContribution.value = 12000;
      elements.cagrRate.value = 10.0;
      elements.yearsPeriod.value = 8;

      btnRealistic.classList.add('active');
      btnFantasy?.classList.remove('active');
      updateSimulation();
    });
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  setupPresetButtons();
  updateSimulation();
  initShawshankSystem();
});
