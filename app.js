/**
 * Integrated Search System: Batches & Attendance + Housing Lottery Results
 * Fast search by Order Number or Client Name
 */

// Application State
let batchAppData = {
  clients: [],
  orderMap: new Map(),
  nameList: [],
  batchMap: new Map(),
  totalBatches: 0
};

let lotteryAppData = {
  participants: [],
  orderMap: new Map(),
  nameList: []
};

// Admin Authentication State
const DEFAULT_ADMIN_PASS = 'admin123';
let isAdminLoggedIn = sessionStorage.getItem('batch_admin_logged_in') === 'true';
let pendingAdminAction = null;

// Storage Keys
const STORAGE_KEY_BATCH = 'batch_system_clients_data_v1';
const STORAGE_KEY_LOTTERY = 'lottery_system_data_v1';

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupTabs();
  bindEvents();
  setupAdminAuth();
  loadData();
}

/* ==========================================================================
   Tab Switcher Navigation Logic
   ========================================================================== */
function setupTabs() {
  const tabBatchesBtn = document.getElementById('tabBatchesBtn');
  const tabLotteryBtn = document.getElementById('tabLotteryBtn');
  const sectionBatches = document.getElementById('sectionBatches');
  const sectionLottery = document.getElementById('sectionLottery');

  if (tabBatchesBtn && tabLotteryBtn) {
    tabBatchesBtn.addEventListener('click', () => {
      tabBatchesBtn.classList.add('active');
      tabLotteryBtn.classList.remove('active');

      if (sectionBatches) {
        sectionBatches.classList.remove('hidden-tab');
        sectionBatches.classList.add('active-tab');
      }
      if (sectionLottery) {
        sectionLottery.classList.add('hidden-tab');
        sectionLottery.classList.remove('active-tab');
      }

      const input = document.getElementById('searchBatchInput');
      if (input) input.focus();
    });

    tabLotteryBtn.addEventListener('click', () => {
      tabLotteryBtn.classList.add('active');
      tabBatchesBtn.classList.remove('active');

      if (sectionLottery) {
        sectionLottery.classList.remove('hidden-tab');
        sectionLottery.classList.add('active-tab');
      }
      if (sectionBatches) {
        sectionBatches.classList.add('hidden-tab');
        sectionBatches.classList.remove('active-tab');
      }

      const input = document.getElementById('searchLotteryInput');
      if (input) input.focus();
    });
  }
}

/* ==========================================================================
   Admin Authorization & Lock Logic
   ========================================================================== */
function setupAdminAuth() {
  updateAdminUI();

  const adminToggleBtn = document.getElementById('adminToggleBtn');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const adminAuthForm = document.getElementById('adminAuthForm');
  const adminAuthModal = document.getElementById('adminAuthModal');

  if (adminToggleBtn) {
    adminToggleBtn.addEventListener('click', () => {
      if (isAdminLoggedIn) {
        if (confirm('هل ترغب في الخروج من وضع المسؤول وإغلاق صلاحية الرفع؟')) {
          logoutAdmin();
        }
      } else {
        openAdminModal();
      }
    });
  }

  if (closeAdminModalBtn) {
    closeAdminModalBtn.addEventListener('click', () => {
      hideAdminModal();
    });
  }

  if (adminAuthModal) {
    adminAuthModal.addEventListener('click', (e) => {
      if (e.target === adminAuthModal) {
        hideAdminModal();
      }
    });
  }

  if (adminAuthForm) {
    adminAuthForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const passInput = document.getElementById('adminPasswordInput');
      const enteredPass = passInput ? passInput.value : '';
      loginAdmin(enteredPass);
    });
  }
}

function updateAdminUI() {
  const adminToggleBtn = document.getElementById('adminToggleBtn');
  const adminLockIcon = document.getElementById('adminLockIcon');
  const adminStatusText = document.getElementById('adminStatusText');
  const dropzoneText = document.getElementById('dropzoneText');
  const dropzone = document.getElementById('dropzone');

  if (isAdminLoggedIn) {
    if (adminToggleBtn) {
      adminToggleBtn.classList.remove('locked');
      adminToggleBtn.classList.add('unlocked');
      adminToggleBtn.title = 'وضع المسؤول مفعل (انقر للقفل)';
    }
    if (adminLockIcon) {
      adminLockIcon.className = 'fa-solid fa-unlock';
    }
    if (adminStatusText) {
      adminStatusText.textContent = 'مسؤول مفعل';
    }
    if (dropzoneText) {
      dropzoneText.textContent = 'اسحب ملف Excel أو انقر لاختياره (دفعات أو قرعة)';
    }
    if (dropzone) {
      dropzone.classList.remove('locked-dropzone');
    }
  } else {
    if (adminToggleBtn) {
      adminToggleBtn.classList.remove('unlocked');
      adminToggleBtn.classList.add('locked');
      adminToggleBtn.title = 'انقر لتسجيل الدخول كمسؤول';
    }
    if (adminLockIcon) {
      adminLockIcon.className = 'fa-solid fa-lock';
    }
    if (adminStatusText) {
      adminStatusText.textContent = 'مغلق للمسؤول';
    }
    if (dropzoneText) {
      dropzoneText.textContent = 'مغلق (انقر لإدخال كلمة سر المسؤول لرفع البيانات)';
    }
    if (dropzone) {
      dropzone.classList.add('locked-dropzone');
    }
  }
}

function requireAdminAuth(actionCallback) {
  if (isAdminLoggedIn) {
    actionCallback();
  } else {
    pendingAdminAction = actionCallback;
    openAdminModal();
  }
}

function openAdminModal() {
  const modal = document.getElementById('adminAuthModal');
  const errorEl = document.getElementById('adminAuthError');
  const passInput = document.getElementById('adminPasswordInput');

  if (errorEl) errorEl.classList.add('hidden');
  if (passInput) passInput.value = '';

  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      if (passInput) passInput.focus();
    }, 100);
  }
}

function hideAdminModal() {
  const modal = document.getElementById('adminAuthModal');
  if (modal) modal.classList.add('hidden');
}

function loginAdmin(enteredPass) {
  const errorEl = document.getElementById('adminAuthError');
  if (enteredPass === DEFAULT_ADMIN_PASS) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('batch_admin_logged_in', 'true');
    updateAdminUI();
    hideAdminModal();
    showToast('تم تسجيل الدخول كمسؤول بنجاح');

    if (pendingAdminAction) {
      const action = pendingAdminAction;
      pendingAdminAction = null;
      action();
    }
  } else {
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('batch_admin_logged_in');
  updateAdminUI();
  showToast('تم الخروج من وضع المسؤول وإغلاق الرفع');
}

