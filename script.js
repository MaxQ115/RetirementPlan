/**
 * Retirement Plan Application Script
 * Implements real-time financial simulation, dynamic Chart.js rendering,
 * Leverage Interest Calculator, and the Shawshank Redemption 5-Step interactive tracker.
 */

// Global Chart Instance
let assetChart = null;

// Target amount in RMB
const RETIREMENT_TARGET = 5000000; // 500万

// Storage Keys
const STORAGE_KEYS = {
  SAVINGS: 'shawshank_current_savings',
  LOGS: 'shawshank_dig_logs',
  TODOS: 'shawshank_todos',
  STEP_LEVEL: 'shawshank_step_level'
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

  // Leverage Calculator Elements
  levAmount: document.getElementById('levAmount'),
  levRate: document.getElementById('levRate'),
  levAmountDisplay: document.getElementById('levAmountDisplay'),
  levRateDisplay: document.getElementById('levRateDisplay'),
  levTermDisplay: document.getElementById('levTermDisplay'),
  levMonthlyPayment: document.getElementById('levMonthlyPayment'),
  levPaymentLabel: document.getElementById('levPaymentLabel'),
  levPaymentSub: document.getElementById('levPaymentSub'),
  levTotalInterest: document.getElementById('levTotalInterest'),
  levInterestRatio: document.getElementById('levInterestRatio'),
  levTotalRepayment: document.getElementById('levTotalRepayment'),
  levPrincipalBaseSub: document.getElementById('levPrincipalBaseSub'),
  levRiskTip: document.getElementById('levRiskTip'),
  btnToggleSchedule: document.getElementById('btnToggleSchedule'),
  scheduleToggleText: document.getElementById('scheduleToggleText'),
  scheduleArrow: document.getElementById('scheduleArrow'),
  scheduleTableWrap: document.getElementById('scheduleTableWrap'),
  scheduleTableBody: document.getElementById('scheduleTableBody'),
  btnOpenModalSchedule: document.getElementById('btnOpenModalSchedule'),
  scheduleModal: document.getElementById('scheduleModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  modalScheduleTableBody: document.getElementById('modalScheduleTableBody'),
  modalPlanSubtitle: document.getElementById('modalPlanSubtitle'),
  modalSummaryBanner: document.getElementById('modalSummaryBanner'),

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

function formatDecCurrency(amount) {
  return '¥' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
 * Section 1: Reality Check Dynamic Calculations
 */
function initRealitySection() {
  const tInput = document.getElementById('realityTargetInput');
  const yInput = document.getElementById('realityYearsInput');
  const iInput = document.getElementById('realityInitialInput');
  if (!tInput || !yInput || !iInput) return;

  [tInput, yInput, iInput].forEach(inp => {
    inp.addEventListener('input', updateRealitySection);
  });

  updateRealitySection();
}

function updateRealitySection() {
  const tInput = document.getElementById('realityTargetInput');
  const yInput = document.getElementById('realityYearsInput');
  const iInput = document.getElementById('realityInitialInput');
  if (!tInput || !yInput || !iInput) return;

  const targetW = Math.max(1, parseFloat(tInput.value) || 500);
  const years = Math.max(1, parseInt(yInput.value) || 5);
  const initialW = Math.max(0.1, parseFloat(iInput.value) || 30);

  const multiple = targetW / initialW;
  const cagr = ((Math.pow(multiple, 1 / years) - 1) * 100);

  const cagrDisplay = document.getElementById('realityCagrDisplay');
  const yearsDisplay = document.getElementById('realityYearsDisplay');
  const multDisplay = document.getElementById('realityMultipleDisplay');
  const alarmDesc = document.getElementById('realityAlarmDesc');
  const stepper = document.getElementById('realityTimelineStepper');

  if (cagrDisplay) cagrDisplay.textContent = cagr > 0 ? cagr.toFixed(2) : '0.00';
  if (yearsDisplay) yearsDisplay.textContent = years;
  if (multDisplay) multDisplay.textContent = `${multiple.toFixed(2)} 倍`;
  if (alarmDesc) {
    alarmDesc.innerHTML = `连续 ${years} 年维持 ${cagr.toFixed(2)}% 的年复合收益率，在专业金融投资中属于<strong>极低概率事件</strong>。这是不可能的，痴人做梦！`;
  }

  if (stepper) {
    let stepsHTML = '';
    const rateFactor = 1 + (cagr / 100);
    for (let k = 1; k <= years; k++) {
      const isFinal = (k === years);
      let amountW = 0;
      if (isFinal) {
        amountW = targetW;
      } else {
        amountW = initialW * Math.pow(rateFactor, k);
      }
      stepsHTML += `
        <div class="step-row ${isFinal ? 'final' : ''}">
          <span class="year-pill ${isFinal ? 'target-pill' : ''}">第 ${k} 年末</span>
          <span class="line-dots"></span>
          <span class="amount ${isFinal ? 'highlight-orange' : ''}">约 ${amountW.toFixed(2)} 万元</span>
        </div>
      `;
    }
    stepper.innerHTML = stepsHTML;
  }
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

    const totalAsset = futureValueOfP + futureValueOfPMT;
    const totalCost = P + (PMT * totalMonths);

    dataPoints.push(Math.round(totalAsset));
    costPoints.push(Math.round(totalCost));
  }

  return { labels, dataPoints, costPoints };
}

/**
 * Main function to update calculations & render chart
 */
function updateSimulation() {
  const P = parseFloat(elements.initialCapital.value) || 0;
  const PMT = parseFloat(elements.monthlyContribution.value) || 0;
  const rPercent = parseFloat(elements.cagrRate.value) || 0;
  const r = rPercent / 100;
  const years = parseInt(elements.yearsPeriod.value) || 1;

  // 1. Update tag pills
  elements.displayInitialTag.textContent = formatCurrency(P);
  elements.displayMonthlyTag.textContent = formatCurrency(PMT);
  elements.displayCagrTag.textContent = `${rPercent.toFixed(1)}%`;
  elements.displayYearsTag.textContent = `${years} 年`;

  // 2. Perform projection math
  const { labels, dataPoints, costPoints } = calculateProjection(P, PMT, r, years);
  const finalBalance = dataPoints[dataPoints.length - 1];

  // 3. Update 3 KPIs
  elements.kpiInitial.textContent = formatCurrency(P);
  elements.kpiCagr.textContent = `${rPercent.toFixed(1)}%`;
  elements.kpiFinalBalance.textContent = formatCompactRMB(finalBalance);

  // Target status badge
  if (finalBalance >= RETIREMENT_TARGET) {
    const surplus = finalBalance - RETIREMENT_TARGET;
    elements.chartTargetBadge.textContent = surplus > 0 ? `达标！超额 ${formatCompactRMB(surplus)}` : '恭喜达标！500W';
    elements.chartTargetBadge.className = 'chart-status success';
  } else {
    const gap = RETIREMENT_TARGET - finalBalance;
    elements.chartTargetBadge.textContent = `差 ${formatCompactRMB(gap)} 达标`;
    elements.chartTargetBadge.className = 'chart-status';
  }

  // 4. Update Strategy Advice Box
  updateAdviceBox(P, PMT, rPercent, years, finalBalance);

  // 5. Render or update Chart
  renderChart(labels, dataPoints, costPoints);
}

/**
 * Render Chart.js line chart or native canvas fallback
 */
function renderChart(labels, dataPoints, costPoints) {
  const canvas = document.getElementById('assetChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const targetLineData = labels.map(() => RETIREMENT_TARGET);

  // If Chart.js library is loaded
  if (typeof Chart !== 'undefined') {
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');

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
              label: '预测资产增长',
              data: dataPoints,
              borderColor: '#2563eb',
              borderWidth: 2.8,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#2563eb',
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              backgroundColor: gradient,
              tension: 0.35
            },
            {
              label: '纯本金累计',
              data: costPoints,
              borderColor: '#94a3b8',
              borderWidth: 1.8,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false,
              tension: 0
            },
            {
              label: '500W 目标基准线',
              data: targetLineData,
              borderColor: '#ea580c',
              borderWidth: 1.8,
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
              title: { display: true, text: '年数', color: '#64748b', font: { size: 11, weight: '600' } },
              grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
              ticks: { color: '#64748b', font: { size: 11 } }
            },
            y: {
              grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
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
  const height = 285;

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
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, targetY);
  ctx.lineTo(width - padding.right, targetY);
  ctx.stroke();
  ctx.restore();

  // Cost Line
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#94a3b8';
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
  grad.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
  grad.addColorStop(1, 'rgba(37, 99, 235, 0.02)');

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
  ctx.beginPath();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;
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
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();
  });
}

/**
 * Dynamic Strategic Guidance Text Generator
 */
function updateAdviceBox(P, PMT, rPercent, years, finalBalance) {
  let adviceHTML = '';

  if (rPercent >= 50) {
    adviceHTML = `
      <strong>🚨 极度高危提醒：</strong>你设定的年化收益高达 <strong>${rPercent.toFixed(1)}%</strong>。这在真实金融市场属于极高风险博弈（接近击鼓传花或加高倍杠杆）。一旦遇到周期下行，本金将面临毁灭性回撤，石锤直接摔碎！建议将年化下调至 <strong>8%~12%</strong>，增加每月定投来换取确定性。
    `;
  } else if (finalBalance >= RETIREMENT_TARGET) {
    adviceHTML = `
      <strong>🎉 极佳的理智路径！</strong>在年化 <strong>${rPercent.toFixed(1)}%</strong> 的稳健假设下，通过每月储蓄 <strong>${formatCurrency(PMT)}</strong>，第 ${years} 年期末资产预计达 <strong>${formatCompactRMB(finalBalance)}</strong>，成功跨越 500 万财富自由门槛！核心护城河是强大的现金流定投，而非押注奇迹。
    `;
  } else {
    const diff = RETIREMENT_TARGET - finalBalance;
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
 * Section 3: Leverage Interest Calculator (杠杆利息试算)
 * =========================================================
 */
let leverageState = {
  amount: 100000,
  rate: 3.5,
  months: 36,
  method: 'equal-pmt' // 'equal-pmt' | 'equal-principal' | 'interest-first'
};

function initLeverageCalculator() {
  if (!elements.levAmount) return;

  // Amount input event
  elements.levAmount.addEventListener('input', () => {
    leverageState.amount = parseFloat(elements.levAmount.value) || 0;
    // clear active pill
    document.querySelectorAll('#levAmountPills .lev-pill').forEach(p => p.classList.remove('active'));
    calculateLeverage();
  });

  // Amount quick pills
  document.querySelectorAll('#levAmountPills .lev-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#levAmountPills .lev-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      leverageState.amount = parseFloat(pill.dataset.amount);
      elements.levAmount.value = leverageState.amount;
      calculateLeverage();
    });
  });

  // Rate input event
  elements.levRate.addEventListener('input', () => {
    leverageState.rate = parseFloat(elements.levRate.value) || 0;
    document.querySelectorAll('#levRatePills .lev-pill').forEach(p => p.classList.remove('active'));
    calculateLeverage();
  });

  // Rate quick pills
  document.querySelectorAll('#levRatePills .lev-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#levRatePills .lev-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      leverageState.rate = parseFloat(pill.dataset.rate);
      elements.levRate.value = leverageState.rate;
      calculateLeverage();
    });
  });

  // Term selector buttons
  document.querySelectorAll('#levTermBtns .term-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#levTermBtns .term-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      leverageState.months = parseInt(btn.dataset.months);
      calculateLeverage();
    });
  });

  // Repayment method tabs
  document.querySelectorAll('#repayMethodTabs .method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#repayMethodTabs .method-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      leverageState.method = tab.dataset.method;
      calculateLeverage();
    });
  });

  // Toggle inline schedule table
  elements.btnToggleSchedule.addEventListener('click', () => {
    const isHidden = elements.scheduleTableWrap.style.display === 'none';
    elements.scheduleTableWrap.style.display = isHidden ? 'block' : 'none';
    elements.scheduleToggleText.textContent = isHidden ? `收起还款计划明细表 (${leverageState.months}期)` : `铺开还款计划明细表 (共 ${leverageState.months} 期)`;
    elements.scheduleArrow.textContent = isHidden ? '▴' : '▾';
  });

  // Open schedule modal
  elements.btnOpenModalSchedule.addEventListener('click', () => {
    elements.scheduleModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  // Close schedule modal
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.scheduleModal.addEventListener('click', (e) => {
    if (e.target === elements.scheduleModal) closeModal();
  });

  function closeModal() {
    elements.scheduleModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Initial calculation
  calculateLeverage();
}

/**
 * Calculate loan schedule based on method
 */
function calculateLeverage() {
  const P = Math.max(0, leverageState.amount);
  const annualRate = Math.max(0, leverageState.rate);
  const n = Math.max(1, leverageState.months);
  const method = leverageState.method;

  const monthlyRate = (annualRate / 100) / 12;

  // Header display updates
  elements.levAmountDisplay.textContent = formatCurrency(P);
  elements.levRateDisplay.textContent = `${annualRate.toFixed(2)}%`;
  const yearsDesc = (n / 12).toFixed(1).replace('.0', '');
  elements.levTermDisplay.textContent = `${n} 期 (${yearsDesc}年)`;
  elements.scheduleToggleText.textContent = elements.scheduleTableWrap.style.display === 'none' 
    ? `铺开还款计划明细表 (共 ${n} 期)` 
    : `收起还款计划明细表 (${n}期)`;

  let schedule = [];
  let totalInterest = 0;
  let totalRepayment = 0;
  let monthlyPaymentDisplay = '';
  let paymentSubDisplay = '';

  if (method === 'equal-pmt') {
    // 等额本息 (Equal Principal & Interest)
    let pmt = 0;
    if (monthlyRate === 0) {
      pmt = P / n;
    } else {
      pmt = P * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }

    let remainingPrincipal = P;
    for (let i = 1; i <= n; i++) {
      const interest = remainingPrincipal * monthlyRate;
      let principal = pmt - interest;
      if (i === n) {
        principal = remainingPrincipal; // adjust rounding on last payment
        pmt = principal + interest;
      }
      remainingPrincipal = Math.max(0, remainingPrincipal - principal);
      totalInterest += interest;

      schedule.push({
        month: i,
        payment: pmt,
        principal: principal,
        interest: interest,
        remaining: remainingPrincipal
      });
    }

    totalRepayment = P + totalInterest;
    monthlyPaymentDisplay = formatDecCurrency(pmt);
    paymentSubDisplay = `每月固定还款 · 首月利息 ${formatDecCurrency(schedule[0]?.interest || 0)}`;
    elements.levPaymentLabel.textContent = '每月月供金额 (固定)';

  } else if (method === 'equal-principal') {
    // 等额本金 (Equal Principal)
    const principalPerMonth = P / n;
    let remainingPrincipal = P;

    for (let i = 1; i <= n; i++) {
      const interest = remainingPrincipal * monthlyRate;
      const pmt = principalPerMonth + interest;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPerMonth);
      totalInterest += interest;

      schedule.push({
        month: i,
        payment: pmt,
        principal: principalPerMonth,
        interest: interest,
        remaining: remainingPrincipal
      });
    }

    totalRepayment = P + totalInterest;
    const firstPmt = schedule[0]?.payment || 0;
    const decPmt = monthlyRate > 0 ? (principalPerMonth * monthlyRate) : 0;
    monthlyPaymentDisplay = `${formatDecCurrency(firstPmt)} (首月)`;
    paymentSubDisplay = `每月本金 ${formatDecCurrency(principalPerMonth)} · 逐月递减约 ${formatDecCurrency(decPmt)}`;
    elements.levPaymentLabel.textContent = '首月月供 (逐月递减)';

  } else if (method === 'interest-first') {
    // 先息后本 (Interest First, Principal at Maturity)
    const monthlyInterest = P * monthlyRate;
    let remainingPrincipal = P;

    for (let i = 1; i <= n; i++) {
      const isLast = (i === n);
      const principal = isLast ? P : 0;
      const interest = monthlyInterest;
      const pmt = principal + interest;
      remainingPrincipal = isLast ? 0 : P;
      totalInterest += interest;

      schedule.push({
        month: i,
        payment: pmt,
        principal: principal,
        interest: interest,
        remaining: remainingPrincipal
      });
    }

    totalRepayment = P + totalInterest;
    monthlyPaymentDisplay = `${formatDecCurrency(monthlyInterest)} /月`;
    paymentSubDisplay = `第 1~${n - 1} 期仅付利息 · 末期还本金 ${formatCurrency(P)}`;
    elements.levPaymentLabel.textContent = '每月支付利息';
  }

  // Update Result KPIs
  elements.levMonthlyPayment.textContent = monthlyPaymentDisplay;
  elements.levPaymentSub.textContent = paymentSubDisplay;
  elements.levTotalInterest.textContent = formatDecCurrency(totalInterest);
  const ratio = P > 0 ? ((totalInterest / P) * 100).toFixed(2) : '0.00';
  elements.levInterestRatio.textContent = `利息占本金 ${ratio}%`;
  elements.levTotalRepayment.textContent = formatDecCurrency(totalRepayment);
  elements.levPrincipalBaseSub.textContent = `借款本金 ${formatCurrency(P)}`;

  // Update Risk Tip
  elements.levRiskTip.innerHTML = `
    ⚠️ <strong>杠杆防线：</strong>借贷资金年成本 <strong>${annualRate.toFixed(2)}%</strong>。若投资标的预期回报率无法稳定大幅超越此成本，杠杆将反向侵蚀本金；请评估每月月供现金流压力，守住安全边际。
  `;

  // Populate Schedule Table
  const rowsHTML = schedule.map(row => `
    <tr>
      <td>第 ${row.month} 期</td>
      <td><strong>${formatDecCurrency(row.payment)}</strong></td>
      <td>${formatDecCurrency(row.principal)}</td>
      <td>${formatDecCurrency(row.interest)}</td>
      <td>${formatDecCurrency(row.remaining)}</td>
    </tr>
  `).join('');

  elements.scheduleTableBody.innerHTML = rowsHTML;
  elements.modalScheduleTableBody.innerHTML = rowsHTML;

  // Modal Subtitle & Summary Banner
  const methodNames = {
    'equal-pmt': '等额本息',
    'equal-principal': '等额本金',
    'interest-first': '先息后本'
  };
  elements.modalPlanSubtitle.textContent = `本金 ${formatCurrency(P)} · 年化 ${annualRate.toFixed(2)}% · ${n}期 (${yearsDesc}年) · ${methodNames[method]}`;
  elements.modalSummaryBanner.innerHTML = `
    <div><span>总利息：</span><strong style="color: #ea580c;">${formatDecCurrency(totalInterest)}</strong></div>
    <div><span>总还款：</span><strong>${formatDecCurrency(totalRepayment)}</strong></div>
  `;
}

/**
 * =========================================================
 * Section 4: Shawshank Tunnel & 5-Step Interactive Milestones
 * =========================================================
 */
const MILESTONE_STAGES = [
  { step: 1, name: '第一关：圣经中的小石锤', targetMeters: 100, targetAmount: 1000000, desc: '启动原始本金，在墙上抠出第一个深坑。坚决拒绝高消费诱惑。' },
  { step: 2, name: '第二关：凿穿两英尺石灰石', targetMeters: 200, targetAmount: 2000000, desc: '首个两百万大关，储蓄雪球开始飞奔，被动利息已能覆盖部分开支。' },
  { step: 3, name: '第三关：地道工程过半·耐受窒息', targetMeters: 300, targetAmount: 3000000, desc: '最易放弃的倦怠期。复利超越工资结余，地道深处已能嗅到泥土潮湿香气。' },
  { step: 4, name: '第四关：500码恶臭排水管道', targetMeters: 400, targetAmount: 4000000, desc: '“爬过五百码污浊，只为洗净灵魂”。熬过这最后一里路，辞职信已备好。' },
  { step: 5, name: '最终关：太平洋的蔚蓝波涛', targetMeters: 500, targetAmount: 5000000, desc: '自由之海：在暴雨中脱下工装仰天大笑，芝华塔尼欧海滩的阳光正照耀你的余生！' }
];

function initStepMilestones() {
  // Read saved step level or default to 1 (20% progress)
  let savedLevel = parseInt(localStorage.getItem(STORAGE_KEYS.STEP_LEVEL));
  if (isNaN(savedLevel) || savedLevel === null) {
    savedLevel = 1; // Default step 1 is completed
    localStorage.setItem(STORAGE_KEYS.STEP_LEVEL, savedLevel);
  }

  updateStepMilestonesUI(savedLevel);

  // Bind click event on each stage card
  elements.stageCards.forEach(card => {
    card.addEventListener('click', () => {
      const step = parseInt(card.dataset.step);
      let currentLevel = parseInt(localStorage.getItem(STORAGE_KEYS.STEP_LEVEL));
      if (isNaN(currentLevel)) currentLevel = 1;

      // Sequential validation:
      // If step > currentLevel + 1, it's locked!
      if (step > currentLevel + 1) {
        card.classList.remove('shake');
        void card.offsetWidth; // Trigger reflow
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
        return;
      }

      // If user clicks the next active step (step == currentLevel + 1):
      if (step === currentLevel + 1) {
        setStepLevel(step);
        return;
      }

      // If user clicks the latest completed step (step == currentLevel):
      // Clicking it cancels this step!
      if (step === currentLevel) {
        setStepLevel(step - 1);
        return;
      }

      // If user clicks an earlier completed step (step < currentLevel):
      // Cancels down to before this step! (e.g. clicking step 1 when step 2 is done cancels to 0)
      if (step < currentLevel) {
        setStepLevel(step - 1);
        return;
      }
    });
  });
}

function setStepLevel(level) {
  const safeLevel = Math.max(0, Math.min(5, level));
  localStorage.setItem(STORAGE_KEYS.STEP_LEVEL, safeLevel);
  updateStepMilestonesUI(safeLevel);

  // Animate Andy runner
  const andy = document.querySelector('.andy-runner');
  if (andy) {
    andy.style.transform = 'scale(1.4) scaleX(-1)';
    setTimeout(() => {
      andy.style.transform = 'scale(1) scaleX(-1)';
    }, 400);
  }
}

function updateStepMilestonesUI(level) {
  const percent = level * 20; // 0%, 20%, 40%, 60%, 80%, 100%
  const currentMeters = level * 100; // 0m, 100m, 200m, 300m, 400m, 500m
  const remainingMeters = Math.max(0, 500 - currentMeters);
  const currentSavings = level * 1000000;

  // Update Progress visuals
  elements.tunnelPercent.textContent = `${percent.toFixed(1)}%`;
  elements.dugChannelBar.style.width = `${Math.max(percent, 4)}%`;
  elements.currentSavingsDisplay.textContent = formatCurrency(currentSavings);
  elements.currentMetersDisplay.textContent = `${currentMeters.toFixed(1)} 米`;
  elements.remainingMetersDisplay.textContent = `${remainingMeters.toFixed(1)} 米`;

  // Status text in header
  if (level === 0) {
    elements.currentMilestoneStage.textContent = '未开始越狱 (0%)';
  } else if (level === 5) {
    elements.currentMilestoneStage.textContent = '🏆 太平洋的蔚蓝波涛 · 越狱成功 (100%)';
  } else {
    elements.currentMilestoneStage.textContent = `第 ${level} 关已达成 (${percent}%)`;
  }

  // Update cards state
  elements.stageCards.forEach(card => {
    const step = parseInt(card.dataset.step);
    const checkEl = card.querySelector('.stage-check');
    const tipEl = card.querySelector('.stage-action-tip');

    if (step <= level) {
      card.className = 'stage-card passed';
      checkEl.textContent = '✓';
      if (tipEl) {
        tipEl.textContent = `已达成 · 点击撤销 (${step === 1 ? '返回 0%' : `返回 ${(step - 1) * 20}%`})`;
        tipEl.className = 'stage-action-tip';
      }
    } else if (step === level + 1) {
      card.className = 'stage-card active';
      checkEl.textContent = '⛏️';
      if (tipEl) {
        tipEl.textContent = `当前冲刺关卡 · 点击标记完成 (升至 ${step * 20}%)`;
        tipEl.className = 'stage-action-tip';
      }
    } else {
      card.className = 'stage-card locked';
      checkEl.textContent = '🔒';
      if (tipEl) {
        tipEl.textContent = `未解锁 · 需先完成第 ${step - 1} 关`;
        tipEl.className = 'stage-action-tip lock-hint';
      }
    }
  });
}

function initShawshankSystem() {
  initStepMilestones();

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

function getLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      date: '初始记录',
      text: '启动第一关本金，凿开高墙第一寸基石',
      meters: '+30.0 米'
    }
  ];
}

