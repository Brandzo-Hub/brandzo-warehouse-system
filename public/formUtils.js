/**
 * Brandzo Smart Forms Utility (SAFE & ULTIMATE VERSION)
 * Handles localStorage persistence, barcode scanning, print optimization, dynamic rows, row deletion, and Form Reset.
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
    setupClearFormFeature(); // تفعيل ميزة إفراغ النموذج
    setupExcelExport();      // تفعيل ميزة تصدير Excel
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

      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'no-print table-actions-container';
      actionsContainer.style.cssText = 'display: flex; gap: 10px; margin: 6px 0;';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = '+ إضافة صف';
      addBtn.style.cssText = 'padding:5px 14px; background:#e65c00; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-family:inherit;';

      addBtn.addEventListener('click', function () {
        addNewRow(table);
        saveDraft();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = '- حذف صف';
      deleteBtn.style.cssText = 'padding:5px 14px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px; font-family:inherit;';

      deleteBtn.addEventListener('click', function () {
        deleteLastRow(table);
        saveDraft();
      });

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

    const newRow = lastRow.cloneNode(true);
    const rowIndex = tbody.querySelectorAll('tr').length + 1;

    newRow.querySelectorAll('input, textarea, select').forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
      el.removeAttribute('value');
      
      if (el.hasAttribute('id')) {
        el.removeAttribute('id');
      }

      const parent = el.parentElement;
      if (parent) {
         const oldSpan = parent.querySelector('.print-only-text');
         if (oldSpan) oldSpan.remove();
      }
    });

    newRow.querySelectorAll('*').forEach(function (el) {
      const text = el.textContent.trim();
      if (el.children.length === 0 && (text === '0.00' || text === '0' || text === '0.0')) {
        el.textContent = ''; 
      }
    });

    const firstTd = newRow.querySelector('td:first-child');
    if (firstTd && !firstTd.querySelector('input') && /^\d+$/.test(firstTd.textContent.trim())) {
      firstTd.textContent = rowIndex;
    }

    tbody.appendChild(newRow);

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
    
    if (rows.length <= 1) {
      alert('عذراً، لا يمكن حذف الصف الأخير.');
      return false;
    }
    
    const lastRow = rows[rows.length - 1];
    lastRow.remove();
    return true;
  }

  // 9. Form Reset Feature
  function setupClearFormFeature() {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = '🗑️ إفراغ النموذج';
    clearBtn.className = 'no-print';
    clearBtn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 50px; cursor: pointer; font-size: 14px; font-family: inherit; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: background 0.3s;';
    
    clearBtn.onmouseover = () => clearBtn.style.background = '#dc3545';
    clearBtn.onmouseout = () => clearBtn.style.background = '#333';

    clearBtn.addEventListener('click', function () {
      if (confirm('هل أنت متأكد أنك تريد مسح جميع البيانات والبدء بنموذج جديد؟')) {
        localStorage.removeItem(`brandzo_draft_${FORM_ID}`);
        window.location.reload();
      }
    });

    document.body.appendChild(clearBtn);
  }

  // 10. Extra Utils
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

  // 11. Excel Export Feature
  function setupExcelExport() {
    // Inject SheetJS (xlsx) library dynamically
    if (!window.__sheetjsLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => { window.__sheetjsLoaded = true; };
      document.head.appendChild(script);
    }

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = '📊 تصدير Excel';
    exportBtn.className = 'no-print';
    exportBtn.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'left: 130px',
      'padding: 10px 20px',
      'background: #1d6f42',
      'color: #fff',
      'border: none',
      'border-radius: 50px',
      'cursor: pointer',
      'font-size: 14px',
      'font-family: inherit',
      'z-index: 9999',
      'box-shadow: 0 4px 6px rgba(0,0,0,0.3)',
      'transition: background 0.3s'
    ].join(';');

    exportBtn.onmouseover = () => exportBtn.style.background = '#145232';
    exportBtn.onmouseout  = () => exportBtn.style.background = '#1d6f42';

    exportBtn.addEventListener('click', function () {
      if (typeof XLSX === 'undefined') {
        alert('جارٍ تحميل مكتبة التصدير، يرجى الانتظار لحظة ثم المحاولة مجدداً.');
        return;
      }

      // Ask user for a file name
      const userFileName = prompt('أدخل اسم الملف للتصدير:', getDefaultFileName());
      if (userFileName === null) return; // cancelled
      const fileName = (userFileName.trim() || getDefaultFileName()).replace(/\.xlsx$/i, '') + '.xlsx';

      exportToExcel(fileName);
    });

    document.body.appendChild(exportBtn);
  }

  function getDefaultFileName() {
    const title = document.querySelector('h1, h2, title');
    const base = title ? title.textContent.trim().replace(/\s+/g, '_') : 'نموذج';
    const date = new Date().toISOString().split('T')[0];
    return `${base}_${date}`;
  }

  function exportToExcel(fileName) {
    const wb = XLSX.utils.book_new();
    let sheetIndex = 0;

    // ── 1. Export every <table> as its own sheet ──────────────────────────
    document.querySelectorAll('table').forEach(function (table, tIdx) {
      const aoa = []; // array of arrays

      // Header rows
      table.querySelectorAll('thead tr').forEach(function (tr) {
        aoa.push(rowToArray(tr));
      });

      // Body rows
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        aoa.push(rowToArray(tr));
      });

      // Footer rows
      table.querySelectorAll('tfoot tr').forEach(function (tr) {
        aoa.push(rowToArray(tr));
      });

      if (aoa.length === 0) return;

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      styleWorksheet(ws, aoa);

      const sheetName = ('جدول ' + (tIdx + 1)).substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      sheetIndex++;
    });

    // ── 2. Collect standalone inputs (outside tables) into a summary sheet ─
    const summaryRows = [];
    document.querySelectorAll('input, textarea').forEach(function (el) {
      if (el.closest('table')) return;           // already exported
      if (el.closest('.no-print')) return;       // skip toolbar inputs
      const label = resolveLabel(el);
      const value = el.value.trim();
      if (label || value) {
        summaryRows.push([label, value]);
      }
    });

    if (summaryRows.length > 0) {
      summaryRows.unshift(['الحقل', 'القيمة']); // header
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'البيانات العامة');
    }

    // ── 3. Fallback: if nothing was exported yet, create a blank sheet ────
    if (wb.SheetNames.length === 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['لا توجد بيانات']]), 'ورقة1');
    }

    XLSX.writeFile(wb, fileName);
  }

  /** Convert a <tr> element to an array of cell values */
  function rowToArray(tr) {
    return Array.from(tr.querySelectorAll('th, td')).map(function (cell) {
      const input = cell.querySelector('input, textarea');
      if (input) return input.value.trim();
      // Skip print-only spans to avoid duplication
      const clone = cell.cloneNode(true);
      clone.querySelectorAll('.print-only-text, .no-print').forEach(function (el) { el.remove(); });
      return clone.textContent.trim();
    });
  }

  /** Apply basic column-width and bold-header styling to a worksheet */
  function styleWorksheet(ws, aoa) {
    if (!aoa.length) return;
    const colCount = Math.max(...aoa.map(function (r) { return r.length; }));
    ws['!cols'] = Array.from({ length: colCount }, function () { return { wch: 20 }; });
  }

  /** Try to find a human-readable label for an input element */
  function resolveLabel(el) {
    // 1. <label for="id">
    if (el.id) {
      const lbl = document.querySelector('label[for="' + el.id + '"]');
      if (lbl) return lbl.textContent.trim();
    }
    // 2. Wrapping <label>
    const parent = el.closest('label');
    if (parent) return parent.textContent.replace(el.value, '').trim();
    // 3. Preceding sibling text / label
    let prev = el.previousElementSibling;
    if (prev) return prev.textContent.trim();
    // 4. Placeholder as fallback
    return el.placeholder || el.name || el.id || '';
  }

})();
