/**
 * Brandzo Smart Forms Utility
 * Handles localStorage persistence, barcode scanning, and print optimization.
 */

(function () {
  const FORM_ID = window.location.pathname;

  // 1. Initialize logic when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
    setupEventListeners();
    setupAutoFill();
    injectLandscapePrint();
    setupPrintValidation();
  });

  // 2. Setup Event Listeners
  function setupEventListeners() {
    // Listen for all input events (captures barcode scanners)
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        saveDraft();
        syncToPrint(e.target);
        handleAutoCalculation(e.target);
      }
    });

    // Special handling for barcode scanning in tables
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.closest('table')) {
        saveDraft();
      }
    });
  }

  // 3. Save to localStorage
  function saveDraft() {
    const formData = {};
    const inputs = document.querySelectorAll('input, textarea');

    inputs.forEach((input, index) => {
      if (input.id || input.name) {
        formData[input.id || input.name] = input.value;
      } else {
        // Fallback for inputs without ID/name
        formData[`input_index_${index}`] = input.value;
      }
    });

    // Save table data with table identity
    formData.tables = getTableData();

    localStorage.setItem(`brandzo_draft_${FORM_ID}`, JSON.stringify(formData));
  }

  // 4. Load from localStorage
  function loadDraft() {
    const saved = localStorage.getItem(`brandzo_draft_${FORM_ID}`);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      const inputs = document.querySelectorAll('input, textarea');

      Object.keys(data).forEach(key => {
        if (key === 'tables') {
          restoreTableData(data.tables);
        } else if (key.startsWith('input_index_')) {
          const index = parseInt(key.replace('input_index_', ''));
          const el = inputs[index];
          if (el) {
            el.value = data[key];
            syncToPrint(el);
          }
        } else {
          const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
          if (el) {
            el.value = data[key];
            syncToPrint(el);
          }
        }
      });
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }

  // 5. Table Data Mapping
  function getTableData() {
    const tableData = [];
    const tables = document.querySelectorAll('table');

    tables.forEach((table, tIndex) => {
      const rows = [];
      const trs = table.querySelectorAll('tbody tr');
      trs.forEach((tr, rIndex) => {
        const rowData = {};
        const inputs = tr.querySelectorAll('input');
        inputs.forEach((input, i) => {
          rowData[`col_${i}`] = input.value;
        });
        if (Object.keys(rowData).length > 0) {
          rows.push({ rowIndex: rIndex, data: rowData });
        }
      });
      if (rows.length > 0) {
        tableData.push({ tableIndex: tIndex, rows: rows });
      }
    });
    return tableData;
  }

  function restoreTableData(tableData) {
    const tables = document.querySelectorAll('table');

    tableData.forEach(tData => {
      const table = tables[tData.tableIndex];
      if (!table) return;

      const trs = table.querySelectorAll('tbody tr');
      tData.rows.forEach(rData => {
        const tr = trs[rData.rowIndex];
        if (tr) {
          const inputs = tr.querySelectorAll('input');
          Object.keys(rData.data).forEach(key => {
            const colIndex = parseInt(key.replace('col_', ''));
            if (inputs[colIndex]) {
              inputs[colIndex].value = rData.data[key];
              syncToPrint(inputs[colIndex]);
            }
          });
        }
      });
    });
  }

  // 6. Print Persistence (Force value into attribute/text)
  function syncToPrint(el) {
    el.setAttribute('value', el.value);

    const parent = el.parentElement;
    if (parent && (parent.tagName === 'TD' || parent.classList.contains('print-sync'))) {
      let printSpan = parent.querySelector('.print-only-text');
      if (!printSpan) {
        printSpan = document.createElement('span');
        printSpan.className = 'print-only-text hidden print:block';
        parent.appendChild(printSpan);
        parent.classList.add('has-print-text');
      }
      printSpan.innerText = el.value;
    }
  }

  // 7. Auto-calculation for Qty × Price = Total
  function handleAutoCalculation(target) {
    // Check if target is qty or price input in a table row
    if (target.classList.contains('item-qty') || target.classList.contains('item-price')) {
      const row = target.closest('tr');
      if (!row) return;

      const qtyInput = row.querySelector('.item-qty');
      const priceInput = row.querySelector('.item-price');
      const totalInput = row.querySelector('.item-total');

      if (qtyInput && priceInput && totalInput) {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;

        totalInput.value = total.toFixed(2);
        syncToPrint(totalInput);
      }
    }
  }

  // 8. Validation for mandatory fields before print/save
  function validateForm() {
    // إلغاء التحقق الإلزامي — الطباعة مفتوحة دائماً
    return true;
  }

  // 9. Setup print validation
  function setupPrintValidation() {
    // تم إلغاء الشرط الإلزامي — لا يتم منع الطباعة على أي أزرار
  }

  // 7. Auto-fill logic
  function setupAutoFill() {
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
      syncToPrint(dateInput);
    }
  }

  function injectLandscapePrint() {
    var existingStyle = document.getElementById('brandzo-landscape-print');
    if (existingStyle) return;

    var style = document.createElement('style');
    style.id = 'brandzo-landscape-print';
    style.textContent = '@page { size: A4 landscape; margin: 10mm; }';
    document.head.appendChild(style);
  }

})();