/* ==========================================================================
   Data Loading & Default Mock Data Logic
   ========================================================================== */
async function loadData() {
  showLoadingIndicator(true);

  // Step 1: Load instantly from localStorage cache for immediate UI
  let hasCachedBatch = false;
  let hasCachedLottery = false;
  const savedBatch = localStorage.getItem(STORAGE_KEY_BATCH);
  const savedLottery = localStorage.getItem(STORAGE_KEY_LOTTERY);
  if (savedBatch) {
    try {
      const parsed = JSON.parse(savedBatch);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processBatchData(parsed, 'بيانات الدفعات (كاش)');
        hasCachedBatch = true;
      }
    } catch (e) {}
  }
  if (savedLottery) {
    try {
      const parsed = JSON.parse(savedLottery);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processLotteryData(parsed, 'بيانات القرعة (كاش)');
        hasCachedLottery = true;
      }
    } catch (e) {}
  }

  // Step 2: Fetch all Excel files in PARALLEL (not sequential)
  const targetFiles = [
    './data/القرعه.xlsx',
    './data/القرعة.xlsx',
    './data/قرعه.xlsx',
    './data/قرعة.xlsx',
    './data/data.xlsx',
    './data/batches.xlsx',
    './data/lottery.xlsx',
    './data/New Microsoft Excel Worksheet.xlsx',
    './data/الدفعات.xlsx',
    './data/دفعات.xlsx',
    './data/الدفعه.xlsx',
    './data/دفعه.xlsx',
    './data/القرعه.csv',
    './data/القرعة.csv',
    './data/قرعه.csv',
    './data/قرعة.csv',
    './data/data.csv',
    './data/batches.csv',
    './data/lottery.csv'
  ];

  // Fetch all files simultaneously, ignore failed ones
  const results = await Promise.allSettled(targetFiles.map(fp => tryFetchAndParseExcel(fp)));

  let accumulatedBatches = [];
  let accumulatedLottery = [];
  let loadedFromDataFolder = false;

  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const workbook = result.value;
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) continue;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', dense: false });
      if (!jsonData || jsonData.length < 2) continue;

      const headers = jsonData[0].map(h => String(h || '').trim().toLowerCase());
      const isLottery = headers.some(h =>
        h.includes('قطاع') || h.includes('مجاوره') || h.includes('مجاورة') ||
        h.includes('بلوك') || h.includes('قطعه') || h.includes('قطعة') ||
        h.includes('مساحه') || h.includes('مساحة') ||
        h.includes('قرعه') || h.includes('قرعة')
      );
      if (isLottery) {
        const items = extractLotteryItemsFromRows(jsonData);
        addUniqueLotteryItems(accumulatedLottery, items);
      } else {
        const items = extractBatchItemsFromRows(jsonData);
        addUniqueBatchItems(accumulatedBatches, items);
      }
      loadedFromDataFolder = true;
    }
  }

  showLoadingIndicator(false);

  if (loadedFromDataFolder) {
    if (accumulatedBatches.length > 0) {
      processBatchData(accumulatedBatches, 'بيانات المجلد data/');
      try { localStorage.setItem(STORAGE_KEY_BATCH, JSON.stringify(accumulatedBatches)); } catch (e) {}
    } else if (!hasCachedBatch) {
      loadDefaultBatchData();
    }

    if (accumulatedLottery.length > 0) {
      processLotteryData(accumulatedLottery, 'بيانات المجلد data/');
      try { localStorage.setItem(STORAGE_KEY_LOTTERY, JSON.stringify(accumulatedLottery)); } catch (e) {}
    } else if (!hasCachedLottery) {
      loadDefaultLotteryData();
    }
    return;
  }

  // No files found – use cache or fallback mock data
  if (!hasCachedBatch) loadDefaultBatchData();
  if (!hasCachedLottery) loadDefaultLotteryData();
}

function showLoadingIndicator(show) {
  const el = document.getElementById('globalLoadingBar');
  if (!el) return;
  if (show) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function addUniqueLotteryItems(accumulated, newItems) {
  const seenKeys = new Set(accumulated.map(item => `${normalizeString(item.name)}|${normalizeString(item.orderNum)}|${normalizeString(item.plotNum)}`));
  for (const item of newItems) {
    const key = `${normalizeString(item.name)}|${normalizeString(item.orderNum)}|${normalizeString(item.plotNum)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      accumulated.push(item);
    }
  }
}

function addUniqueBatchItems(accumulated, newItems) {
  const seenKeys = new Set(accumulated.map(item => `${normalizeString(item.name)}|${normalizeString(item.orderNum)}`));
  for (const item of newItems) {
    const key = `${normalizeString(item.name)}|${normalizeString(item.orderNum)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      accumulated.push(item);
    }
  }
}

async function tryFetchAndParseExcel(filePath) {
  try {
    const res = await fetch(filePath);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return null;
    if (typeof XLSX === 'undefined') return null;
    return XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: false, sheetStubs: false });
  } catch (err) {
    return null;
  }
}

function loadFallbackBatchData() {
  const savedBatchData = localStorage.getItem(STORAGE_KEY_BATCH);
  if (savedBatchData) {
    try {
      const parsed = JSON.parse(savedBatchData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processBatchData(parsed, 'بيانات الدفعات المحملة سابقاً');
        return;
      }
    } catch (e) {
      console.error('Error parsing stored batch data:', e);
    }
  }
  loadDefaultBatchData();
}

function loadFallbackLotteryData() {
  const savedLotteryData = localStorage.getItem(STORAGE_KEY_LOTTERY);
  if (savedLotteryData) {
    try {
      const parsed = JSON.parse(savedLotteryData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processLotteryData(parsed, 'بيانات القرعة المحملة سابقاً');
        return;
      }
    } catch (e) {
      console.error('Error parsing stored lottery data:', e);
    }
  }
  loadDefaultLotteryData();
}

