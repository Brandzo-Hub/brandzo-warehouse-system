/**
 * Brandzo Smart Forms Utility (SAFE & ULTIMATE VERSION)
 * Handles localStorage persistence, barcode scanning, print optimization, dynamic rows, and row deletion.
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
    setupDynamicRows();
  });

  // 2. Setup Event Listeners
  function setupEventListeners() {
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        saveDraft();
        syncToPrint(e.target);
        handleAutoCalculation(e.target);
      }
    });

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
        formData[`input_index_${index}`] = input.value;
      }
    });

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

      const tbody = table.querySelector('tbody');
      if (!tbody) return;

      const currentRowsCount = tbody.querySelectorAll('tr').length;
      const targetRowsCount = tData.rows.length;

      if (targetRowsCount > currentRowsCount) {
        const rowsToAdd = targetRowsCount - currentRowsCount;
        for (let i = 0; i < rowsToAdd; i++) {
          const added = addNewRow(table);
          if (!added) break;
        }
      }

      const trs = tbody.querySelectorAll('tr');
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

  // 6. Print Persistence & Sync
  function syncToPrint(el) {
    el.setAttribute('value', el.value);
    const parent = el.parentElement;
    if (parent && (parent.tagName === 'TD' || parent.classList.contains('print-sync'))) {
      let printSpan = parent.querySelector('.print-only-text');
      if (!printSpan) {
        printSpan = document.createElement('span');
        printSpan.className = 'print-only-text hidden print:block';
        parent.appendChild(printSpan);
      }
      printSpan.innerText = el.value;
    }
  }

  // 7. Auto-calculation
  function handleAutoCalculation(target) {
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

  // 8. Dynamic Rows Feature (Add & Delete)
  function setupDynamicRows() {
    document.querySelectorAll('table').forEach(function (table) {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;

      // إنشاء حاوية للأزرار لترتيبها بجانب بعضها
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'no-print table-actions-container';
      actionsContainer.style.cssText = 'display: flex; gap: 10px; margin: 6px 0;';

      // زر إضافة صف
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = '+ إضافة صف';
      addBtn.style.cssText = 'padding:5px 14px; background:#e65c00; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-family:inherit;';

      addBtn.addEventListener('click', function () {
        addNewRow(table);
        saveDraft(); // حفظ المسودة فوراً
      });

      // زر حذف صف
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = '- حذف صف';
      deleteBtn.style.cssText = 'padding:5px 14px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-family:inherit;';

      deleteBtn.addEventListener('click', function () {
        deleteLastRow(table);
        saveDraft(); // حفظ المسودة فوراً بعد الحذف
      });

      // إضافة الأزرار للحاوية ثم تحت الجدول
      actionsContainer.appendChild(addBtn);
      actionsContainer.appendChild(deleteBtn);
      table.parentNode.insertBefore(actionsContainer, table.nextSibling);
    });
  }

  function addNewRow(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return false;
    
    const lastRow = tbody.querySelector('tr:last-child');
    if (!lastRow) return false;

    // استنساخ الصف بالكامل
    const newRow = lastRow.cloneNode(true);
    const rowIndex = tbody.querySelectorAll('tr').length + 1;

    // تصفير الحقول وإصلاح تعارض القواعد (IDs)
    newRow.querySelectorAll('input, textarea, select').forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
      el.removeAttribute('value');
      
      // إزالة المعرف ID لتجنب تداخل قواعد النموذج الجديد مع القديم
      if (el.hasAttribute('id')) {
        el.removeAttribute('id');
      }

      // مسح عناصر الطباعة المنسوخة
      const parent = el.parentElement;
      if (parent) {
         const oldSpan = parent.querySelector('.print-only-text');
         if (oldSpan) oldSpan.remove();
      }
    });

    // تصفير النصوص الثابتة (مثل 0.00) بذكاء
    newRow.querySelectorAll('*').forEach(function (el) {
      const text = el.textContent.trim();
      if (el.children.length === 0 && (text === '0.00' || text === '0' || text === '0.0')) {
        el.textContent = ''; 
      }
    });

    // تحديث الترقيم في العمود الأول
    const firstTd = newRow.querySelector('td:first-child');
    if (firstTd && !firstTd.querySelector('input') && /^\d+$/.test(firstTd.textContent.trim())) {
      firstTd.textContent = rowIndex;
    }

    tbody.appendChild(newRow);

    // إطلاق حدث برمجي لتنبيه النظام بتفعيل القواعد
    const firstInput = newRow.querySelector('input');
    if (firstInput) {
      firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return true;
  }

  function deleteLastRow(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return false;
    
    const rows = tbody.querySelectorAll('tr');
    
    // شرط أمان لمنع حذف الصف الأخير تماماً (يجب بقاء صف واحد للاستنساخ)
    if (rows.length <= 1) {
      alert('عذراً، لا يمكن حذف الصف الأخير.');
      return false;
    }
    
    // حذف آخر صف في الجدول
    const lastRow = rows[rows.length - 1];
    lastRow.remove();
    return true;
  }

  // 9. Extra Utils
  function setupPrintValidation() { /* إلغاء القيود */ }

  function setupAutoFill() {
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
      syncToPrint(dateInput);
    }
  }

  function injectLandscapePrint() {
    if (document.getElementById('brandzo-landscape-print')) return;
    const style = document.createElement('style');
    style.id = 'brandzo-landscape-print';
    style.textContent = '@page { size: A4 landscape; margin: 10mm; } @media print { .no-print { display: none !important; } }';
    document.head.appendChild(style);
  }

})();
