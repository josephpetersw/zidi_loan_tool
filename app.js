// ─── Global variables to store current calculation values for the modal ─────
let currentInterest = 0;
let currentAppFee = 0;
let currentServiceFee = 0;
let currentLicenseFee = 0;
let currentExcise = 0;
let currentVat = 0;
let currentAgentComm = 0;

// ─── Format number as KES currency ───────────────────────────────────────────
function fmt(n) {
  return 'KES ' + n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ─── Animate metric value update ─────────────────────────────────────────────
function setMetric(id, value) {
  const el = document.getElementById(id);
  const formatted = fmt(value);
  
  // Only trigger flash animation if the value actually changed
  if (el.textContent !== formatted) {
    el.textContent = formatted;
    el.classList.remove('flash');
    void el.offsetWidth; // Force reflow
    el.classList.add('flash');
  }
}

// ─── Modal Open/Close Controls ──────────────────────────────────────────────
function openModal() {
  document.getElementById('profitModal').classList.add('show');
}

function closeModal() {
  document.getElementById('profitModal').classList.remove('show');
}

function forceReset() {
  // Clear local and session storage
  localStorage.clear();
  sessionStorage.clear();
  // Force cache-busting reload by appending/replacing a timestamp query param
  window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
}

// Close modal if clicking outside the modal content box
window.addEventListener('click', (e) => {
  const modal = document.getElementById('profitModal');
  if (e.target === modal) {
    closeModal();
  }
});

// ─── Update Profit Modal Calculations Dynamically ───────────────────────────
function updateModalProfit() {
  const exciseEnabled = document.getElementById('exciseEnabled').checked;
  const vatEnabled = document.getElementById('vatEnabled').checked;
  const agentCommEnabled = document.getElementById('agentCommEnabled').checked;

  // Retrieve deduction checkbox states in the modal
  const exciseDeduct = document.getElementById('modalExciseDeduct')?.checked ?? true;
  const vatDeduct = document.getElementById('modalVatDeduct')?.checked ?? true;
  const agentCommDeduct = document.getElementById('modalAgentCommDeduct')?.checked ?? true;

  // Revenue = Interest + Application + Service + License fees
  const revenue = currentInterest + currentAppFee + currentServiceFee + currentLicenseFee;
  
  // Deductions: only apply if enabled in settings AND checked in modal
  const exciseDeduction = (exciseEnabled && exciseDeduct) ? currentExcise : 0;
  const vatDeduction = (vatEnabled && vatDeduct) ? currentVat : 0;
  const agentCommDeduction = (agentCommEnabled && agentCommDeduct) ? currentAgentComm : 0;
  
  const totalDeductions = exciseDeduction + vatDeduction + agentCommDeduction;
  const netProfit = revenue - totalDeductions;

  // Update DOM values in modal
  document.getElementById('modalTotalDeductionsVal').textContent = fmt(totalDeductions);
  document.getElementById('modalNetProfitVal').textContent = fmt(netProfit);
  document.getElementById('modalMarginVal').textContent = (revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0) + '%';

  // Visually fade out values when not deducted
  document.getElementById('modalExciseVal').style.opacity = (exciseEnabled && exciseDeduct) ? '1' : '0.4';
  document.getElementById('modalVatVal').style.opacity = (vatEnabled && vatDeduct) ? '1' : '0.4';
  document.getElementById('modalAgentCommVal').style.opacity = (agentCommEnabled && agentCommDeduct) ? '1' : '0.4';
}

// ─── Main calculate function ──────────────────────────────────────────────────
function calculate() {
  const amount       = Number(document.getElementById('amount').value       || 0);
  const days         = Number(document.getElementById('days').value         || 0);
  const down         = Number(document.getElementById('down').value)        / 100;
  const rate         = Number(document.getElementById('dailyInterest').value) / 100;

  // Check enable states
  const appFeeEnabled = document.getElementById('appFeeEnabled').checked;
  const serviceFeeEnabled = document.getElementById('serviceFeeEnabled').checked;
  const licenseFeeEnabled = document.getElementById('licenseFeeEnabled').checked;
  const exciseEnabled = document.getElementById('exciseEnabled').checked;
  const vatEnabled = document.getElementById('vatEnabled').checked;
  const agentCommEnabled = document.getElementById('agentCommEnabled').checked;

  // Get inputs
  const appFeeInput = document.getElementById('appFee');
  const serviceFeeInput = document.getElementById('serviceFee');
  const licenseFeeInput = document.getElementById('licenseFee');
  const exciseInput = document.getElementById('excise');
  const vatInput = document.getElementById('vat');
  const agentCommInput = document.getElementById('agentComm');

  // Sync disabled attribute with checkboxes
  appFeeInput.disabled = !appFeeEnabled;
  serviceFeeInput.disabled = !serviceFeeEnabled;
  licenseFeeInput.disabled = !licenseFeeEnabled;
  exciseInput.disabled = !exciseEnabled;
  vatInput.disabled = !vatEnabled;
  agentCommInput.disabled = !agentCommEnabled;

  // Compute rates
  const appFeeRate    = appFeeEnabled ? (Number(appFeeInput.value) / 100) : 0;
  const serviceFeeRate= serviceFeeEnabled ? (Number(serviceFeeInput.value) / 100) : 0;
  const licenseFeeRate= licenseFeeEnabled ? (Number(licenseFeeInput.value) / 100) : 0;
  const exciseRate    = exciseEnabled ? (Number(exciseInput.value) / 100) : 0;
  const vatRate       = vatEnabled ? (Number(vatInput.value) / 100) : 0;
  
  // Flat KES amount
  const agentComm     = agentCommEnabled ? Number(agentCommInput.value) : 0;

  // Basic loan calculations
  const deposit   = amount * down;
  const financed  = amount - deposit;
  const interest  = financed * rate * days;

  // Fees & taxes (Rates are based on Financed Principal, Excise is on Interest)
  const appFee    = financed * appFeeRate;
  const serviceFee= financed * serviceFeeRate;
  const licenseFee= financed * licenseFeeRate;
  const excise    = interest * exciseRate;
  const vat       = financed * vatRate;
  const fees      = appFee + serviceFee + licenseFee + excise + vat + agentComm;

  const repayment = financed + interest + fees;
  const daily     = days > 0 ? repayment / days : 0;

  // Store globally for modal access
  currentInterest = interest;
  currentAppFee = appFee;
  currentServiceFee = serviceFee;
  currentLicenseFee = licenseFee;
  currentExcise = excise;
  currentVat = vat;
  currentAgentComm = agentComm;

  // Update metric cards
  setMetric('deposit',   deposit);
  setMetric('financed',  financed);
  setMetric('interest',  interest);
  setMetric('fees',      fees);
  setMetric('repayment', repayment);
  setMetric('daily',     daily);

  // Show or hide profit breakdown button depending on values
  const profitBtn = document.getElementById('profitBtn');
  if (financed > 0) {
    profitBtn.style.display = 'flex';
  } else {
    profitBtn.style.display = 'none';
  }

  // Build breakdown panel
  const bd = document.getElementById('breakdown');
  bd.classList.add('has-data');
  
  bd.innerHTML = `
    <div class="breakdown-title">📋 Detailed Breakdown</div>
    <div class="breakdown-row">
      <span class="br-label">Application Fee ${appFeeEnabled ? `(${(appFeeRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${appFeeEnabled ? fmt(appFee) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">Service Fee ${serviceFeeEnabled ? `(${(serviceFeeRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${serviceFeeEnabled ? fmt(serviceFee) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">License Fee ${licenseFeeEnabled ? `(${(licenseFeeRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${licenseFeeEnabled ? fmt(licenseFee) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">Excise Duty ${exciseEnabled ? `(${(exciseRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${exciseEnabled ? fmt(excise) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">VAT ${vatEnabled ? `(${(vatRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${vatEnabled ? fmt(vat) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">Agent Commission</span>
      <span class="br-value">${agentCommEnabled ? fmt(agentComm) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-total">
      <span class="br-label">Total Charges</span>
      <span class="br-value">${fmt(fees)}</span>
    </div>
  `;

  // Build Profit Modal breakdown content
  const revenue = interest + appFee + serviceFee + licenseFee;
  const expenses = excise + vat + agentComm;
  const netProfit = revenue - expenses;
  
  const profitModalBody = document.getElementById('profitModalBody');
  profitModalBody.innerHTML = `
    <div class="modal-section-title">📈 Revenue (Inflows)</div>
    <div class="modal-row inflow">
      <span class="label">Interest Income</span>
      <span class="val">+ ${fmt(interest)}</span>
    </div>
    <div class="modal-row inflow">
      <span class="label">Application Fee</span>
      <span class="val">+ ${appFeeEnabled ? fmt(appFee) : 'KES 0.00 (Disabled)'}</span>
    </div>
    <div class="modal-row inflow">
      <span class="label">Service Fee</span>
      <span class="val">+ ${serviceFeeEnabled ? fmt(serviceFee) : 'KES 0.00 (Disabled)'}</span>
    </div>
    <div class="modal-row inflow">
      <span class="label">License Fee</span>
      <span class="val">+ ${licenseFeeEnabled ? fmt(licenseFee) : 'KES 0.00 (Disabled)'}</span>
    </div>
    <div class="modal-row" style="border-top: 1px solid var(--border-light); font-weight: 700; padding-top: 8px; margin-top: 4px;">
      <span class="label" style="color: var(--text);">Total Revenue</span>
      <span class="val" style="color: #10b981;">${fmt(revenue)}</span>
    </div>

    <div class="modal-section-title" style="margin-top: 18px;">💸 Expenses & Taxes (Outflows)</div>
    <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 8px; font-style: italic;">
      Uncheck any items that are NOT remitted to count them as profit:
    </div>
    <div class="modal-row outflow">
      <span class="label" style="display: flex; align-items: center; gap: 6px;">
        ${exciseEnabled ? `<input type="checkbox" id="modalExciseDeduct" checked onclick="updateModalProfit()">` : ''}
        Excise Duty (Tax)
      </span>
      <span class="val" id="modalExciseVal">- ${exciseEnabled ? fmt(excise) : 'KES 0.00 (Disabled)'}</span>
    </div>
    <div class="modal-row outflow">
      <span class="label" style="display: flex; align-items: center; gap: 6px;">
        ${vatEnabled ? `<input type="checkbox" id="modalVatDeduct" checked onclick="updateModalProfit()">` : ''}
        VAT (Tax)
      </span>
      <span class="val" id="modalVatVal">- ${vatEnabled ? fmt(vat) : 'KES 0.00 (Disabled)'}</span>
    </div>
    <div class="modal-row outflow">
      <span class="label" style="display: flex; align-items: center; gap: 6px;">
        ${agentCommEnabled ? `<input type="checkbox" id="modalAgentCommDeduct" checked onclick="updateModalProfit()">` : ''}
        Agent Commission
      </span>
      <span class="val" id="modalAgentCommVal">- ${agentCommEnabled ? fmt(agentComm) : 'KES 0.00 (Disabled)'}</span>
    </div>
    <div class="modal-row" style="border-top: 1px solid var(--border-light); font-weight: 700; padding-top: 8px; margin-top: 4px;">
      <span class="label" style="color: var(--text);">Total Deductions</span>
      <span class="val" id="modalTotalDeductionsVal" style="color: #ef4444;">${fmt(expenses)}</span>
    </div>

    <div class="modal-profit-summary" style="margin-top: 20px; padding-top: 15px; border-top: 1.5px solid var(--border-color);">
      <div class="profit-value-large">
        <span style="color: var(--text);">Net Profit Remaining</span>
        <span id="modalNetProfitVal" style="color: var(--primary); font-size: 1.3rem;">${fmt(netProfit)}</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; text-align: right;">
        Profit margin: <b id="modalMarginVal">${revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}%</b>
      </div>
    </div>
  `;
}

// ─── Setup Event Listeners ───────────────────────────────────────────────────
function init() {
  const inputs = document.querySelectorAll('.card input, .card select');
  inputs.forEach(input => {
    input.addEventListener('input', calculate);
    input.addEventListener('change', calculate);
  });
  
  // Initial calculate run to show defaults on load
  calculate();
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