function loadDefaultBatchData() {
  const sampleBatches = [
    { name: 'أحمد محمد إبراهيم', orderNum: 'ORD-10025', orderDate: '10 يناير 2026', batchNum: 1, attendanceDate: 'السبت 15 أغسطس 2026' },
    { name: 'أحمد محمد إبراهيم', orderNum: 'ORD-10040', orderDate: '25 يناير 2026', batchNum: 3, attendanceDate: 'الاثنين 17 أغسطس 2026' },
    { name: 'محمود حسن السيد', orderNum: 'ORD-10026', orderDate: '12 يناير 2026', batchNum: 1, attendanceDate: 'السبت 15 أغسطس 2026' },
    { name: 'مصطفى علي عبد الله', orderNum: 'ORD-10027', orderDate: '14 يناير 2026', batchNum: 2, attendanceDate: 'الأحد 16 أغسطس 2026' },
    { name: 'أحمد محمود حسن', orderNum: 'ORD-10028', orderDate: '15 يناير 2026', batchNum: 2, attendanceDate: 'الأحد 16 أغسطس 2026' },
    { name: 'سارة خالد محمود', orderNum: 'ORD-10029', orderDate: '16 يناير 2026', batchNum: 2, attendanceDate: 'الأحد 16 أغسطس 2026' },
    { name: 'عبد الرحمن الشريف', orderNum: 'ORD-10030', orderDate: '18 يناير 2026', batchNum: 3, attendanceDate: 'الاثنين 17 أغسطس 2026' }
  ];
  processBatchData(sampleBatches, 'بيانات دفعات تجريبية افتراضية');
}

function loadDefaultLotteryData() {
  const sampleLottery = [
    {
      name: 'محمود علي سليمان',
      orderNum: 'LOT-5501',
      sector: 'القطاع الأول (أ)',
      neighborhood: 'المجاورة الثالثة',
      blockNum: 'B-12',
      plotNum: '458',
      area: '209 م²'
    },
    {
      name: 'محمود علي سليمان',
      orderNum: 'LOT-5599',
      sector: 'القطاع الثاني (ب)',
      neighborhood: 'المجاورة الأولى',
      blockNum: 'A-05',
      plotNum: '112',
      area: '276 م²'
    },
    {
      name: 'عمر طارق زكي',
      orderNum: 'LOT-5502',
      sector: 'القطاع الثاني (ب)',
      neighborhood: 'المجاورة الأولى',
      blockNum: 'A-05',
      plotNum: '112',
      area: '276 م²'
    },
    {
      name: 'إبراهيم يوسف نصر',
      orderNum: 'LOT-5503',
      sector: 'القطاع الثالث (ج)',
      neighborhood: 'المجاورة الرابعة',
      blockNum: 'C-09',
      plotNum: '304',
      area: '209 م²'
    },
    {
      name: 'فاطمة الزهراء أحمد',
      orderNum: 'LOT-5504',
      sector: 'القطاع الأول (أ)',
      neighborhood: 'المجاورة الثانية',
      blockNum: 'B-04',
      plotNum: '89',
      area: '350 م²'
    },
    {
      name: 'خالد مصطفى العوضي',
      orderNum: 'LOT-5505',
      sector: 'القطاع الرابع (د)',
      neighborhood: 'المجاورة الخامسة',
      blockNum: 'D-15',
      plotNum: '621',
      area: '209 م²'
    }
  ];
  processLotteryData(sampleLottery, 'بيانات قرعة تجريبية افتراضية');
}

function processBatchData(clientsArray, sourceLabel = 'بيانات محملة') {
  batchAppData.clients = clientsArray;
  batchAppData.orderMap.clear();
  batchAppData.nameList = [];
  batchAppData.batchMap.clear();

  clientsArray.forEach(client => {
    const normOrder = normalizeString(client.orderNum);
    if (normOrder) {
      batchAppData.orderMap.set(normOrder, client);
    }

    const normName = normalizeString(client.name);
    batchAppData.nameList.push({
      normName: normName,
      client: client
    });

    const batchKey = parseInt(client.batchNum) || 1;
    if (!batchAppData.batchMap.has(batchKey)) {
      batchAppData.batchMap.set(batchKey, []);
    }
    batchAppData.batchMap.get(batchKey).push(client);
  });

  batchAppData.totalBatches = batchAppData.batchMap.size;

  updateHeaderStats();
  populateBatchSelect();
}