function renderLogs() {
  const logs = getLogs();
  if (logs.length === 0) {
    elements.logsList.innerHTML = `
      <li class="log-empty-item">暂无挖掘日志（可在上方输入金额打卡记录）</li>
    `;
    return;
  }

  elements.logsList.innerHTML = logs.map((log, index) => `
    <li class="log-item">
      <div class="log-left-col">
        <span class="log-date">${log.date}</span>
        <span class="log-text" title="${log.text}">${log.text}</span>
      </div>
      <div class="log-right-col">
        <span class="log-dist">${log.meters}</span>
        <button type="button" class="btn-del-log" data-index="${index}" title="删除该条记录">✕</button>
      </div>
    </li>
  `).join('');

  // Bind individual delete buttons
  elements.logsList.querySelectorAll('.btn-del-log').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      const currentLogs = getLogs();
      currentLogs.splice(idx, 1);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(currentLogs));
      renderLogs();
    });
  });
}

/**
 * Discipline Todo List System
 */
function initTodoList() {
  let savedTodos = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
    if (raw) savedTodos = JSON.parse(raw);
  } catch (e) {}

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
      elements.initialCapital.value = 300000;
      elements.monthlyContribution.value = 0;
      elements.cagrRate.value = 75.6;
      elements.yearsPeriod.value = 5;

      btnFantasy.classList.add('active');
      btnRealistic?.classList.remove('active');
      updateSimulation();
    });
  }

  if (btnRealistic) {
    btnRealistic.addEventListener('click', () => {
      elements.initialCapital.value = 300000;
      elements.monthlyContribution.value = 12000;
      elements.cagrRate.value = 10.0;
      elements.yearsPeriod.value = 8;

      btnRealistic.classList.add('active');
      btnFantasy?.classList.remove('active');
      updateSimulation();
    });
  }

  // Setup Clear Logs Button
  const btnClearLogs = document.getElementById('btnClearLogs');
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      if (confirm('确认清空所有挖掘日志？')) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
        renderLogs();
      }
    });
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initRealitySection();
  setupPresetButtons();
  updateSimulation();
  initLeverageCalculator();
  initShawshankSystem();
});
