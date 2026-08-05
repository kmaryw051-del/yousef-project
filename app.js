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
  const batchesSidebarBox = document.getElementById('batchesSidebarBox');

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
      if (batchesSidebarBox) {
        batchesSidebarBox.style.display = 'block';
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
      if (batchesSidebarBox) {
        batchesSidebarBox.style.display = 'none';
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
function loadData() {
  // 1. Load Batches Data
  const savedBatchData = localStorage.getItem(STORAGE_KEY_BATCH);
  if (savedBatchData) {
    try {
      const parsed = JSON.parse(savedBatchData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processBatchData(parsed, 'بيانات الدفعات المحملة سابقاً');
      } else {
        loadDefaultBatchData();
      }
    } catch (e) {
      console.error('Error parsing stored batch data:', e);
      loadDefaultBatchData();
    }
  } else {
    loadDefaultBatchData();
  }

  // 2. Load Lottery Data
  const savedLotteryData = localStorage.getItem(STORAGE_KEY_LOTTERY);
  if (savedLotteryData) {
    try {
      const parsed = JSON.parse(savedLotteryData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        processLotteryData(parsed, 'بيانات القرعة المحملة سابقاً');
      } else {
        loadDefaultLotteryData();
      }
    } catch (e) {
      console.error('Error parsing stored lottery data:', e);
      loadDefaultLotteryData();
    }
  } else {
    loadDefaultLotteryData();
  }
}

function loadDefaultBatchData() {
  const sampleBatches = [
    { name: 'أحمد محمد إبراهيم', orderNum: 'ORD-10025', orderDate: '10 يناير 2026', batchNum: 1, attendanceDate: 'السبت 15 أغسطس 2026' },
    { name: 'محمود حسن السيد', orderNum: 'ORD-10026', orderDate: '12 يناير 2026', batchNum: 1, attendanceDate: 'السبت 15 أغسطس 2026' },
    { name: 'مصطفى علي عبد الله', orderNum: 'ORD-10027', orderDate: '14 يناير 2026', batchNum: 2, attendanceDate: 'الأحد 16 أغسطس 2026' },
    { name: 'سارة خالد محمود', orderNum: 'ORD-10028', orderDate: '15 يناير 2026', batchNum: 2, attendanceDate: 'الأحد 16 أغسطس 2026' },
    { name: 'عبد الرحمن الشريف', orderNum: 'ORD-10029', orderDate: '18 يناير 2026', batchNum: 3, attendanceDate: 'الاثنين 17 أغسطس 2026' }
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
   Search Engine 1: Batches & Attendance
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

  // 1. Exact order number match
  if (batchAppData.orderMap.has(normalized)) {
    renderBatchResult(batchAppData.orderMap.get(normalized));
    return;
  }

  // 2. Substring match in order numbers
  const matchedByOrder = batchAppData.clients.find(c => normalizeString(c.orderNum).includes(normalized));
  if (matchedByOrder) {
    renderBatchResult(matchedByOrder);
    return;
  }

  // 3. Substring match in client names
  const matchedByName = batchAppData.nameList.find(item => item.normName.includes(normalized));
  if (matchedByName) {
    renderBatchResult(matchedByName.client);
    return;
  }

  // 4. Not Found
  showBatchState('notFoundBatchState');
  const notFoundMessage = document.getElementById('notFoundBatchMessage');
  if (notFoundMessage) {
    notFoundMessage.textContent = `لم يتم العثور على أي عميل ينطبق عليه البحث: "${trimmed}" في الدفعات`;
  }
}

function renderBatchResult(client) {
  document.getElementById('cardClientName').textContent = client.name;
  document.getElementById('cardOrderNumber').textContent = client.orderNum;
  document.getElementById('cardOrderDate').textContent = client.orderDate || 'غير محدد';
  document.getElementById('cardBatchNumber').textContent = `الدفعة ${client.batchNum}`;
  document.getElementById('cardAttendanceDate').textContent = client.attendanceDate;
  document.getElementById('cardBatchMiniNum').textContent = client.batchNum;

  const copyBtnText = document.getElementById('copyBtnText');
  if (copyBtnText) copyBtnText.textContent = 'نسخ البيانات';

  const card = document.getElementById('clientResultCard');
  if (card) {
    card.classList.remove('card-animate-pop');
    void card.offsetWidth;
    card.classList.add('card-animate-pop');
  }

  showBatchState('clientResultCard');
}

function showBatchState(stateId) {
  const states = ['emptyBatchState', 'notFoundBatchState', 'clientResultCard'];
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
   Search Engine 2: Housing Lottery Results (The 7 Fields)
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

  // 1. Exact order number match
  if (lotteryAppData.orderMap.has(normalized)) {
    renderLotteryResult(lotteryAppData.orderMap.get(normalized));
    return;
  }

  // 2. Substring match in order numbers
  const matchedByOrder = lotteryAppData.participants.find(p => normalizeString(p.orderNum).includes(normalized));
  if (matchedByOrder) {
    renderLotteryResult(matchedByOrder);
    return;
  }

  // 3. Substring match in names
  const matchedByName = lotteryAppData.nameList.find(item => item.normName.includes(normalized));
  if (matchedByName) {
    renderLotteryResult(matchedByName.item);
    return;
  }

  // 4. Not Found
  showLotteryState('notFoundLotteryState');
  const notFoundMessage = document.getElementById('notFoundLotteryMessage');
  if (notFoundMessage) {
    notFoundMessage.textContent = `لم نجد أي نتيجة تطابق البحث: "${trimmed}" في سجلات القرعة العلنية`;
  }
}

function renderLotteryResult(item) {
  // Populate the 7 Fields requested by User
  document.getElementById('cardLotteryName').textContent = item.name || 'غير محدد';
  document.getElementById('cardLotteryOrderNum').textContent = item.orderNum || 'غير محدد';
  document.getElementById('cardLotterySector').textContent = item.sector || 'غير محدد';
  document.getElementById('cardLotteryNeighborhood').textContent = item.neighborhood || 'غير محدد';
  document.getElementById('cardLotteryBlock').textContent = item.blockNum || 'غير محدد';
  document.getElementById('cardLotteryPlot').textContent = item.plotNum || 'غير محدد';
  document.getElementById('cardLotteryArea').textContent = item.area || 'غير محدد';

  const copyLotteryBtnText = document.getElementById('copyLotteryBtnText');
  if (copyLotteryBtnText) copyLotteryBtnText.textContent = 'نسخ بيانات القرعة';

  const card = document.getElementById('lotteryResultCard');
  if (card) {
    card.classList.remove('card-animate-pop');
    void card.offsetWidth;
    card.classList.add('card-animate-pop');
  }

  showLotteryState('lotteryResultCard');
}

function showLotteryState(stateId) {
  const states = ['emptyLotteryState', 'notFoundLotteryState', 'lotteryResultCard'];
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
      const name = document.getElementById('cardLotteryName').textContent;
      const order = document.getElementById('cardLotteryOrderNum').textContent;
      const sector = document.getElementById('cardLotterySector').textContent;
      const neighborhood = document.getElementById('cardLotteryNeighborhood').textContent;
      const block = document.getElementById('cardLotteryBlock').textContent;
      const plot = document.getElementById('cardLotteryPlot').textContent;
      const area = document.getElementById('cardLotteryArea').textContent;

      const summaryText = `تفاصيل نتيجة القرعة العلنية:\n- الاسم: ${name}\n- رقم الطلب: ${order}\n- القطاع: ${sector}\n- المجاورة: ${neighborhood}\n- رقم البلوك: ${block}\n- رقم القطعة: ${plot}\n- المساحة: ${area}`;

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
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
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

function parseLotteryRows(rows, headers, fileName) {
  let nameCol = headers.findIndex(h => h.includes('اسم') || h.includes('name') || h.includes('مواطن') || h.includes('عميل'));
  let orderCol = headers.findIndex(h => h.includes('طلب') || h.includes('كود') || h.includes('code') || h.includes('order') || h.includes('رقم'));
  let sectorCol = headers.findIndex(h => h.includes('قطاع') || h.includes('sector'));
  let neighborhoodCol = headers.findIndex(h => h.includes('مجاوره') || h.includes('مجاورة') || h.includes('مجاور'));
  let blockCol = headers.findIndex(h => h.includes('بلوك') || h.includes('block'));
  let plotCol = headers.findIndex(h => h.includes('قطعه') || h.includes('قطعة') || h.includes('plot'));
  let areaCol = headers.findIndex(h => h.includes('مساحه') || h.includes('مساحة') || h.includes('area'));

  // Fallbacks
  if (nameCol === -1) nameCol = 0;
  if (orderCol === -1) orderCol = 1;
  if (sectorCol === -1) sectorCol = 2;
  if (neighborhoodCol === -1) neighborhoodCol = 3;
  if (blockCol === -1) blockCol = 4;
  if (plotCol === -1) plotCol = 5;
  if (areaCol === -1) areaCol = 6;

  const importedLottery = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = String(row[nameCol] || '').trim();
    const orderNum = String(row[orderCol] || '').trim();
    if (!name && !orderNum) continue;

    const sector = String(row[sectorCol] || 'القطاع الرئيسي').trim();
    const neighborhood = String(row[neighborhoodCol] || 'المجاورة الأولى').trim();
    const blockNum = String(row[blockCol] || `B-${i}`).trim();
    const plotNum = String(row[plotCol] || `${i + 100}`).trim();
    const rawArea = String(row[areaCol] || '209').trim();
    const area = rawArea.includes('م') ? rawArea : `${rawArea} م²`;

    importedLottery.push({
      name: name || `مواطن ${i}`,
      orderNum: orderNum || `LOT-${i + 5000}`,
      sector: sector,
      neighborhood: neighborhood,
      blockNum: blockNum,
      plotNum: plotNum,
      area: area
    });
  }

  if (importedLottery.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY_LOTTERY, JSON.stringify(importedLottery));
    } catch (e) {
      console.error(e);
    }
    processLotteryData(importedLottery, `ملف قرعة: ${fileName}`);
    showToast(`تم استيراد ${importedLottery.length.toLocaleString('ar-EG')} نتيجة قرعة بنجاح`);

    // Auto-switch tab to lottery to show user
    const tabLotteryBtn = document.getElementById('tabLotteryBtn');
    if (tabLotteryBtn) tabLotteryBtn.click();

  } else {
    alert('لم يتم العثور على بيانات قرعة صالحة في الملف!');
  }
}

function parseBatchRows(rows, headers, fileName) {
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
  if (!rawVal) return 'غير محدد';
  if (rawVal instanceof Date) {
    return rawVal.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (typeof rawVal === 'number' && rawVal > 20000 && rawVal < 60000) {
    const jsDate = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
    return jsDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  const str = String(rawVal).trim();
  return str || 'غير محدد';
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