function processLotteryData(lotteryArray, sourceLabel = 'بيانات محملة') {
  lotteryAppData.participants = lotteryArray;
  lotteryAppData.orderMap.clear();
  lotteryAppData.nameList = [];

  lotteryArray.forEach(item => {
    const normOrder = normalizeString(item.orderNum);
    if (normOrder) {
      lotteryAppData.orderMap.set(normOrder, item);
    }

    const normName = normalizeString(item.name);
    lotteryAppData.nameList.push({
      normName: normName,
      item: item
    });
  });

  updateHeaderStats();
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   Search Engine 1: Batches & Attendance (Multi-Result Support)
   ========================================================================== */
function executeBatchSearch(query) {
  const trimmed = query.trim();
  const clearBtn = document.getElementById('clearBatchSearchBtn');
  const inputWrapper = document.querySelector('#sectionBatches .search-input-wrapper');

  if (clearBtn) {
    clearBtn.style.display = trimmed ? 'block' : 'none';
  }

  if (!trimmed) {
    if (inputWrapper) {
      inputWrapper.classList.add('shake');
      setTimeout(() => inputWrapper.classList.remove('shake'), 500);
    }
    showBatchState('emptyBatchState');
    return;
  }

  const normalized = normalizeString(trimmed);

  // 1. Check for EXACT order number match only (no loose digit stripping or letter mixing)
  const exactOrderMatches = batchAppData.clients.filter(client => {
    const normOrder = normalizeString(client.orderNum || '');
    return normOrder === normalized;
  });

  let matches = [];

  if (exactOrderMatches.length > 0) {
    // Return only the exact matched order number
    matches = exactOrderMatches;
  } else {
    // If no exact order match, perform search by client name only
    matches = batchAppData.clients.filter(client => {
      const normName = normalizeString(client.name || '');
      return normName.includes(normalized);
    });
  }

  if (matches.length === 0) {
    showBatchState('notFoundBatchState');
    const notFoundMessage = document.getElementById('notFoundBatchMessage');
    if (notFoundMessage) {
      notFoundMessage.textContent = `لم يتم العثور على أي عميل ينطبق عليه البحث: "${trimmed}" في الدفعات`;
    }
    return;
  }

  renderBatchResults(matches, trimmed);
}

function renderBatchResults(matches, query) {
  const wrapper = document.getElementById('batchResultsWrapper');
  if (!wrapper) return;

  const countText = matches.length === 1 ? 'نتيجة واحدة' : `${matches.length.toLocaleString('ar-EG')} نتائج`;

  let html = `
    <div class="results-summary-bar">
      <div class="summary-badge">
        <i class="fa-solid fa-users-viewfinder"></i>
        <span>تم العثور على <strong>${countText}</strong> تطابق: "${escapeHtml(query)}"</span>
      </div>
      ${matches.length > 1 ? `
        <button id="copyAllBatchesBtn" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-copy"></i> <span>نسخ جميع النتائج (${matches.length})</span>
        </button>
      ` : ''}
    </div>
    <div class="results-cards-list">
  `;

  matches.forEach((client, index) => {
    html += `
      <div class="glass-card client-result-card card-animate-pop">
        <div class="card-status-bar">
          <span class="status-tag success">
            <i class="fa-solid fa-circle-check"></i> ${matches.length > 1 ? `نتيجة رقم #${index + 1}` : 'تم العثور على بيانات العميل'}
          </span>
          <button class="btn btn-secondary btn-sm copy-single-batch-btn" data-index="${index}">
            <i class="fa-solid fa-copy"></i> <span>نسخ البيانات</span>
          </button>
        </div>

        <div class="client-main-header">
          <div class="client-avatar">
            <i class="fa-solid fa-user-gear"></i>
          </div>
          <div class="client-title-info">
            <span class="field-caption">اسم العميل</span>
            <h2>${escapeHtml(client.name)}</h2>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-box">
            <div class="detail-icon order-icon">
              <i class="fa-solid fa-hashtag"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">رقم الطلب</span>
              <span class="detail-value highlight-code">${escapeHtml(client.orderNum)}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon order-date-icon">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">تاريخ الطلب</span>
              <span class="detail-value order-date-value">${escapeHtml(client.orderDate || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon batch-icon">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">رقم الدفعة</span>
              <span class="detail-value badge-batch">الدفعة ${escapeHtml(client.batchNum)}</span>
            </div>
          </div>

          <div class="detail-box full-width">
            <div class="detail-icon date-icon">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">تاريخ الحضور المقرر</span>
              <span class="detail-value date-value">${escapeHtml(client.attendanceDate || 'غير محدد')}</span>
            </div>
          </div>
        </div>

        <div class="card-footer-info">
          <i class="fa-solid fa-users"></i>
          <span>هذا العميل ضمن قائمة المسجلين بالدفعة (<strong>${escapeHtml(client.batchNum)}</strong>).</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  wrapper.innerHTML = html;

  // Bind copy handlers for batch matches
  const copyAllBtn = wrapper.querySelector('#copyAllBatchesBtn');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      const summaryText = matches.map((c, i) =>
        `النتيجة #${i + 1}:\n- الاسم: ${c.name}\n- رقم الطلب: ${c.orderNum}\n- تاريخ الطلب: ${c.orderDate || 'غير محدد'}\n- الدفعة: الدفعة ${c.batchNum}\n- تاريخ الحضور المقرر: ${c.attendanceDate || 'غير محدد'}`
      ).join('\n-------------------------\n');

      navigator.clipboard.writeText(summaryText).then(() => {
        showToast('تم نسخ كافة النتائج بنجاح');
      });
    });
  }

  wrapper.querySelectorAll('.copy-single-batch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const c = matches[idx];
      if (!c) return;

      const summaryText = `تفاصيل الدفعة وموعد الحضور:\n- الاسم: ${c.name}\n- رقم الطلب: ${c.orderNum}\n- تاريخ الطلب: ${c.orderDate || 'غير محدد'}\n- الدفعة: الدفعة ${c.batchNum}\n- تاريخ الحضور المقرر: ${c.attendanceDate || 'غير محدد'}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        const span = btn.querySelector('span');
        if (span) span.textContent = 'تم النسخ!';
        showToast(`تم نسخ تفاصيل العميل (${c.name}) بنجاح`);
        setTimeout(() => {
          if (span) span.textContent = 'نسخ البيانات';
        }, 3000);
      });
    });
  });

  showBatchState('batchResultsWrapper');
}

function showBatchState(stateId) {
  const states = ['emptyBatchState', 'notFoundBatchState', 'clientResultCard', 'batchResultsWrapper'];
  states.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stateId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

/* ==========================================================================
   Search Engine 2: Housing Lottery Results (Multi-Result Support)
   ========================================================================== */
function executeLotterySearch(query) {
  const trimmed = query.trim();
  const clearBtn = document.getElementById('clearLotterySearchBtn');
  const inputWrapper = document.querySelector('#sectionLottery .search-input-wrapper');

  if (clearBtn) {
    clearBtn.style.display = trimmed ? 'block' : 'none';
  }

  if (!trimmed) {
    if (inputWrapper) {
      inputWrapper.classList.add('shake');
      setTimeout(() => inputWrapper.classList.remove('shake'), 500);
    }
    showLotteryState('emptyLotteryState');
    return;
  }

  const normalized = normalizeString(trimmed);

  // 1. Check for EXACT order number or EXACT lottery number match only (no loose digit stripping)
  const exactOrderMatches = lotteryAppData.participants.filter(item => {
    const normOrder = normalizeString(item.orderNum || '');
    const normLotteryNum = normalizeString(item.lotteryNum || '');

    return (normOrder && normOrder === normalized) ||
           (normLotteryNum && normLotteryNum === normalized);
  });

  let matches = [];

  if (exactOrderMatches.length > 0) {
    // Return only the exact matched order / lottery number
    matches = exactOrderMatches;
  } else {
    // If no exact order/lottery match, search by name, plot, block, sector, neighborhood
    matches = lotteryAppData.participants.filter(item => {
      const normName = normalizeString(item.name || '');
      const normPlot = normalizeString(item.plotNum || '');
      const normBlock = normalizeString(item.blockNum || '');
      const normSector = normalizeString(item.sector || '');
      const normNeighborhood = normalizeString(item.neighborhood || '');

      return normName.includes(normalized) ||
             normPlot === normalized ||
             normBlock === normalized ||
             normSector.includes(normalized) ||
             normNeighborhood.includes(normalized);
    });
  }

  if (matches.length === 0) {
    showLotteryState('notFoundLotteryState');
    const notFoundMessage = document.getElementById('notFoundLotteryMessage');
    if (notFoundMessage) {
      notFoundMessage.textContent = `لم نجد أي نتيجة تطابق البحث: "${trimmed}" في سجلات القرعة العلنية`;
    }
    return;
  }

  renderLotteryResults(matches, trimmed);
}

function renderLotteryResults(matches, query) {
  const wrapper = document.getElementById('lotteryResultsWrapper');
  if (!wrapper) return;

  const countText = matches.length === 1 ? 'نتيجة واحدة' : `${matches.length.toLocaleString('ar-EG')} نتائج`;

  let html = `
    <div class="results-summary-bar">
      <div class="summary-badge gold-summary">
        <i class="fa-solid fa-trophy"></i>
        <span>تم العثور على <strong>${countText}</strong> في القرعة تطابق: "${escapeHtml(query)}"</span>
      </div>
      ${matches.length > 1 ? `
        <button id="copyAllLotteryBtn" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-copy"></i> <span>نسخ جميع النتائج (${matches.length})</span>
        </button>
      ` : ''}
    </div>
    <div class="results-cards-list">
  `;

  matches.forEach((item, index) => {
    html += `
      <div class="glass-card lottery-result-card card-animate-pop">
        <div class="card-status-bar">
          <span class="status-tag gold-tag">
            <i class="fa-solid fa-circle-check"></i> ${matches.length > 1 ? `نتيجة رقم #${index + 1} بالقرعة` : 'نتيجة القرعة العلنية'}
          </span>
          <button class="btn btn-secondary btn-sm copy-single-lottery-btn" data-index="${index}">
            <i class="fa-solid fa-copy"></i> <span>نسخ بيانات القرعة</span>
          </button>
        </div>

        <div class="client-main-header">
          <div class="client-avatar lottery-avatar">
            <i class="fa-solid fa-user-check"></i>
          </div>
          <div class="client-title-info">
            <span class="field-caption">اسم المواطن / المستفيد</span>
            <h2>${escapeHtml(item.name || 'غير محدد')}</h2>
          </div>
        </div>

        <div class="details-grid lottery-grid">
          <div class="detail-box">
            <div class="detail-icon order-icon">
              <i class="fa-solid fa-receipt"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">رقم الطلب</span>
              <span class="detail-value highlight-code">${escapeHtml(item.orderNum || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon lottery-num-icon">
              <i class="fa-solid fa-ticket"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">رقم القرعة</span>
              <span class="detail-value highlight-code">${escapeHtml(item.lotteryNum || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon order-date-icon">
              <i class="fa-solid fa-calendar-days"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">تاريخ الطلب</span>
              <span class="detail-value">${escapeHtml(item.orderDate || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon date-icon">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">تاريخ القرعة</span>
              <span class="detail-value">${escapeHtml(item.lotteryDate || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon sector-icon">
              <i class="fa-solid fa-vector-square"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">القطاع</span>
              <span class="detail-value">${escapeHtml(item.sector || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon neighborhood-icon">
              <i class="fa-solid fa-tree-city"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">المجاورة</span>
              <span class="detail-value">${escapeHtml(item.neighborhood || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon block-icon">
              <i class="fa-solid fa-cubes"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">رقم البلوك</span>
              <span class="detail-value highlight-code">${escapeHtml(item.blockNum || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon plot-icon">
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">رقم القطعة</span>
              <span class="detail-value highlight-code">${escapeHtml(item.plotNum || 'غير محدد')}</span>
            </div>
          </div>

          <div class="detail-box">
            <div class="detail-icon area-icon">
              <i class="fa-solid fa-ruler-combined"></i>
            </div>
            <div class="detail-content">
              <span class="detail-label">المساحة</span>
              <span class="detail-value">${escapeHtml(item.area || 'غير محدد')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  wrapper.innerHTML = html;

  // Bind copy handlers for lottery matches
  const copyAllBtn = wrapper.querySelector('#copyAllLotteryBtn');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', () => {
      const summaryText = matches.map((item, i) =>
        `نتيجة القرعة #${i + 1}:\n- الاسم: ${item.name || 'غير محدد'}\n- رقم الطلب: ${item.orderNum || 'غير محدد'}\n- رقم القرعة: ${item.lotteryNum || 'غير محدد'}\n- تاريخ الطلب: ${item.orderDate || 'غير محدد'}\n- تاريخ القرعة: ${item.lotteryDate || 'غير محدد'}\n- القطاع: ${item.sector || 'غير محدد'}\n- المجاورة: ${item.neighborhood || 'غير محدد'}\n- رقم البلوك: ${item.blockNum || 'غير محدد'}\n- رقم القطعة: ${item.plotNum || 'غير محدد'}\n- المساحة: ${item.area || 'غير محدد'}`
      ).join('\n-------------------------\n');

      navigator.clipboard.writeText(summaryText).then(() => {
        showToast('تم نسخ جميع نتائج القرعة بنجاح');
      });
    });
  }

  wrapper.querySelectorAll('.copy-single-lottery-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'));
      const item = matches[idx];
      if (!item) return;

      const summaryText = `تفاصيل نتيجة القرعة العلنية:\n- الاسم: ${item.name || 'غير محدد'}\n- رقم الطلب: ${item.orderNum || 'غير محدد'}\n- رقم القرعة: ${item.lotteryNum || 'غير محدد'}\n- تاريخ الطلب: ${item.orderDate || 'غير محدد'}\n- تاريخ القرعة: ${item.lotteryDate || 'غير محدد'}\n- القطاع: ${item.sector || 'غير محدد'}\n- المجاورة: ${item.neighborhood || 'غير محدد'}\n- رقم البلوك: ${item.blockNum || 'غير محدد'}\n- رقم القطعة: ${item.plotNum || 'غير محدد'}\n- المساحة: ${item.area || 'غير محدد'}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        const span = btn.querySelector('span');
        if (span) span.textContent = 'تم النسخ!';
        showToast(`تم نسخ تفاصيل القرعة للمواطن (${item.name}) بنجاح`);
        setTimeout(() => {
          if (span) span.textContent = 'نسخ بيانات القرعة';
        }, 3000);
      });
    });
  });

  showLotteryState('lotteryResultsWrapper');
}

function showLotteryState(stateId) {
  const states = ['emptyLotteryState', 'notFoundLotteryState', 'lotteryResultCard', 'lotteryResultsWrapper'];
  states.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stateId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

/**
 * Normalizes Arabic strings & numbers for reliable matching
 */
function normalizeString(str) {
  if (!str) return '';
  let s = String(str).trim();

  // Convert Eastern Arabic Numerals (٠١٢٣٤٥٦٧٨٩) to Western (0123456789)
  const easternDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  for (let i = 0; i < 10; i++) {
    s = s.replace(easternDigits[i], i);
  }

  // Remove Tashkeel (Arabic Diacritics)
  s = s.replace(/[\u064B-\u0652]/g, '');

  // Normalize Alef, Ya, Marbouta
  s = s.replace(/[أإآ]/g, 'ا');
  s = s.replace(/ى/g, 'ي');
  s = s.replace(/ة/g, 'ه');

  return s.toLowerCase();
}

/* ==========================================================================
   UI Event Listeners & Handlers
   ========================================================================== */
function bindEvents() {
  // Batch Search Listeners
  const searchBatchInput = document.getElementById('searchBatchInput');
  const searchBatchForm = document.getElementById('searchBatchForm');
  const searchBatchSubmitBtn = document.getElementById('searchBatchSubmitBtn');
  const clearBatchSearchBtn = document.getElementById('clearBatchSearchBtn');
  const copyDetailsBtn = document.getElementById('copyDetailsBtn');

  if (searchBatchInput) {
    searchBatchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearBatchSearchBtn) clearBatchSearchBtn.style.display = val ? 'block' : 'none';
      if (!val) showBatchState('emptyBatchState');
    });
  }

  const triggerBatchSearch = () => {
    if (searchBatchInput) executeBatchSearch(searchBatchInput.value);
  };

  if (searchBatchForm) searchBatchForm.addEventListener('submit', triggerBatchSearch);
  if (searchBatchSubmitBtn) searchBatchSubmitBtn.addEventListener('click', triggerBatchSearch);

  if (clearBatchSearchBtn) {
    clearBatchSearchBtn.addEventListener('click', () => {
      if (searchBatchInput) searchBatchInput.value = '';
      executeBatchSearch('');
      if (searchBatchInput) searchBatchInput.focus();
    });
  }

  if (copyDetailsBtn) {
    copyDetailsBtn.addEventListener('click', () => {
      const name = document.getElementById('cardClientName').textContent;
      const order = document.getElementById('cardOrderNumber').textContent;
      const orderDate = document.getElementById('cardOrderDate').textContent;
      const batch = document.getElementById('cardBatchNumber').textContent;
      const date = document.getElementById('cardAttendanceDate').textContent;

      const summaryText = `تفاصيل الدفعة وموعد الحضور:\n- الاسم: ${name}\n- رقم الطلب: ${order}\n- تاريخ الطلب: ${orderDate}\n- ${batch}\n- تاريخ الحضور المقرر: ${date}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        const copyBtnText = document.getElementById('copyBtnText');
        if (copyBtnText) copyBtnText.textContent = 'تم النسخ!';
        showToast('تم نسخ تفاصيل العميل بنجاح');
        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = 'نسخ البيانات';
        }, 3000);
      }).catch(err => {
        showToast('تعذر النسخ إلى الحافظة');
      });
    });
  }

  // Lottery Search Listeners
  const searchLotteryInput = document.getElementById('searchLotteryInput');
  const searchLotteryForm = document.getElementById('searchLotteryForm');
  const searchLotterySubmitBtn = document.getElementById('searchLotterySubmitBtn');
  const clearLotterySearchBtn = document.getElementById('clearLotterySearchBtn');
  const copyLotteryDetailsBtn = document.getElementById('copyLotteryDetailsBtn');

  if (searchLotteryInput) {
    searchLotteryInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearLotterySearchBtn) clearLotterySearchBtn.style.display = val ? 'block' : 'none';
      if (!val) showLotteryState('emptyLotteryState');
    });
  }

  const triggerLotterySearch = () => {
    if (searchLotteryInput) executeLotterySearch(searchLotteryInput.value);
  };

  if (searchLotteryForm) searchLotteryForm.addEventListener('submit', triggerLotterySearch);
  if (searchLotterySubmitBtn) searchLotterySubmitBtn.addEventListener('click', triggerLotterySearch);

  if (clearLotterySearchBtn) {
    clearLotterySearchBtn.addEventListener('click', () => {
      if (searchLotteryInput) searchLotteryInput.value = '';
      executeLotterySearch('');
      if (searchLotteryInput) searchLotteryInput.focus();
    });
  }

  if (copyLotteryDetailsBtn) {
    copyLotteryDetailsBtn.addEventListener('click', () => {
      const name = document.getElementById('cardLotteryName')?.textContent || '';
      const order = document.getElementById('cardLotteryOrderNum')?.textContent || '';
      const lotteryNum = document.getElementById('cardLotteryNum')?.textContent || '';
      const orderDate = document.getElementById('cardLotteryOrderDate')?.textContent || '';
      const lotteryDate = document.getElementById('cardLotteryDate')?.textContent || '';
      const sector = document.getElementById('cardLotterySector')?.textContent || '';
      const neighborhood = document.getElementById('cardLotteryNeighborhood')?.textContent || '';
      const block = document.getElementById('cardLotteryBlock')?.textContent || '';
      const plot = document.getElementById('cardLotteryPlot')?.textContent || '';
      const area = document.getElementById('cardLotteryArea')?.textContent || '';

      const summaryText = `تفاصيل نتيجة القرعة العلنية:\n- الاسم: ${name}\n- رقم الطلب: ${order}\n- رقم القرعة: ${lotteryNum}\n- تاريخ الطلب: ${orderDate}\n- تاريخ القرعة: ${lotteryDate}\n- القطاع: ${sector}\n- المجاورة: ${neighborhood}\n- رقم البلوك: ${block}\n- رقم القطعة: ${plot}\n- المساحة: ${area}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        const copyLotteryBtnText = document.getElementById('copyLotteryBtnText');
        if (copyLotteryBtnText) copyLotteryBtnText.textContent = 'تم النسخ!';
        showToast('تم نسخ تفاصيل نتيجة القرعة بنجاح');
        setTimeout(() => {
          if (copyLotteryBtnText) copyLotteryBtnText.textContent = 'نسخ بيانات القرعة';
        }, 3000);
      }).catch(err => {
        showToast('تعذر النسخ إلى الحافظة');
      });
    });
  }

  // File Upload Handlers
  setupExcelUploader();

  // Clear Data Button (Admin Locked)
  const clearDataBtn = document.getElementById('clearDataBtn');
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      requireAdminAuth(() => {
        if (confirm('هل أنت تأكد من مسح كافة البيانات المخزنة محلياً (الدفعات والقرعة)؟')) {
          localStorage.removeItem(STORAGE_KEY_BATCH);
          localStorage.removeItem(STORAGE_KEY_LOTTERY);

          batchAppData.clients = [];
          batchAppData.orderMap.clear();
          batchAppData.nameList = [];
          batchAppData.batchMap.clear();
          batchAppData.totalBatches = 0;

          lotteryAppData.participants = [];
          lotteryAppData.orderMap.clear();
          lotteryAppData.nameList = [];

          updateHeaderStats();
          populateBatchSelect();

          showBatchState('emptyBatchState');
          showLotteryState('emptyLotteryState');

          showToast('تم مسح كافة البيانات المخزنة بنجاح');
        }
      });
    });
  }

  // Batch Select Listener
  const batchSelect = document.getElementById('batchSelect');
  if (batchSelect) {
    batchSelect.addEventListener('change', (e) => {
      renderSelectedBatchInfo(parseInt(e.target.value));
    });
  }
}

/* ==========================================================================
   Excel / CSV File Uploader Integration (Smart Auto Detection)
   ========================================================================== */
function setupExcelUploader() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('excelFileInput');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => {
    requireAdminAuth(() => fileInput.click());
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      requireAdminAuth(() => handleExcelFile(file));
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleExcelFile(e.target.files[0]);
    }
  });
}

function handleExcelFile(file) {
  if (typeof XLSX === 'undefined') {
    showToast('جاري تحميل مكتبة قراءة ملفات Excel...');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: false });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!jsonData || jsonData.length < 2) {
        alert('الملف فارغ أو لا يحتوي على أسطر بيانات كافية!');
        return;
      }

      parseAndImportExcelRows(jsonData, file.name);

    } catch (err) {
      console.error('Error reading Excel file:', err);
      alert('حدث خطأ أثناء قراءة ملف الإكسيل. يرجى التأكد من أن الملف ليس تالفاً وصيغته (.xlsx / .xls / .csv)');
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseAndImportExcelRows(rows, fileName) {
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  // Check if file is a Lottery file (contains sector, neighborhood, plot, or block)
  const isLotteryFile = headers.some(h =>
    h.includes('قطاع') || h.includes('مجاوره') || h.includes('مجاورة') ||
    h.includes('بلوك') || h.includes('قطعه') || h.includes('قطعة') || h.includes('مساحه') || h.includes('مساحة')
  );

  if (isLotteryFile) {
    parseLotteryRows(rows, headers, fileName);
  } else {
    parseBatchRows(rows, headers, fileName);
  }
}

function extractLotteryItemsFromRows(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  let nameCol = headers.findIndex(h => h.includes('اسم') || h.includes('name') || h.includes('مواطن') || h.includes('عميل'));
  
  let orderCol = headers.findIndex(h => h.includes('رقم الطلب') || h.includes('كود') || h.includes('code') || h.includes('order num') || h.includes('order_num') || h.includes('order#'));
  if (orderCol === -1) {
    orderCol = headers.findIndex(h => (h.includes('طلب') || h.includes('order')) && !h.includes('تاريخ') && !h.includes('date'));
  }
  if (orderCol === -1) {
    orderCol = headers.findIndex(h => h.includes('رقم القرع') || h.includes('رقم القرعة') || h.includes('رقم القرعه'));
  }
  if (orderCol === -1) {
    orderCol = headers.findIndex(h => (h.includes('رقم') || h.includes('num')) && !h.includes('بلوك') && !h.includes('قطعة') && !h.includes('قطعه') && !h.includes('مساحة') && !h.includes('مساحه') && !h.includes('تاريخ'));
  }

  let sectorCol = headers.findIndex(h => h.includes('قطاع') || h.includes('sector'));
  let neighborhoodCol = headers.findIndex(h => h.includes('مجاوره') || h.includes('مجاورة') || h.includes('مجاور'));
  let blockCol = headers.findIndex(h => h.includes('بلوك') || h.includes('block'));
  let plotCol = headers.findIndex(h => h.includes('قطعه') || h.includes('قطعة') || h.includes('plot'));
  let areaCol = headers.findIndex(h => h.includes('مساحه') || h.includes('مساحة') || h.includes('area'));

  let lotteryNumCol = headers.findIndex(h => h.includes('رقم القرع') || h.includes('رقم القرعة') || h.includes('رقم القرعه'));
  let orderDateCol = headers.findIndex(h => h.includes('تاريخ الطلب'));
  let lotteryDateCol = headers.findIndex(h => h.includes('تاريخ القرع') || h.includes('تاريخ القرعة') || h.includes('تاريخ القرعه'));

  if (nameCol === -1) nameCol = 0;

  const importedLottery = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameCol] || '').trim();
    const orderNumVal = orderCol !== -1 ? String(row[orderCol] || '').trim() : '';
    const lotteryNumVal = lotteryNumCol !== -1 ? String(row[lotteryNumCol] || '').trim() : '';

    if (!name && !orderNumVal && !lotteryNumVal) continue;

    let finalOrderNum = orderNumVal;
    if (!finalOrderNum || finalOrderNum === 'لا يوجد') {
      if (lotteryNumVal && lotteryNumVal !== 'لا يوجد') {
        finalOrderNum = lotteryNumVal;
      }
    }

    const sector = String(sectorCol !== -1 ? row[sectorCol] : 'غير مخصص بعد').trim() || 'غير مخصص بعد';
    const neighborhood = String(neighborhoodCol !== -1 ? row[neighborhoodCol] : 'غير مخصص بعد').trim() || 'غير مخصص بعد';
    const blockNum = String(blockCol !== -1 ? row[blockCol] : 'غير مخصص بعد').trim() || 'غير مخصص بعد';
    const plotNum = String(plotCol !== -1 ? row[plotCol] : 'غير مخصص بعد').trim() || 'غير مخصص بعد';
    const rawArea = String(areaCol !== -1 ? row[areaCol] : 'غير مخصص بعد').trim() || 'غير مخصص بعد';

    let area = rawArea;
    if (rawArea !== 'غير مخصص بعد' && rawArea !== 'لا يوجد' && !rawArea.includes('م')) {
      area = `${rawArea} م²`;
    }

    const orderDate = orderDateCol !== -1 ? formatDateValue(row[orderDateCol]) : 'غير محدد';
    const lotteryDate = lotteryDateCol !== -1 ? formatDateValue(row[lotteryDateCol]) : 'غير محدد';

    importedLottery.push({
      name: name || `مواطن ${i}`,
      orderNum: finalOrderNum || `LOT-${i + 5000}`,
      lotteryNum: lotteryNumVal,
      orderDate: orderDate,
      lotteryDate: lotteryDate,
      sector: sector,
      neighborhood: neighborhood,
      blockNum: blockNum,
      plotNum: plotNum,
      area: area
    });
  }

  return importedLottery;
}

function parseLotteryRows(rows, headers, fileName) {
  const importedLottery = extractLotteryItemsFromRows(rows);

  if (importedLottery.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY_LOTTERY, JSON.stringify(importedLottery));
    } catch (e) {
      console.error(e);
    }
    processLotteryData(importedLottery, `ملف قرعة: ${fileName}`);
    showToast(`تم استيراد ${importedLottery.length.toLocaleString('ar-EG')} نتيجة قرعة بنجاح`);

    const tabLotteryBtn = document.getElementById('tabLotteryBtn');
    if (tabLotteryBtn) tabLotteryBtn.click();

  } else {
    alert('لم يتم العثور على بيانات قرعة صالحة في الملف!');
  }
}

function extractBatchItemsFromRows(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  let nameCol = headers.findIndex(h => h.includes('اسم') || h.includes('name') || h.includes('عميل'));
  let batchCol = headers.findIndex(h => h.includes('دفعه') || h.includes('دفعة') || h.includes('batch'));
  let orderCol = headers.findIndex(h => h.includes('طلب') || h.includes('كود') || h.includes('code') || h.includes('order'));
  let orderDateCol = headers.findIndex(h => h.includes('تاريخ الطلب') || h.includes('order date'));
  let attendanceDateCol = headers.findIndex(h => h.includes('حضور') || h.includes('تاريخ الحضور') || h.includes('attendance'));

  if (nameCol === -1) nameCol = 0;
  if (orderCol === -1) orderCol = 1;
  if (batchCol === -1) batchCol = 2;

  const importedClients = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameCol] || '').trim();
    const orderNum = String(row[orderCol] || '').trim();
    if (!name && !orderNum) continue;

    let batchNum = parseInt(row[batchCol]);
    if (isNaN(batchNum)) batchNum = Math.ceil(i / 150);

    const orderDate = formatDateValue(row[orderDateCol]);
    const attendanceDate = formatDateValue(row[attendanceDateCol]);

    importedClients.push({
      name: name || `عميل ${i}`,
      orderNum: orderNum || `ORD-${i + 10000}`,
      orderDate: orderDate,
      batchNum: batchNum,
      attendanceDate: attendanceDate
    });
  }

  return importedClients;
}

function parseBatchRows(rows, headers, fileName) {
  const importedClients = extractBatchItemsFromRows(rows);

  if (importedClients.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY_BATCH, JSON.stringify(importedClients));
    } catch (e) {
      console.error(e);
    }
    processBatchData(importedClients, `ملف دفعات: ${fileName}`);
    showToast(`تم استيراد ${importedClients.length.toLocaleString('ar-EG')} عميل بالدفعات بنجاح`);

    const tabBatchesBtn = document.getElementById('tabBatchesBtn');
    if (tabBatchesBtn) tabBatchesBtn.click();
  } else {
    alert('لم يتم العثور على بيانات دفعات صالحة في الملف!');
  }
}

function formatDateValue(rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '') return 'غير محدد';

  if (rawVal instanceof Date) {
    const y = rawVal.getUTCFullYear();
    const m = rawVal.getUTCMonth();
    const d = rawVal.getUTCDate();
    const utcDate = new Date(Date.UTC(y, m, d));
    return utcDate.toLocaleDateString('ar-EG', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (typeof rawVal === 'number' && rawVal > 20000 && rawVal < 60000) {
    const jsDate = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
    return jsDate.toLocaleDateString('ar-EG', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
  }

  const str = String(rawVal).trim();
  if (!str) return 'غير محدد';

  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const utcDate = new Date(Date.UTC(y, m, d));
    return utcDate.toLocaleDateString('ar-EG', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
  }

  return str;
}

/* ==========================================================================
   Header Stats & Batch Selector UI Updates
   ========================================================================== */
function updateHeaderStats() {
  const statBatchesCount = document.getElementById('statBatchesCount');
  const statClientsCount = document.getElementById('statClientsCount');

  if (statBatchesCount) {
    statBatchesCount.textContent = batchAppData.totalBatches.toLocaleString('ar-EG');
  }
  if (statClientsCount) {
    const totalClients = batchAppData.clients.length + lotteryAppData.participants.length;
    statClientsCount.textContent = totalClients.toLocaleString('ar-EG');
  }
}

function populateBatchSelect() {
  const batchSelect = document.getElementById('batchSelect');
  if (!batchSelect) return;

  batchSelect.innerHTML = '';

  if (batchAppData.totalBatches === 0) {
    batchSelect.innerHTML = '<option value="">لا توجد دفعات</option>';
    renderSelectedBatchInfo(0);
    return;
  }

  const sortedBatches = Array.from(batchAppData.batchMap.keys()).sort((a, b) => a - b);

  sortedBatches.forEach(bNum => {
    const opt = document.createElement('option');
    opt.value = bNum;
    opt.textContent = `الدفعة رقم (${bNum})`;
    batchSelect.appendChild(opt);
  });

  if (sortedBatches.length > 0) {
    batchSelect.value = sortedBatches[0];
    renderSelectedBatchInfo(sortedBatches[0]);
  }
}

function renderSelectedBatchInfo(batchNum) {
  const dateEl = document.getElementById('selectedBatchDate');
  const countEl = document.getElementById('selectedBatchCount');
  const listEl = document.getElementById('batchClientsList');

  if (!listEl) return;
  listEl.innerHTML = '';

  const clientsInBatch = batchAppData.batchMap.get(batchNum) || [];

  if (dateEl) {
    dateEl.textContent = clientsInBatch.length > 0 ? clientsInBatch[0].attendanceDate : '--';
  }
  if (countEl) {
    countEl.textContent = `${clientsInBatch.length} عميل`;
  }

  if (clientsInBatch.length === 0) {
    listEl.innerHTML = '<li style="justify-content:center; color:var(--text-muted);">لا يوجد عملاء بالدفعة</li>';
    return;
  }

  clientsInBatch.slice(0, 50).forEach(client => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${client.name}</span>
      <span class="client-order-num">${client.orderNum}</span>
    `;
    li.addEventListener('click', () => {
      const searchInput = document.getElementById('searchBatchInput');
      if (searchInput) searchInput.value = client.orderNum;
      executeBatchSearch(client.orderNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    listEl.appendChild(li);
  });

  if (clientsInBatch.length > 50) {
    const moreLi = document.createElement('li');
    moreLi.style.justify = 'center';
    moreLi.style.color = 'var(--text-muted)';
    moreLi.style.fontStyle = 'italic';
    moreLi.textContent = `... و ${clientsInBatch.length - 50} عميل آخرون`;
    listEl.appendChild(moreLi);
  }
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}
