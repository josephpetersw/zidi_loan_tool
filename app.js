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

// ─── Main calculate function ──────────────────────────────────────────────────
function calculate() {
  const amount       = Number(document.getElementById('amount').value       || 0);
  const days         = Number(document.getElementById('days').value         || 0);
  const down         = Number(document.getElementById('down').value)        / 100;
  const rate         = Number(document.getElementById('dailyInterest').value) / 100;

  // Check enable states
  const appFeeEnabled = document.getElementById('appFeeEnabled').checked;
  const serviceFeeEnabled = document.getElementById('serviceFeeEnabled').checked;
  const exciseEnabled = document.getElementById('exciseEnabled').checked;
  const vatEnabled = document.getElementById('vatEnabled').checked;

  // Get inputs
  const appFeeInput = document.getElementById('appFee');
  const serviceFeeInput = document.getElementById('serviceFee');
  const exciseInput = document.getElementById('excise');
  const vatInput = document.getElementById('vat');

  // Sync disabled attribute with checkboxes
  appFeeInput.disabled = !appFeeEnabled;
  serviceFeeInput.disabled = !serviceFeeEnabled;
  exciseInput.disabled = !exciseEnabled;
  vatInput.disabled = !vatEnabled;

  // Compute rates
  const appFeeRate    = appFeeEnabled ? (Number(appFeeInput.value) / 100) : 0;
  const serviceFeeRate= serviceFeeEnabled ? (Number(serviceFeeInput.value) / 100) : 0;
  const exciseRate    = exciseEnabled ? (Number(exciseInput.value) / 100) : 0;
  const vatRate       = vatEnabled ? (Number(vatInput.value) / 100) : 0;

  // Basic loan calculations
  const deposit   = amount * down;
  const financed  = amount - deposit;
  const interest  = financed * rate * days;

  // Fees & taxes
  const appFee    = financed * appFeeRate;
  const serviceFee= financed * serviceFeeRate;
  const excise    = interest * exciseRate;
  const vat       = financed * vatRate;
  const fees      = appFee + serviceFee + excise + vat;

  const repayment = financed + interest + fees;
  const daily     = days > 0 ? repayment / days : 0;

  // Update metric cards
  setMetric('deposit',   deposit);
  setMetric('financed',  financed);
  setMetric('interest',  interest);
  setMetric('fees',      fees);
  setMetric('repayment', repayment);
  setMetric('daily',     daily);

  // Build breakdown panel
  const bd = document.getElementById('breakdown');
  bd.classList.add('has-data');
  
  bd.innerHTML = `
    <div class="breakdown-title">📋 Detailed Breakdown</div>
    <div class="breakdown-row">
      <span class="br-label">App Fee ${appFeeEnabled ? `(${(appFeeRate*100).toFixed(2)}%)` : ''}</span>
      <span class="br-value">${appFeeEnabled ? fmt(appFee) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">Service Fee ${serviceFeeEnabled ? `(${(serviceFeeRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${serviceFeeEnabled ? fmt(serviceFee) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">Excise Duty ${exciseEnabled ? `(${(exciseRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${exciseEnabled ? fmt(excise) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-row">
      <span class="br-label">VAT ${vatEnabled ? `(${(vatRate*100).toFixed(0)}%)` : ''}</span>
      <span class="br-value">${vatEnabled ? fmt(vat) : '<span class="disabled-tag">Disabled</span>'}</span>
    </div>
    <div class="breakdown-total">
      <span class="br-label">Total Charges</span>
      <span class="br-value">${fmt(fees)}</span>
    </div>
  `;
}

// ─── Setup Event Listeners ───────────────────────────────────────────────────
function init() {
  const inputs = document.querySelectorAll('.card input');
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
