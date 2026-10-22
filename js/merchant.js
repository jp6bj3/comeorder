/**
 * 來電送 (LaiPower Food) - 商家管理後台控制器
 * 
 * 核心升級：
 * 1. 【雙軌獨立沙盒模擬】：
 *    - Profile A（舊廠商：西門町排骨大王）：3道完整餐點、進行中訂單、營業中，體驗完整接單出餐。
 *    - Profile B（新店家：獨立註冊帳號）：0項餐點、0筆訂單、嚴格休息中，強制依循導引先上架餐點才能接單。
 * 2. 【兩者資料互不干擾】：儲存在各自獨立的 localStorage 鍵值中。
 * 3. 【快捷一鍵切換】：在後台頂部可直接切換「舊廠商」與「新店家」對照體驗。
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  console.log("【來電送】商家後台控制器啟動（已載入雙軌獨立模擬模式）...");

  // =========================================================================
  // 1. 規格範本與資料庫常數
  // =========================================================================

  const KEY_ACTIVE_VENDOR = "laipower_active_vendor_mode"; // 'legacy' | 'new'
  const KEY_LEGACY_DATA = "laipower_vendor_data_legacy";
  const KEY_NEW_DATA = "laipower_vendor_data_new";

  const TEMPLATE_BENTO = [
    {
      id: "grp-spicy",
      title: "辣度選擇",
      type: "single",
      required: true,
      options: [
        { name: "原味不辣", price: 0 },
        { name: "微辣", price: 0 },
        { name: "小辣", price: 0 },
        { name: "中辣", price: 0 },
        { name: "大辣", price: 0 }
      ]
    },
    {
      id: "grp-rice",
      title: "主食與飯量偏好",
      type: "single",
      required: true,
      options: [
        { name: "正常飯量", price: 0 },
        { name: "少飯", price: 0 },
        { name: "半飯", price: 0 },
        { name: "飯換時蔬", price: 0 }
      ]
    },
    {
      id: "grp-cut",
      title: "肉品處理方式",
      type: "single",
      required: true,
      options: [
        { name: "不切（鎖肉汁）", price: 0 },
        { name: "切塊（好入口）", price: 0 }
      ]
    },
    {
      id: "grp-habits",
      title: "個人飲食偏好（忌口）",
      type: "multiple",
      required: false,
      options: [
        { name: "不要香菜", price: 0 },
        { name: "不要蔥花", price: 0 },
        { name: "不要酸菜", price: 0 },
        { name: "少油少鹽", price: 0 }
      ]
    },
    {
      id: "grp-addons",
      title: "美味加價購",
      type: "multiple",
      required: false,
      options: [
        { name: "加滷蛋", price: 15 },
        { name: "加油豆腐", price: 15 },
        { name: "加香腸", price: 25 },
        { name: "加排骨", price: 60 }
      ]
    }
  ];

  const TEMPLATE_SNACK = [
    {
      id: "grp-sauce-flavor",
      title: "調味與沾醬搭配",
      type: "single",
      required: true,
      options: [
        { name: "經典胡椒鹽（正常）", price: 0 },
        { name: "多灑胡椒鹽", price: 0 },
        { name: "甜辣醬直接淋上", price: 0 },
        { name: "沾醬分開包", price: 0 }
      ]
    },
    {
      id: "grp-snack-herbs",
      title: "配料增減",
      type: "multiple",
      required: false,
      options: [
        { name: "加九層塔", price: 0 },
        { name: "加生蒜碎", price: 0 },
        { name: "不要香菜", price: 0 }
      ]
    },
    {
      id: "grp-snack-addons",
      title: "超值加購",
      type: "multiple",
      required: false,
      options: [
        { name: "加手工米血糕", price: 25 },
        { name: "加手工甜不辣", price: 30 }
      ]
    }
  ];

  const TEMPLATE_DRINK = [
    {
      id: "grp-sweetness",
      title: "甜度選擇",
      type: "single",
      required: true,
      options: [
        { name: "正常甜 (10分)", price: 0 },
        { name: "半糖 (5分)", price: 0 },
        { name: "微糖 (3分)", price: 0 },
        { name: "無糖 (0分)", price: 0 }
      ]
    },
    {
      id: "grp-ice",
      title: "冰塊與溫度",
      type: "single",
      required: true,
      options: [
        { name: "正常冰", price: 0 },
        { name: "少冰", price: 0 },
        { name: "微冰", price: 0 },
        { name: "去冰", price: 0 },
        { name: "常溫", price: 0 }
      ]
    },
    {
      id: "grp-toppings",
      title: "配料加購",
      type: "multiple",
      required: false,
      options: [
        { name: "加波霸珍珠", price: 10 },
        { name: "加蜂蜜椰果", price: 10 },
        { name: "加仙草凍", price: 10 }
      ]
    }
  ];

  const PRESET_QUICK_CHIPS = [
    { name: "不要香菜", price: 0 },
    { name: "不要蔥花", price: 0 },
    { name: "醬汁分開裝", price: 0 },
    { name: "少飯多菜", price: 0 },
    { name: "切塊好入口", price: 0 },
    { name: "加滷蛋", price: 15 },
    { name: "加排骨", price: 60 }
  ];

  // 舊廠商預設資料 (西門町排骨大王)
  const defaultLegacyProfile = {
    store: {
      storeName: "西門町排骨大王",
      category: "中式便當・老字號",
      address: "臺北市萬華區西門町內江街69號",
      phone: "02-2388-1234",
      isOpen: true,
      isOnboarding: false,
      onboardingStep: 0,
      startTime: "09:00",
      stopTime: "18:00",
      capacityThreshold: 50,
      deliveryThreshold: 300,
      tierDiscounts: [
        { qty: 10, gift: "店家招牌冰紅茶 1 壺" },
        { qty: 20, gift: "全單享 9 折優惠" }
      ]
    },
    menu: [
      {
        id: "dish-1",
        name: "酥炸厚切排骨便當",
        price: 120,
        desc: "每日採買現宰溫體黑豬里肌，特調中藥古早味醃製現炸，香酥厚實多汁！",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        isAvailable: true,
        specGroups: JSON.parse(JSON.stringify(TEMPLATE_BENTO))
      },
      {
        id: "dish-2",
        name: "招牌香酥雞腿便當",
        price: 130,
        desc: "嚴選超大去骨雞腿排，外皮金黃酥脆、鎖住肉汁，本店招牌人氣第一！",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
        isAvailable: true,
        specGroups: JSON.parse(JSON.stringify(TEMPLATE_BENTO))
      },
      {
        id: "dish-3",
        name: "萬華古早味冬瓜檸檬茶",
        price: 45,
        desc: "古法慢火熬煮冬瓜磚，搭配屏東現榨九如檸檬，生津止渴、去油解膩！",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
        isAvailable: true,
        specGroups: JSON.parse(JSON.stringify(TEMPLATE_DRINK))
      }
    ],
    orders: [
      {
        id: "ORD-8825",
        groupCode: "8825",
        address: "臺北市萬華區西門里內江街69號 3樓茶水間",
        hostName: "王小明 (5F設計部)",
        hostPhone: "0912-345-678",
        totalAmount: 1120,
        time: "11:15",
        status: "PREPARING",
        items: [
          { name: "酥炸厚切排骨便當", qty: 1, specs: "全小辣・切塊・正常飯量", notes: "不要香菜", addons: "雙拼現炸排骨" },
          { name: "酥炸厚切排骨便當", qty: 1, specs: "全小辣・切塊・正常飯量", notes: "不要香菜", addons: "加滷蛋 × 2" },
          { name: "酥炸厚切排骨便當", qty: 2, specs: "正常飯量", notes: "", addons: "加排骨" },
          { name: "酥炸厚切排骨便當", qty: 5, specs: "標準製作", notes: "", addons: "" }
        ]
      },
      {
        id: "ORD-8818",
        groupCode: "8818",
        address: "臺北市萬華區康定路25號 2樓行政部",
        hostName: "李經理",
        hostPhone: "0922-333-444",
        totalAmount: 380,
        time: "10:30",
        completedTime: "11:05",
        status: "DELIVERED",
        items: [
          { name: "招牌香酥雞腿便當", qty: 2, specs: "切塊・多胡椒鹽", notes: "", addons: "加滷蛋" }
        ]
      }
    ]
  };

  // 新店家預設空白沙盒資料
  const defaultNewProfile = {
    store: {
      storeName: "新進駐店家（請於註冊設定）",
      category: "中式便當・快餐",
      address: "臺北市萬華區內江街100號",
      phone: "02-23118888",
      isOpen: false,        // 嚴格休息中
      isOnboarding: true,   // 進入開店導引
      onboardingStep: 2,    // 步驟 2：上架第一道商品
      startTime: "09:00",
      stopTime: "18:00",
      capacityThreshold: 50,
      deliveryThreshold: 300,
      tierDiscounts: [
        { qty: 10, gift: "店家招牌飲料 1 壺" },
        { qty: 20, gift: "全單享 9 折優惠" }
      ]
    },
    menu: [], // 0 項餐點
    orders: [] // 0 筆訂單
  };

  // =========================================================================
  // 2. 雙軌沙盒管理器 (Sandbox Storage Manager)
  // =========================================================================

  let activeVendorMode = localStorage.getItem(KEY_ACTIVE_VENDOR) || "legacy";

  const getVendorData = (mode) => {
    const key = (mode === "legacy") ? KEY_LEGACY_DATA : KEY_NEW_DATA;
    const defaultData = (mode === "legacy") ? defaultLegacyProfile : defaultNewProfile;
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return JSON.parse(JSON.stringify(defaultData));
    }
    return JSON.parse(stored);
  };

  const saveVendorData = (mode, data) => {
    const key = (mode === "legacy") ? KEY_LEGACY_DATA : KEY_NEW_DATA;
    localStorage.setItem(key, JSON.stringify(data));
  };

  // 當前運作中的狀態參照
  let currentProfile = getVendorData(activeVendorMode);
  let storeState = currentProfile.store;
  let menuList = currentProfile.menu;
  let activeOrders = currentProfile.orders;

  let editingSpecGroups = JSON.parse(JSON.stringify(TEMPLATE_BENTO));

  const persistCurrentState = () => {
    currentProfile.store = storeState;
    currentProfile.menu = menuList;
    currentProfile.orders = activeOrders;
    saveVendorData(activeVendorMode, currentProfile);
  };

  // 切換運作模式
  const switchVendorMode = (targetMode) => {
    persistCurrentState();
    activeVendorMode = targetMode;
    localStorage.setItem(KEY_ACTIVE_VENDOR, activeVendorMode);
    currentProfile = getVendorData(activeVendorMode);
    storeState = currentProfile.store;
    menuList = currentProfile.menu;
    activeOrders = currentProfile.orders;
    renderAll();
  };

  // =========================================================================
  // 3. DOM 元素快取
  // =========================================================================

  const sectionAuth = document.getElementById("section-merchant-auth");
  const sectionDashboard = document.getElementById("section-merchant-dashboard");
  const tabBtnLogin = document.getElementById("tab-btn-login");
  const tabBtnRegister = document.getElementById("tab-btn-register");
  const formLoginView = document.getElementById("form-merchant-login-view");
  const formRegisterView = document.getElementById("form-merchant-register-view");
  const authLoginError = document.getElementById("auth-login-error");
  const authRegError = document.getElementById("auth-reg-error");
  const btnLogout = document.getElementById("btn-merchant-logout");

  const inputAuthAccount = document.getElementById("input-auth-account");
  const inputAuthPassword = document.getElementById("input-auth-password");
  const regStoreName = document.getElementById("reg-store-name");
  const regOwnerName = document.getElementById("reg-owner-name");
  const regPhone = document.getElementById("reg-phone");
  const regCategory = document.getElementById("reg-category");
  const regAddress = document.getElementById("reg-address");

  // 頂部沙盒標籤與切換
  const headerVendorModeTag = document.getElementById("header-vendor-mode-tag");
  const badgeVendorProfile = document.getElementById("badge-vendor-profile");
  const btnSwitchVendorQuick = document.getElementById("btn-switch-vendor-quick");

  // 開店導引精靈橫幅
  const merchantOnboardingBanner = document.getElementById("merchant-onboarding-banner");
  const onboardingStepCounter = document.getElementById("onboarding-step-counter");
  const onboardingTipText = document.getElementById("onboarding-tip-text");
  const obNode2 = document.getElementById("ob-node-2");
  const obLine2 = document.getElementById("ob-line-2");
  const obNode3 = document.getElementById("ob-node-3");
  const obLine3 = document.getElementById("ob-line-3");
  const obNode4 = document.getElementById("ob-node-4");

  const headerStoreBadge = document.getElementById("header-store-badge");
  const displayWelcomeTitle = document.getElementById("display-welcome-title");
  const displayStoreAddress = document.getElementById("display-store-address");
  const displayOperatingHours = document.getElementById("display-operating-hours");
  const businessPulseDot = document.getElementById("business-pulse-dot");
  const businessStatusLabel = document.getElementById("business-status-label");
  const btnToggleBusiness = document.getElementById("btn-toggle-business");

  const kpiMerchantOrders = document.getElementById("kpi-merchant-orders");
  const kpiMerchantDishes = document.getElementById("kpi-merchant-dishes");
  const kpiMerchantRevenue = document.getElementById("kpi-merchant-revenue");

  // 分頁元素
  const navTabs = document.querySelectorAll(".m-tab-btn");
  const panelOrders = document.getElementById("panel-orders");
  const panelHistory = document.getElementById("panel-history");
  const panelMenu = document.getElementById("panel-menu");
  const panelSettings = document.getElementById("panel-settings");

  const orderQueueStream = document.getElementById("order-queue-stream");
  const historyOrdersStream = document.getElementById("history-orders-stream");
  const btnMockIncoming = document.getElementById("btn-mock-incoming-order");
  const btnClearHistory = document.getElementById("btn-clear-history");
  const badgePendingCount = document.getElementById("badge-pending-count");
  const badgeHistoryCount = document.getElementById("badge-history-count");

  // 菜單與規格編輯
  const formDishEditor = document.getElementById("form-dish-editor");
  const menuFormHeading = document.getElementById("menu-form-heading");
  const inputEditDishId = document.getElementById("input-edit-dish-id");
  const inputDishName = document.getElementById("input-dish-name");
  const inputDishPrice = document.getElementById("input-dish-price");
  const inputDishDesc = document.getElementById("input-dish-desc");
  const inputDishFile = document.getElementById("input-dish-file");
  const inputDishImageData = document.getElementById("input-dish-image-data");
  const btnTriggerUpload = document.getElementById("btn-trigger-upload");
  const btnRemoveImage = document.getElementById("btn-remove-image");
  const fileNameHint = document.getElementById("file-name-hint");
  const dishPreviewWrap = document.getElementById("dish-preview-wrap");
  const customGroupsBuilder = document.getElementById("custom-groups-builder");
  const btnAddSpecGroup = document.getElementById("btn-add-spec-group");
  const btnTplBento = document.getElementById("btn-tpl-bento");
  const btnTplSnack = document.getElementById("btn-tpl-snack");
  const btnTplDrink = document.getElementById("btn-tpl-drink");
  const quickPresetChipsWrap = document.getElementById("quick-preset-chips-wrap");
  const dishCustomLivePreview = document.getElementById("dish-custom-live-preview");
  const btnCancelEditDish = document.getElementById("btn-cancel-edit-dish");
  const btnSubmitDish = document.getElementById("btn-submit-dish");
  const dishFormError = document.getElementById("dish-form-error");
  const menuItemsContainer = document.getElementById("menu-items-container");
  const displayMenuCount = document.getElementById("display-menu-count");

  // 供餐設定表單
  const formSettings = document.getElementById("form-merchant-settings");
  const setStartTime = document.getElementById("set-start-time");
  const setStopTime = document.getElementById("set-stop-time");
  const setCapacityThreshold = document.getElementById("set-capacity-threshold");
  const setDeliveryThreshold = document.getElementById("set-delivery-threshold");
  const settingsSaveMsg = document.getElementById("settings-save-msg");

  // 推播彈窗
  const modalIncomingOrder = document.getElementById("modal-incoming-order");
  const alertStoreSubtitle = document.getElementById("alert-store-subtitle");
  const alertAddress = document.getElementById("alert-address");
  const alertHost = document.getElementById("alert-host");
  const alertAmount = document.getElementById("alert-amount");
  const alertDishItems = document.getElementById("alert-dish-items");
  const btnRejectOrder = document.getElementById("btn-reject-order");
  const btnAcceptOrder = document.getElementById("btn-accept-order");
  const toastEl = document.getElementById("toast-merchant");

  let pendingPushOrder = null;

  // =========================================================================
  // 4. 輔助函式
  // =========================================================================

  const showToast = (message) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 3500);
  };

  const escapeHtml = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const cleanStr = (val) => {
    if (!val) return "";
    const s = String(val).trim();
    if (s === "無" || s === "無加料" || s === "無特殊忌口" || s === "正常") return "";
    return s;
  };

  const getNowTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const switchTab = (targetId) => {
    navTabs.forEach((b) => {
      const isMatch = (b.getAttribute("data-target") === targetId);
      b.classList.toggle("active", isMatch);
      b.setAttribute("aria-selected", isMatch ? "true" : "false");
    });
    [panelOrders, panelHistory, panelMenu, panelSettings].forEach((p) => {
      if (p) p.style.display = (p.id === targetId ? "block" : "none");
    });
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // =========================================================================
  // 5. 開店導航橫幅狀態渲染
  // =========================================================================

  const renderOnboardingUI = () => {
    if (!merchantOnboardingBanner) return;

    if (!storeState.isOnboarding) {
      merchantOnboardingBanner.style.display = "none";
      return;
    }

    merchantOnboardingBanner.style.display = "block";
    const step = storeState.onboardingStep;

    if (step === 2) {
      onboardingStepCounter.textContent = "步驟 1 / 2";
      obNode2.className = "onboarding-step-node current";
      obNode2.querySelector(".ob-node-circle").textContent = "2";
      obLine2.className = "onboarding-step-line";
      obNode3.className = "onboarding-step-node pending";
      obNode3.querySelector(".ob-node-circle").textContent = "3";
      obLine3.className = "onboarding-step-line";
      obNode4.className = "onboarding-step-node pending";

      onboardingTipText.innerHTML = `
        👉 <strong>步驟 1（上架首道餐點）：</strong> 新店家目前菜單為空，請在下方填寫餐點名稱、店內價與客製規格，完成後點擊<strong>「新增餐點（上架菜單）」</strong>。
      `;
    } else if (step === 3) {
      onboardingStepCounter.textContent = "步驟 2 / 2";
      obNode2.className = "onboarding-step-node completed";
      obNode2.querySelector(".ob-node-circle").textContent = "✓";
      obLine2.className = "onboarding-step-line active";
      obNode3.className = "onboarding-step-node current";
      obNode3.querySelector(".ob-node-circle").textContent = "3";
      obLine3.className = "onboarding-step-line";
      obNode4.className = "onboarding-step-node pending";

      onboardingTipText.innerHTML = `
        👉 <strong>步驟 2（設定供餐與門檻）：</strong> 恭喜上架首道餐點！請確認營業時段與起送金額，點擊<strong>「儲存供餐營運設定」</strong>即可正式開張接單！
      `;
    }
  };

  // =========================================================================
  // 6. 逐單解析與出餐條列
  // =========================================================================

  const parseSingleItem = (item) => {
    const rawSpecs = cleanStr(item.specs || item.flavorSpecs || "");
    const rawNotes = cleanStr(item.notes);
    const rawAddons = cleanStr(item.addons);
    const itemQty = parseInt(item.qty, 10) || 1;

    if (rawSpecs.includes("；") || (rawSpecs.includes("份") && rawSpecs.includes(";"))) {
      const parts = rawSpecs.split(/[；;]/);
      const results = [];
      parts.forEach((p) => {
        const match = p.match(/(\d+)\s*份\s*(.*)/);
        if (match) {
          results.push({
            name: item.name,
            qty: parseInt(match[1], 10) || 1,
            specs: cleanStr(match[2]) || "標準製作",
            notes: rawNotes,
            addons: rawAddons
          });
        }
      });
      if (results.length > 0) return results;
    }

    if (itemQty > 1 && rawAddons.includes("、") && rawAddons.includes("×")) {
      const addonParts = rawAddons.split(/[、,]/).map((s) => s.trim()).filter(Boolean);
      if (addonParts.length === itemQty) {
        return addonParts.map((singleAddon) => ({
          name: item.name,
          qty: 1,
          specs: rawSpecs || "標準製作",
          notes: rawNotes,
          addons: singleAddon
        }));
      }
    }

    return [
      {
        name: item.name,
        qty: itemQty,
        specs: rawSpecs || "標準製作",
        notes: rawNotes,
        addons: rawAddons
      }
    ];
  };

  const buildAggregatedItemsHtml = (items) => {
    const itemComboMap = {};

    items.forEach((item) => {
      const parsedList = parseSingleItem(item);
      parsedList.forEach((sub) => {
        const comboKey = `${sub.name.trim()}__${sub.specs.trim()}__${sub.notes.trim()}__${sub.addons.trim()}`;

        if (!itemComboMap[comboKey]) {
          itemComboMap[comboKey] = {
            name: sub.name,
            qty: 0,
            specs: sub.specs,
            notes: sub.notes,
            addons: sub.addons
          };
        }
        itemComboMap[comboKey].qty += sub.qty;
      });
    });

    const aggregated = Object.values(itemComboMap);
    aggregated.sort((a, b) => {
      const aStd = (a.specs === "標準製作" && !a.addons && !a.notes);
      const bStd = (b.specs === "標準製作" && !b.addons && !b.notes);
      if (aStd && !bStd) return 1;
      if (!aStd && bStd) return -1;
      return 0;
    });

    return aggregated.map((it) => {
      const parts = [];
      if (it.addons) parts.push(it.addons);
      if (it.specs && it.specs !== "標準製作") parts.push(it.specs);
      if (it.notes) parts.push(it.notes);

      const isStandard = parts.length === 0;
      const customText = isStandard ? "標準製作" : parts.join("、");

      return `
        <li class="dish-ticket-item ${isStandard ? 'is-standard-dish' : ''}">
          <span class="ticket-qty-badge">${it.qty} 份</span>
          <span class="ticket-dish-name">${escapeHtml(it.name)}</span>
          <span class="ticket-custom-text ${isStandard ? 'is-standard-text' : ''}">
            ${escapeHtml(customText)}
          </span>
        </li>
      `;
    }).join("");
  };

  // =========================================================================
  // 7. 排程隊列渲染（已完成自動移入歷史）
  // =========================================================================

  const renderOrderQueueStream = () => {
    orderQueueStream.innerHTML = "";

    const pendingOrders = activeOrders.filter((o) => o.status !== "DELIVERED");
    badgePendingCount.textContent = pendingOrders.length;

    if (pendingOrders.length === 0) {
      orderQueueStream.innerHTML = `
        <div class="empty-queue-notice card-box">
          <span class="empty-icon">🍳</span>
          <h3>目前尚無製作中訂單</h3>
          <p>${activeVendorMode === "new" ? "新店家完成商品上架並開啟接單後，即可接收團單..." : "所有訂單皆已出餐完成並歸入「歷史訂單」，等候新團單進來..."}</p>
        </div>
      `;
      return;
    }

    pendingOrders.forEach((order, queueIndex) => {
      let orderTotalDishes = 0;
      order.items.forEach((item) => {
        const list = parseSingleItem(item);
        list.forEach((sub) => (orderTotalDishes += sub.qty));
      });

      let statusBadgeHtml = "";
      let actionBtnHtml = "";

      if (order.status === "PREPARING") {
        statusBadgeHtml = `<span class="queue-status-pill pill-preparing">🍳 廚房製作中</span>`;
        actionBtnHtml = `
          <button type="button" class="btn btn-secondary btn-advance-order" data-id="${order.id}" data-next="DELIVERING">
            🛵 本單製作完成，出發外送 →
          </button>
        `;
      } else if (order.status === "DELIVERING") {
        statusBadgeHtml = `<span class="queue-status-pill pill-delivering">🛵 店家自送途中</span>`;
        actionBtnHtml = `
          <button type="button" class="btn btn-primary btn-advance-order" data-id="${order.id}" data-next="DELIVERED">
            ✓ 已送達交單給召集人（完成並移至歷史）
          </button>
        `;
      }

      const itemRowsHtml = buildAggregatedItemsHtml(order.items);

      const orderCard = document.createElement("div");
      orderCard.className = "order-queue-card card-box";
      orderCard.innerHTML = `
        <div class="queue-card-top-header">
          <div class="queue-priority-group">
            <span class="queue-priority-tag">製作序號 #${queueIndex + 1}</span>
            <span class="group-code-pill">團號 #${order.groupCode}</span>
            <span class="order-time-text">🕒 進單時間：${order.time || "11:20"}</span>
          </div>
          ${statusBadgeHtml}
        </div>

        <div class="queue-meta-strip">
          <div class="meta-strip-item">
            <span class="meta-k">送餐地點：</span>
            <strong class="meta-v loc-highlight">${escapeHtml(order.address)}</strong>
          </div>
          <div class="meta-strip-item">
            <span class="meta-k">召集人：</span>
            <strong class="meta-v">${escapeHtml(order.hostName)}</strong>（${escapeHtml(order.hostPhone)}）
          </div>
          <div class="meta-strip-item">
            <span class="meta-k">應收總額：</span>
            <strong class="meta-v text-price">NT$ ${order.totalAmount}</strong>（自送現場收款）
          </div>
        </div>

        <div class="queue-items-body">
          <div class="body-label-row">
            <span class="body-label">📋 餐點製作明細：</span>
            <span class="body-summary-count">本單共 <strong>${orderTotalDishes}</strong> 份餐點</span>
          </div>
          <ul class="dish-ticket-list">
            ${itemRowsHtml}
          </ul>
        </div>

        <div class="queue-card-bottom-actions">
          ${actionBtnHtml}
        </div>
      `;
      orderQueueStream.appendChild(orderCard);
    });

    orderQueueStream.querySelectorAll(".btn-advance-order").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const orderId = e.currentTarget.getAttribute("data-id");
        const nextState = e.currentTarget.getAttribute("data-next");
        const targetOrder = activeOrders.find((o) => o.id === orderId);

        if (targetOrder) {
          targetOrder.status = nextState;
          if (nextState === "DELIVERED") {
            targetOrder.completedTime = getNowTimeString();
          }

          persistCurrentState();
          renderOrderQueueStream();
          renderHistoryOrdersStream();
          renderKPI();

          if (nextState === "DELIVERING") {
            showToast(`訂單 #${targetOrder.groupCode} 已切換為「自送出發」！`);
          } else if (nextState === "DELIVERED") {
            showToast(`✓ 訂單 #${targetOrder.groupCode} 已順利完成！已自排程中移出，並歸檔至歷史訂單。`);
          }
        }
      });
    });
  };

  // =========================================================================
  // 8. 歷史訂單歸檔渲染
  // =========================================================================

  const renderHistoryOrdersStream = () => {
    historyOrdersStream.innerHTML = "";

    const historyOrders = activeOrders.filter((o) => o.status === "DELIVERED");
    badgeHistoryCount.textContent = historyOrders.length;

    if (historyOrders.length === 0) {
      historyOrdersStream.innerHTML = `
        <div class="empty-queue-notice card-box">
          <span class="empty-icon">📜</span>
          <h3>目前尚無歷史完成訂單</h3>
          <p>進行中的訂單在點擊「已送達交單」後，會自動歸檔於此處供查閱。</p>
        </div>
      `;
      return;
    }

    historyOrders.forEach((order) => {
      let orderTotalDishes = 0;
      order.items.forEach((item) => {
        const list = parseSingleItem(item);
        list.forEach((sub) => (orderTotalDishes += sub.qty));
      });

      const itemRowsHtml = buildAggregatedItemsHtml(order.items);

      const card = document.createElement("div");
      card.className = "order-queue-card card-box is-order-done";
      card.innerHTML = `
        <div class="queue-card-top-header">
          <div class="queue-priority-group">
            <span class="queue-status-pill pill-delivered">✓ 已送達完成</span>
            <span class="group-code-pill">團號 #${order.groupCode}</span>
            <span class="order-time-text">🕒 進單：${order.time || "11:20"} ｜ ✨ 完成：${order.completedTime || "今日"}</span>
          </div>
          <span class="text-completed-hint">已收款完成</span>
        </div>

        <div class="queue-meta-strip">
          <div class="meta-strip-item">
            <span class="meta-k">送餐地點：</span>
            <strong class="meta-v">${escapeHtml(order.address)}</strong>
          </div>
          <div class="meta-strip-item">
            <span class="meta-k">召集人：</span>
            <strong class="meta-v">${escapeHtml(order.hostName)}</strong>（${escapeHtml(order.hostPhone)}）
          </div>
          <div class="meta-strip-item">
            <span class="meta-k">訂單實收：</span>
            <strong class="meta-v text-price">NT$ ${order.totalAmount}</strong>
          </div>
        </div>

        <div class="queue-items-body">
          <div class="body-label-row">
            <span class="body-label">📋 餐點出餐清單紀錄：</span>
            <span class="body-summary-count">共 <strong>${orderTotalDishes}</strong> 份</span>
          </div>
          <ul class="dish-ticket-list">
            ${itemRowsHtml}
          </ul>
        </div>
      `;
      historyOrdersStream.appendChild(card);
    });
  };

  btnClearHistory?.addEventListener("click", () => {
    const historyCount = activeOrders.filter((o) => o.status === "DELIVERED").length;
    if (historyCount === 0) {
      alert("目前沒有歷史訂單可清除！");
      return;
    }
    if (confirm(`確定要清空這 ${historyCount} 筆已完成的歷史訂單紀錄嗎？（進行中的排程將會保留）`)) {
      activeOrders = activeOrders.filter((o) => o.status !== "DELIVERED");
      persistCurrentState();
      renderHistoryOrdersStream();
      renderKPI();
      showToast("已成功清空所有歷史訂單紀錄。");
    }
  });

  // =========================================================================
  // 9. 頂部 KPI 統計計算
  // =========================================================================

  const renderKPI = () => {
    const pendingOrders = activeOrders.filter((o) => o.status !== "DELIVERED");
    kpiMerchantOrders.textContent = pendingOrders.length;

    let pendingDishes = 0;
    let totalRev = 0;

    activeOrders.forEach((o) => {
      totalRev += o.totalAmount;
      if (o.status !== "DELIVERED") {
        o.items.forEach((it) => {
          const list = parseSingleItem(it);
          list.forEach((sub) => (pendingDishes += sub.qty));
        });
      }
    });

    kpiMerchantDishes.textContent = pendingDishes;
    kpiMerchantRevenue.textContent = totalRev.toLocaleString();
  };

  // =========================================================================
  // 10. 新訂單推播彈窗（防呆機制）
  // =========================================================================

  const showIncomingOrderModal = (orderData) => {
    if (menuList.length === 0) {
      alert("⚠️ 線上菜單尚無任何餐點，門市無法接收訂單！請先新增餐點。");
      switchTab("panel-menu");
      return;
    }
    if (!storeState.isOpen) {
      alert("⚠️ 目前門市處於「休息中（暫停接單）」狀態，無法接收訂單！請先至上方點擊「開始接單」。");
      return;
    }

    pendingPushOrder = orderData;
    if (alertStoreSubtitle) {
      alertStoreSubtitle.textContent = `${storeState.storeName} 專屬團單即時推播`;
    }
    alertAddress.textContent = orderData.address;
    alertHost.textContent = `${orderData.hostName} (${orderData.hostPhone})`;
    alertAmount.textContent = `NT$ ${orderData.totalAmount}`;

    alertDishItems.innerHTML = orderData.items.map((it) => {
      const parsed = parseSingleItem(it);
      return parsed.map((p) => {
        const parts = [];
        if (p.addons) parts.push(p.addons);
        if (p.specs && p.specs !== "標準製作") parts.push(p.specs);
        if (p.notes) parts.push(p.notes);
        const desc = parts.length > 0 ? parts.join("、") : "標準製作";

        return `
          <li style="margin-bottom: 6px; font-size: 0.95rem;">
            <strong>${p.qty} 份</strong> ${escapeHtml(it.name)} <span style="color:#555;">${escapeHtml(desc)}</span>
          </li>
        `;
      }).join("");
    }).join("");

    modalIncomingOrder.classList.add("active");
    modalIncomingOrder.setAttribute("aria-hidden", "false");
  };

  const closeIncomingModal = () => {
    modalIncomingOrder.classList.remove("active");
    modalIncomingOrder.setAttribute("aria-hidden", "true");
    pendingPushOrder = null;
  };

  btnRejectOrder?.addEventListener("click", () => {
    if (confirm("確認婉拒此訂單嗎？")) {
      closeIncomingModal();
      showToast("已婉拒該筆團單。");
    }
  });

  btnAcceptOrder?.addEventListener("click", () => {
    if (pendingPushOrder) {
      if (menuList.length === 0 || !storeState.isOpen) {
        alert("⚠️ 門市尚未上架餐點或已暫停接單，無法完成接單！");
        closeIncomingModal();
        return;
      }
      activeOrders.push({ ...pendingPushOrder, status: "PREPARING" });
      persistCurrentState();
      closeIncomingModal();
      renderOrderQueueStream();
      renderKPI();
      showToast(`已成功接單！已排入製作排程隊列。`);
    }
  });

  btnMockIncoming?.addEventListener("click", () => {
    if (menuList.length === 0) {
      alert("⚠️ 線上菜單尚無任何上架餐點，門市無法接收訂單！\n請先前往「餐點與菜單管理」上架餐點。");
      switchTab("panel-menu");
      return;
    }
    if (!storeState.isOpen) {
      alert("⚠️ 目前門市處於「休息中（暫停接單）」，無法接收訂單！請先在頂部點擊「開始接單」恢復營業。");
      return;
    }

    // 依據當前店家的菜單動態生成模擬訂單
    const randomDish = menuList[Math.floor(Math.random() * menuList.length)];
    const mockCode = Math.floor(1000 + Math.random() * 9000);
    const mockNew = {
      id: "ORD-" + mockCode,
      groupCode: String(mockCode),
      address: "臺北市萬華區內江街19號 4樓企劃組",
      hostName: "陳經理",
      hostPhone: "0988-123-456",
      totalAmount: randomDish.price * 3,
      time: getNowTimeString(),
      items: [
        { name: randomDish.name, qty: 3, specs: "標準製作", notes: "醬汁分開裝", addons: "" }
      ]
    };
    showIncomingOrderModal(mockNew);
  });

  // =========================================================================
  // 11. 菜單管理與規格建造
  // =========================================================================

  const renderQuickPresetChips = () => {
    if (!quickPresetChipsWrap) return;
    quickPresetChipsWrap.innerHTML = "";

    PRESET_QUICK_CHIPS.forEach((chip) => {
      const chipBtn = document.createElement("button");
      chipBtn.type = "button";
      chipBtn.className = "quick-chip-btn";
      chipBtn.innerHTML = `+ ${chip.name} ${chip.price > 0 ? `<small>(+$${chip.price})</small>` : ""}`;
      chipBtn.addEventListener("click", () => {
        if (editingSpecGroups.length === 0) {
          editingSpecGroups.push({
            id: "grp-" + Date.now(),
            title: "客製偏好",
            type: chip.price > 0 ? "multiple" : "single",
            required: false,
            options: []
          });
        }
        const lastGroup = editingSpecGroups[editingSpecGroups.length - 1];
        lastGroup.options.push({ name: chip.name, price: chip.price });
        renderSpecGroupsBuilder();
        showToast(`已將「${chip.name}」加入【${lastGroup.title}】！`);
      });
      quickPresetChipsWrap.appendChild(chipBtn);
    });
  };

  const renderSpecGroupsBuilder = () => {
    customGroupsBuilder.innerHTML = "";

    if (editingSpecGroups.length === 0) {
      customGroupsBuilder.innerHTML = `
        <div class="empty-spec-hint">
          <span>目前無客製化規格，請點選上方範本或快捷標籤快速加入！</span>
        </div>
      `;
      renderLivePreview();
      return;
    }

    editingSpecGroups.forEach((group, gIndex) => {
      const groupCard = document.createElement("div");
      groupCard.className = "spec-group-card";
      groupCard.innerHTML = `
        <div class="spec-group-header">
          <div class="group-title-input-wrap">
            <span class="group-num-badge">分組 ${gIndex + 1}</span>
            <input 
              type="text" 
              class="form-control form-control-sm input-group-title" 
              value="${escapeHtml(group.title)}" 
              placeholder="分組名稱"
              data-gindex="${gIndex}"
            >
          </div>
          <div class="group-type-selector">
            <label class="type-radio-label">
              <input type="radio" name="type-${group.id}" value="single" ${group.type === "single" ? "checked" : ""} data-gindex="${gIndex}">
              <span>單選（必填一項）</span>
            </label>
            <label class="type-radio-label">
              <input type="radio" name="type-${group.id}" value="multiple" ${group.type === "multiple" ? "checked" : ""} data-gindex="${gIndex}">
              <span>複選（自由加購）</span>
            </label>
            <button type="button" class="btn-delete-group" data-gindex="${gIndex}" title="刪除此分組">&times;</button>
          </div>
        </div>

        <div class="spec-options-list">
          <div class="spec-options-header">
            <span>選項名稱</span>
            <span>加價金額 (NT$)</span>
            <span>操作</span>
          </div>
          <div class="options-rows-wrap" id="options-wrap-${gIndex}">
            ${group.options.map((opt, oIndex) => `
              <div class="spec-option-row">
                <input 
                  type="text" 
                  class="form-control form-control-sm input-opt-name" 
                  value="${escapeHtml(opt.name)}" 
                  placeholder="選項名稱" 
                  data-gindex="${gIndex}" 
                  data-oindex="${oIndex}"
                >
                <div class="input-opt-price-wrap">
                  <span class="currency-prefix">+NT$</span>
                  <input 
                    type="number" 
                    class="form-control form-control-sm input-opt-price" 
                    value="${opt.price || 0}" 
                    min="0" 
                    step="5" 
                    data-gindex="${gIndex}" 
                    data-oindex="${oIndex}"
                  >
                </div>
                <button type="button" class="btn-remove-opt-row" data-gindex="${gIndex}" data-oindex="${oIndex}" title="移除此選項">&times;</button>
              </div>
            `).join("")}
          </div>
          <button type="button" class="btn btn-ghost btn-xs btn-add-opt-item" data-gindex="${gIndex}">
            + 新增「${escapeHtml(group.title || "此分組")}」的新選項
          </button>
        </div>
      `;
      customGroupsBuilder.appendChild(groupCard);
    });

    bindBuilderEvents();
    renderLivePreview();
  };

  const bindBuilderEvents = () => {
    customGroupsBuilder.querySelectorAll(".input-group-title").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const gIdx = parseInt(e.target.getAttribute("data-gindex"), 10);
        editingSpecGroups[gIdx].title = e.target.value;
        renderLivePreview();
      });
    });

    customGroupsBuilder.querySelectorAll("input[type=radio]").forEach((rad) => {
      rad.addEventListener("change", (e) => {
        const gIdx = parseInt(e.target.getAttribute("data-gindex"), 10);
        editingSpecGroups[gIdx].type = e.target.value;
        editingSpecGroups[gIdx].required = (e.target.value === "single");
        renderLivePreview();
      });
    });

    customGroupsBuilder.querySelectorAll(".btn-delete-group").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const gIdx = parseInt(e.currentTarget.getAttribute("data-gindex"), 10);
        editingSpecGroups.splice(gIdx, 1);
        renderSpecGroupsBuilder();
      });
    });

    customGroupsBuilder.querySelectorAll(".input-opt-name").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const gIdx = parseInt(e.target.getAttribute("data-gindex"), 10);
        const oIdx = parseInt(e.target.getAttribute("data-oindex"), 10);
        editingSpecGroups[gIdx].options[oIdx].name = e.target.value;
        renderLivePreview();
      });
    });

    customGroupsBuilder.querySelectorAll(".input-opt-price").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const gIdx = parseInt(e.target.getAttribute("data-gindex"), 10);
        const oIdx = parseInt(e.target.getAttribute("data-oindex"), 10);
        editingSpecGroups[gIdx].options[oIdx].price = parseInt(e.target.value, 10) || 0;
        renderLivePreview();
      });
    });

    customGroupsBuilder.querySelectorAll(".btn-remove-opt-row").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const gIdx = parseInt(e.currentTarget.getAttribute("data-gindex"), 10);
        const oIdx = parseInt(e.currentTarget.getAttribute("data-oindex"), 10);
        editingSpecGroups[gIdx].options.splice(oIdx, 1);
        renderSpecGroupsBuilder();
      });
    });

    customGroupsBuilder.querySelectorAll(".btn-add-opt-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const gIdx = parseInt(e.currentTarget.getAttribute("data-gindex"), 10);
        editingSpecGroups[gIdx].options.push({ name: "新客製項目", price: 0 });
        renderSpecGroupsBuilder();
      });
    });
  };

  const renderLivePreview = () => {
    if (!dishCustomLivePreview) return;
    const basePrice = parseInt(inputDishPrice.value, 10) || 120;
    const dishTitle = inputDishName.value.trim() || "未命名餐點";

    if (editingSpecGroups.length === 0) {
      dishCustomLivePreview.innerHTML = `
        <div class="preview-dish-header">
          <strong>${escapeHtml(dishTitle)}</strong>
          <span class="preview-price">NT$ ${basePrice}</span>
        </div>
        <p class="preview-none-text">無特殊客製化選項（標準製作出餐）</p>
      `;
      return;
    }

    let html = `
      <div class="preview-dish-header">
        <strong>${escapeHtml(dishTitle)}</strong>
        <span class="preview-price">NT$ ${basePrice} 起</span>
      </div>
    `;

    editingSpecGroups.forEach((group) => {
      html += `
        <div class="preview-group-block">
          <div class="preview-group-label">
            <span>${escapeHtml(group.title || "未命名分組")}</span>
            <span class="preview-type-badge">${group.type === "single" ? "必選・單選" : "自由加購・可複選"}</span>
          </div>
          <div class="preview-chips-row">
            ${group.options.map((opt, i) => `
              <span class="preview-opt-chip ${group.type === 'single' && i === 0 ? 'is-selected' : ''}">
                ${group.type === "single" ? (i === 0 ? "● " : "○ ") : "□ "}
                ${escapeHtml(opt.name || "未命名")}
                ${opt.price > 0 ? `<strong class="preview-plus-price">+NT$${opt.price}</strong>` : ""}
              </span>
            `).join("")}
          </div>
        </div>
      `;
    });

    dishCustomLivePreview.innerHTML = html;
  };

  inputDishName?.addEventListener("input", renderLivePreview);
  inputDishPrice?.addEventListener("input", renderLivePreview);

  btnTplBento?.addEventListener("click", () => {
    editingSpecGroups = JSON.parse(JSON.stringify(TEMPLATE_BENTO));
    renderSpecGroupsBuilder();
    showToast("已成功套用「🍱 便當常用規格範本」！");
  });

  btnTplSnack?.addEventListener("click", () => {
    editingSpecGroups = JSON.parse(JSON.stringify(TEMPLATE_SNACK));
    renderSpecGroupsBuilder();
    showToast("已成功套用「🥢 小吃炸物調味範本」！");
  });

  btnTplDrink?.addEventListener("click", () => {
    editingSpecGroups = JSON.parse(JSON.stringify(TEMPLATE_DRINK));
    renderSpecGroupsBuilder();
    showToast("已成功套用「🧋 飲料經典規格範本」！");
  });

  btnAddSpecGroup?.addEventListener("click", () => {
    editingSpecGroups.push({
      id: "grp-" + Date.now(),
      title: "自訂規格分組",
      type: "single",
      required: true,
      options: [
        { name: "選項 A", price: 0 },
        { name: "選項 B", price: 0 }
      ]
    });
    renderSpecGroupsBuilder();
  });

  // 輔助函式：將圖片等比例壓縮至 500x500 內並轉為輕量 Base64
  const processAndCompressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85)); // 輸出輕量 JPEG
        };
        img.onerror = () => reject(new Error("圖片載入解析失敗"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("檔案讀取失敗"));
      reader.readAsDataURL(file);
    });
  };

  // 點擊「選擇本機圖片檔案」觸發隱藏的 input[type=file]
  btnTriggerUpload?.addEventListener("click", () => {
    inputDishFile?.click();
  });

  // 使用者選擇圖片後，自動壓縮並預覽
  inputDishFile?.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("請選擇有效的圖片檔案（支援 JPG、PNG 或 WebP）！");
      return;
    }

    try {
      const compressedBase64 = await processAndCompressImage(file);
      inputDishImageData.value = compressedBase64; // 寫入隱藏欄位
      
      // 即時預覽
      dishPreviewWrap.innerHTML = `<img src="${compressedBase64}" alt="預覽" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
      if (btnRemoveImage) btnRemoveImage.style.display = "inline-block";
      if (fileNameHint) fileNameHint.textContent = `已選取：${file.name}（已自動最佳化）`;
      
      showToast("圖片上傳並完成最佳化！");
    } catch (err) {
      console.error(err);
      showToast("圖片處理失敗，請重試！");
    }
  });

  // 點擊「✕ 移除圖片」清除設定
  btnRemoveImage?.addEventListener("click", () => {
    if (inputDishFile) inputDishFile.value = "";
    if (inputDishImageData) inputDishImageData.value = "";
    dishPreviewWrap.innerHTML = `<span class="preview-placeholder">🍱</span>`;
    if (btnRemoveImage) btnRemoveImage.style.display = "none";
    if (fileNameHint) fileNameHint.textContent = "支援 JPG、PNG、WebP，系統將自動進行輕量縮圖最佳化";
    showToast("已清除自訂圖片。");
  });

  const renderMenuList = () => {
    menuItemsContainer.innerHTML = "";
    displayMenuCount.textContent = `共 ${menuList.length} 項餐點`;

    if (menuList.length === 0) {
      menuItemsContainer.innerHTML = `
        <div class="empty-state-notice">
          <span>🍲 目前菜單尚無餐點，請由左側新增！</span>
        </div>
      `;
      return;
    }

    menuList.forEach((dish) => {
      const card = document.createElement("article");
      card.className = `dish-card-item ${dish.isAvailable ? "" : "is-sold-out"}`;

      let specsHtml = "";
      if (dish.specGroups && dish.specGroups.length > 0) {
        specsHtml = dish.specGroups.map((g) => `
          <div class="dish-spec-group-row">
            <span class="spec-label-title">${escapeHtml(g.title)}：</span>
            <div class="spec-pills-list">
              ${g.options.map((opt) => `
                <span class="spec-pill ${opt.price > 0 ? 'spec-pill--addon' : 'spec-pill--normal'}">
                  ${escapeHtml(opt.name)}${opt.price > 0 ? ` (+NT$${opt.price})` : ""}
                </span>
              `).join("")}
            </div>
          </div>
        `).join("");
      } else {
        specsHtml = `<span class="text-muted" style="font-size:0.8rem;">標準製作出餐</span>`;
      }

      card.innerHTML = `
        <div class="dish-card-media">
          <img src="${escapeHtml(dish.image)}" alt="${escapeHtml(dish.name)}" class="dish-thumb" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';">
          <span class="availability-badge ${dish.isAvailable ? "badge-available" : "badge-sold"}">
            ${dish.isAvailable ? "供應中" : "已售罄"}
          </span>
        </div>
        <div class="dish-card-info">
          <div class="dish-header-row">
            <h4 class="dish-item-name">${escapeHtml(dish.name)}</h4>
            <span class="dish-item-price">NT$ ${dish.price}</span>
          </div>
          <p class="dish-item-desc">${escapeHtml(dish.desc)}</p>
          <div class="dish-specs-block">${specsHtml}</div>
          <div class="dish-item-actions">
            <label class="toggle-availability-label">
              <input type="checkbox" class="chk-toggle-dish" data-id="${dish.id}" ${dish.isAvailable ? "checked" : ""}>
              <span>${dish.isAvailable ? "正常供應" : "暫停供應"}</span>
            </label>
            <div class="dish-btn-group">
              <button type="button" class="btn btn-ghost btn-sm btn-edit-dish" data-id="${dish.id}">編輯規格</button>
              <button type="button" class="btn btn-ghost btn-sm text-danger btn-delete-dish" data-id="${dish.id}">刪除</button>
            </div>
          </div>
        </div>
      `;
      menuItemsContainer.appendChild(card);
    });

    menuItemsContainer.querySelectorAll(".chk-toggle-dish").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const dishId = e.target.getAttribute("data-id");
        const targetDish = menuList.find((d) => d.id === dishId);
        if (targetDish) {
          targetDish.isAvailable = e.target.checked;
          persistCurrentState();
          renderMenuList();
          showToast(`「${targetDish.name}」已更新為：${targetDish.isAvailable ? "供應中" : "已售罄"}`);
        }
      });
    });

    menuItemsContainer.querySelectorAll(".btn-edit-dish").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dishId = e.target.getAttribute("data-id");
        const targetDish = menuList.find((d) => d.id === dishId);
        if (targetDish) {
          inputEditDishId.value = targetDish.id;
          inputDishName.value = targetDish.name;
          inputDishPrice.value = targetDish.price;
          inputDishDesc.value = targetDish.desc;
          if (targetDish.image) {
            inputDishImageData.value = targetDish.image;
            dishPreviewWrap.innerHTML = `<img src="${escapeHtml(targetDish.image)}" alt="預覽" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.parentElement.innerHTML='🍱';">`;
            if (btnRemoveImage) btnRemoveImage.style.display = "inline-block";
            if (fileNameHint) fileNameHint.textContent = "目前已使用自訂餐點圖片（點擊按鈕可更換）";
          } else {
            inputDishImageData.value = "";
            dishPreviewWrap.innerHTML = `<span class="preview-placeholder">🍱</span>`;
            if (btnRemoveImage) btnRemoveImage.style.display = "none";
            if (fileNameHint) fileNameHint.textContent = "未上傳圖片（將套用預設美味圖示）";
          }
          editingSpecGroups = targetDish.specGroups ? JSON.parse(JSON.stringify(targetDish.specGroups)) : [];
          if (inputDishFile) inputDishFile.value = "";

          renderSpecGroupsBuilder();
          menuFormHeading.textContent = `編輯餐點：${targetDish.name}`;
          btnSubmitDish.textContent = "儲存規格與餐點修改";
          btnCancelEditDish.style.display = "inline-block";
          window.scrollTo({ top: formDishEditor.offsetTop - 80, behavior: "smooth" });
        }
      });
    });

    menuItemsContainer.querySelectorAll(".btn-delete-dish").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dishId = e.target.getAttribute("data-id");
        const targetDish = menuList.find((d) => d.id === dishId);
        if (targetDish && confirm(`確定要從線上菜單刪除「${targetDish.name}」嗎？`)) {
          menuList = menuList.filter((d) => d.id !== dishId);
          
          if (menuList.length === 0) {
            storeState.isOpen = false;
            updateBusinessStatusUI();
            showToast(`已刪除「${targetDish.name}」。線上菜單已無餐點，系統已自動暫停接單！`);
          } else {
            showToast(`已刪除「${targetDish.name}」。`);
          }

          persistCurrentState();
          renderMenuList();
        }
      });
    });
  };

  btnCancelEditDish?.addEventListener("click", () => {
    formDishEditor.reset();
    inputEditDishId.value = "";
    editingSpecGroups = JSON.parse(JSON.stringify(TEMPLATE_BENTO));
    if (inputDishFile) inputDishFile.value = "";
    if (inputDishImageData) inputDishImageData.value = "";
    dishPreviewWrap.innerHTML = `<span class="preview-placeholder">🍱</span>`;
    if (btnRemoveImage) btnRemoveImage.style.display = "none";
    if (fileNameHint) fileNameHint.textContent = "支援 JPG、PNG、WebP，系統將自動進行輕量縮圖最佳化";
    
    renderSpecGroupsBuilder();
    dishPreviewWrap.innerHTML = `<span class="preview-placeholder">🍱</span>`;
    renderSpecGroupsBuilder();
    menuFormHeading.textContent = "新增餐點";
    btnSubmitDish.textContent = "新增餐點（上架菜單）";
    btnCancelEditDish.style.display = "none";
    dishFormError.style.display = "none";
  });

  formDishEditor?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = inputDishName.value.trim();
    const price = parseInt(inputDishPrice.value, 10);
    const desc = inputDishDesc.value.trim();
    const image = inputDishImageData.value.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";    const editId = inputEditDishId.value.trim();

    if (!name || isNaN(price) || price <= 0 || !desc) {
      dishFormError.style.display = "block";
      dishFormError.textContent = "請完整填寫餐點名稱、正確基礎價格與美味描述！";
      return;
    }

    dishFormError.style.display = "none";

    const cleanGroups = editingSpecGroups
      .filter((g) => g.title && g.title.trim().length > 0)
      .map((g) => ({
        ...g,
        options: g.options.filter((o) => o.name && o.name.trim().length > 0)
      }));

    if (editId) {
      const targetDish = menuList.find((d) => d.id === editId);
      if (targetDish) {
        targetDish.name = name;
        targetDish.price = price;
        targetDish.desc = desc;
        targetDish.image = image;
        targetDish.specGroups = cleanGroups;
        showToast(`已成功更新餐點：「${name}」的客製化規格！`);
      }
    } else {
      const newDish = {
        id: "dish-" + Date.now(),
        name,
        price,
        desc,
        image,
        isAvailable: true,
        specGroups: cleanGroups
      };
      menuList.push(newDish);

      // 新店家開店導引流程推進
      if (storeState.isOnboarding && storeState.onboardingStep === 2) {
        storeState.onboardingStep = 3;
        persistCurrentState();
        renderMenuList();
        renderOnboardingUI();
        btnCancelEditDish.click();

        showToast(`🎉 成功上架首道餐點【${name}】！接著進行供餐與門檻設定...`);
        setTimeout(() => {
          switchTab("panel-settings");
        }, 1200);
        return;
      }

      showToast(`餐點「${name}」已成功新增至線上菜單！`);
    }

    persistCurrentState();
    renderMenuList();
    updateBusinessStatusUI();
    btnCancelEditDish.click();
  });

  // =========================================================================
  // 12. 登入與合作註冊（雙軌隔離綁定）
  // =========================================================================

  tabBtnLogin?.addEventListener("click", () => {
    tabBtnLogin.classList.add("active");
    tabBtnRegister.classList.remove("active");
    formLoginView.style.display = "block";
    formRegisterView.style.display = "none";
    if (authLoginError) authLoginError.style.display = "none";
    if (authRegError) authRegError.style.display = "none";
  });

  tabBtnRegister?.addEventListener("click", () => {
    tabBtnRegister.classList.add("active");
    tabBtnLogin.classList.remove("active");
    formRegisterView.style.display = "block";
    formLoginView.style.display = "none";
    if (authLoginError) authLoginError.style.display = "none";
    if (authRegError) authRegError.style.display = "none";
  });

  // 1. 既有店家登入
  formLoginView?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (authLoginError) {
      authLoginError.style.display = "none";
      authLoginError.textContent = "";
    }

    const account = inputAuthAccount?.value.trim();
    const password = inputAuthPassword?.value.trim();

    if (!account) {
      authLoginError.textContent = "請輸入商家帳號或店家代號！";
      authLoginError.style.display = "block";
      inputAuthAccount?.focus();
      return;
    }

    if (!password) {
      authLoginError.textContent = "請輸入登入密碼！";
      authLoginError.style.display = "block";
      inputAuthPassword?.focus();
      return;
    }

    // 檢查帳號所屬的模式：若輸入 store01 載入舊廠商，否則若為新註冊名稱載入新沙盒
    const targetMode = (account === "store01") ? "legacy" : "new";
    switchVendorMode(targetMode);

    sectionAuth.style.display = "none";
    sectionDashboard.style.display = "block";

    if (targetMode === "legacy") {
      showToast(`歡迎回來，${storeState.storeName}！（已載入舊廠商完整運營資料）`);
      switchTab("panel-orders");
    } else {
      showToast(`已登入新進駐店家【${storeState.storeName}】！（獨立沙盒資料）`);
      if (menuList.length === 0) {
        switchTab("panel-menu");
      } else {
        switchTab("panel-orders");
      }
    }
  });

  // 2. 新店家合作註冊（建立完全獨立的空白沙盒）
  formRegisterView?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (authRegError) {
      authRegError.style.display = "none";
      authRegError.textContent = "";
    }

    const storeName = regStoreName?.value.trim();
    const ownerName = regOwnerName?.value.trim();
    const phone = regPhone?.value.trim();
    const category = regCategory?.value;
    const address = regAddress?.value.trim();

    if (!storeName) {
      authRegError.textContent = "請填寫店家名稱！";
      authRegError.style.display = "block";
      regStoreName?.focus();
      return;
    }

    if (!ownerName) {
      authRegError.textContent = "請填寫負責人姓名！";
      authRegError.style.display = "block";
      regOwnerName?.focus();
      return;
    }

    if (!phone) {
      authRegError.textContent = "請填寫連絡電話或手機！";
      authRegError.style.display = "block";
      regPhone?.focus();
      return;
    }

    if (!address) {
      authRegError.textContent = "請填寫門市實體地址！";
      authRegError.style.display = "block";
      regAddress?.focus();
      return;
    }

    // 初始化全新獨立店家資料（不觸碰舊廠商資料）
    const freshNewProfile = {
      store: {
        storeName: storeName,
        category: category,
        address: address,
        phone: phone,
        isOpen: false,        // 嚴格關閉接單
        isOnboarding: true,   // 啟動開店引導
        onboardingStep: 2,    // 步驟 2：上架第一道商品
        startTime: "09:00",
        stopTime: "18:00",
        capacityThreshold: 50,
        deliveryThreshold: 300,
        tierDiscounts: [
          { qty: 10, gift: "店家招牌飲料 1 壺" },
          { qty: 20, gift: "全單享 9 折優惠" }
        ]
      },
      menu: [],   // 乾淨空白菜單
      orders: []  // 乾淨空白訂單
    };

    saveVendorData("new", freshNewProfile);
    switchVendorMode("new");

    sectionAuth.style.display = "none";
    sectionDashboard.style.display = "block";

    showToast(`🎉 恭喜【${storeName}】合作開通！已建立全新空白沙盒，請先上架首道餐點。`);

    // 自動導向菜單管理並聚焦
    switchTab("panel-menu");
    setTimeout(() => {
      inputDishName?.focus();
    }, 400);
  });

  btnLogout?.addEventListener("click", () => {
    if (confirm("確定要登出商家管理中心嗎？")) {
      persistCurrentState();
      // 撤銷本階段的店家進場通行憑證
      sessionStorage.removeItem("laipower_partner_authorized");
      sectionDashboard.style.display = "none";
      sectionAuth.style.display = "block";
      if (authLoginError) authLoginError.style.display = "none";
      if (authRegError) authRegError.style.display = "none";
      showToast("已成功登出商家管理中心。");
      // 安全導航回首頁
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    }
  });

  // 後台頂部快速切換廠商按鈕（供評審快速對照驗收）
  btnSwitchVendorQuick?.addEventListener("click", () => {
    const nextMode = (activeVendorMode === "legacy") ? "new" : "legacy";
    const nextName = (nextMode === "legacy") ? "舊廠商（西門町排骨大王）" : "新註冊店家（獨立沙盒）";

    if (confirm(`是否快速切換至【${nextName}】？\n兩者的菜單與訂單資料各自獨立保留。`)) {
      switchVendorMode(nextMode);
      showToast(`已切換為：${nextName}`);
    }
  });

  // =========================================================================
  // 13. 接單狀態邏輯（連動菜單數量）
  // =========================================================================

  const updateBusinessStatusUI = () => {
    // 嚴格防呆：線上餐點為 0 項時，強制切換為休息中
    if (menuList.length === 0) {
      storeState.isOpen = false;
      persistCurrentState();
    }

    if (storeState.isOpen) {
      businessPulseDot.className = "status-pulse-dot is-open";
      businessStatusLabel.textContent = "目前營業狀態：● 接單中";
      businessStatusLabel.style.color = "var(--color-primary)";
      btnToggleBusiness.textContent = "關閉接單（暫停受單）";
      headerStoreBadge.textContent = "● 門市營業接單中";
      headerStoreBadge.className = "store-top-status is-open";
    } else {
      businessPulseDot.className = "status-pulse-dot is-closed";
      businessStatusLabel.textContent = (menuList.length === 0)
        ? "目前營業狀態：○ 休息中（尚無上架餐點）"
        : "目前營業狀態：○ 已暫停接單";
      businessStatusLabel.style.color = "var(--color-text-light)";
      btnToggleBusiness.textContent = "開始接單（恢復營運）";
      headerStoreBadge.textContent = "○ 休息中";
      headerStoreBadge.className = "store-top-status is-closed";
    }
  };

  btnToggleBusiness?.addEventListener("click", () => {
    // 阻擋空白菜單接單
    if (!storeState.isOpen && menuList.length === 0) {
      alert("⚠️ 線上菜單尚無任何上架餐點，無法開始接單！\n請先在下方「新增餐點」表單完成至少 1 道餐點上架。");
      switchTab("panel-menu");
      setTimeout(() => {
        inputDishName?.focus();
      }, 300);
      return;
    }

    storeState.isOpen = !storeState.isOpen;
    persistCurrentState();
    updateBusinessStatusUI();
    showToast(storeState.isOpen ? "營業狀態更新：已開始接單！" : "營業狀態更新：已暫停接單。");
  });

  // 分頁手動切換
  navTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      switchTab(targetId);
    });
  });

  // 供餐設定表單儲存
  const renderSettingsForm = () => {
    setStartTime.value = storeState.startTime;
    setStopTime.value = storeState.stopTime;
    setCapacityThreshold.value = storeState.capacityThreshold;
    setDeliveryThreshold.value = storeState.deliveryThreshold;
    displayOperatingHours.textContent = `上午 ${storeState.startTime} - 下午 ${storeState.stopTime}`;
  };

  formSettings?.addEventListener("submit", (e) => {
    e.preventDefault();
    storeState.startTime = setStartTime.value;
    storeState.stopTime = setStopTime.value;
    storeState.capacityThreshold = parseInt(setCapacityThreshold.value, 10) || 50;
    storeState.deliveryThreshold = parseInt(setDeliveryThreshold.value, 10) || 300;

    // 新店家完成設定，正式解鎖開張！
    if (storeState.isOnboarding && storeState.onboardingStep === 3) {
      storeState.isOnboarding = false;
      storeState.isOpen = true; // 正式開始接單
      persistCurrentState();
      renderSettingsForm();
      renderOnboardingUI();
      updateBusinessStatusUI();

      settingsSaveMsg.style.display = "inline";
      setTimeout(() => (settingsSaveMsg.style.display = "none"), 3000);

      showToast(`🎊 開店流程全數完成，【${storeState.storeName}】正式開張營業！`);
      setTimeout(() => {
        switchTab("panel-orders");
      }, 1400);
      return;
    }

    persistCurrentState();
    renderSettingsForm();
    settingsSaveMsg.style.display = "inline";
    setTimeout(() => (settingsSaveMsg.style.display = "none"), 3000);
    showToast("供餐時段與門檻已儲存！");
  });

  // =========================================================================
  // 14. 全局初次渲染
  // =========================================================================

  const renderAll = () => {
    displayWelcomeTitle.textContent = `你好，${storeState.storeName}`;
    displayStoreAddress.textContent = storeState.address;
    document.getElementById("badge-store-category").textContent = storeState.category;

    // 渲染沙盒模式標籤
    if (activeVendorMode === "legacy") {
      headerVendorModeTag.style.display = "inline-block";
      headerVendorModeTag.textContent = "🏛️ 既有展示廠商";
      badgeVendorProfile.textContent = "🏛️ 既有展示廠商（完整營運數據）";
      badgeVendorProfile.className = "vendor-profile-badge badge-legacy";
      btnSwitchVendorQuick.textContent = "🔄 切換至新註冊店家";
    } else {
      headerVendorModeTag.style.display = "inline-block";
      headerVendorModeTag.textContent = "🌱 新進駐店家";
      badgeVendorProfile.textContent = "🌱 新進駐店家（獨立空白沙盒）";
      badgeVendorProfile.className = "vendor-profile-badge badge-new";
      btnSwitchVendorQuick.textContent = "🔄 切換回舊廠商示範";
    }

    renderOnboardingUI();
    updateBusinessStatusUI();
    renderQuickPresetChips();
    renderSpecGroupsBuilder();
    renderMenuList();
    renderSettingsForm();
    renderOrderQueueStream();
    renderHistoryOrdersStream();
    renderKPI();
  };

  renderAll();
});