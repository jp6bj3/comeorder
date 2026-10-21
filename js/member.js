/**
 * 來電送 (LaiPower Food) - 團購團員點餐頁面互動控制器
 * 核心調整：
 * 1. 修正「今日不參加」事件監聽綁定（不記名、純計數）。
 * 2. 送單成功後的顯示方式，改為與「今日不參加」一致的頁面內卡片狀態 (In-page status card)。
 * 3. 支援「繼續加點 / 重新點餐」按鈕，隨時切換回選單。
 * 4. 支援取餐號碼、金額與明細的一鍵複製。
 */

(function () {
  "use strict";

  // 1. 示範資料庫 (Mock Data)
  const DEMO_GROUPS = {
    "8825": {
      code: "8825",
      storeName: "西門町排骨大王",
      hostName: "王小明（3F 企劃部）",
      pickupLocation: "台北市萬華區內江街19號（3F大廳）",
      deadline: "今日 11:30 截止",
      currentCount: 7,
      targetCount: 10,
      rewardText: "再 3 份即贈店家招牌冰紅茶！",
      dishes: [
        {
          id: "dish-01",
          name: "酥炸厚切排骨便當",
          category: "bento",
          price: 120,
          desc: "特選溫體豬里肌，獨門中藥五香醃製，外酥內嫩；附每日三樣熱炒配菜與半熟荷包蛋。",
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
          tag: "人氣招牌",
          options: [
            {
              id: "spicy",
              title: "辣度選擇（必選）",
              required: true,
              type: "radio",
              choices: [
                { name: "不辣", extraPrice: 0, checked: true },
                { name: "小辣", extraPrice: 0 },
                { name: "中辣", extraPrice: 0 },
                { name: "大辣（朝天椒特製）", extraPrice: 0 }
              ]
            },
            {
              id: "rice",
              title: "飯量偏好（必選）",
              required: true,
              type: "radio",
              choices: [
                { name: "正常飯量", extraPrice: 0, checked: true },
                { name: "少飯", extraPrice: 0 },
                { name: "飯換多一份時蔬", extraPrice: 0 }
              ]
            },
            {
              id: "addons",
              title: "加料升級（可複選）",
              type: "checkbox",
              choices: [
                { name: "加古早味滷蛋", extraPrice: 15 },
                { name: "加香濃手工起司片", extraPrice: 20 },
                { name: "特製辣菜脯增量", extraPrice: 5 }
              ]
            }
          ]
        },
        {
          id: "dish-02",
          name: "秘製黃金雞腿便當",
          category: "bento",
          price: 130,
          desc: "大支大雞腿先醃後炸，香氣撲鼻肉質厚實多汁，是午餐提振精神的極佳選擇。",
          image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
          tag: "主廚推薦",
          options: [
            {
              id: "cut",
              title: "雞腿處理方式",
              required: true,
              type: "radio",
              choices: [
                { name: "不切（鎖住肉汁）", extraPrice: 0, checked: true },
                { name: "切塊（方便入口）", extraPrice: 0 }
              ]
            },
            {
              id: "spicy",
              title: "辣度選擇",
              required: true,
              type: "radio",
              choices: [
                { name: "原味不辣", extraPrice: 0, checked: true },
                { name: "灑微辣胡椒粉", extraPrice: 0 },
                { name: "加生辣椒醬", extraPrice: 0 }
              ]
            }
          ]
        },
        {
          id: "dish-03",
          name: "蔬食養身五寶飯（蛋奶素）",
          category: "bento",
          price: 100,
          desc: "清炒時令鮮蔬、烤蕈菇、滷豆乾、玉米與有機玉子燒，健康低負擔。",
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
          tag: "清爽首選",
          options: [
            {
              id: "egg",
              title: "是否食用蔥蒜/蛋",
              required: true,
              type: "radio",
              choices: [
                { name: "全素無蛋", extraPrice: 0 },
                { name: "蛋奶素（附玉子燒）", extraPrice: 0, checked: true },
                { name: "五辛素（可含洋蔥）", extraPrice: 0 }
              ]
            }
          ]
        },
        {
          id: "dish-04",
          name: "古早味脆皮紅燒肉（單點）",
          category: "snack",
          price: 75,
          desc: "三層五花肥瘦勻稱，酥脆外皮搭配特調甜辣沾醬，經典西門町老滋味。",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
          tag: "加菜人氣王",
          options: [
            {
              id: "sauce",
              title: "醬料搭配",
              required: true,
              type: "radio",
              choices: [
                { name: "甜辣醬直接淋上", extraPrice: 0, checked: true },
                { name: "醬料分開包", extraPrice: 0 },
                { name: "只灑胡椒鹽", extraPrice: 0 }
              ]
            }
          ]
        },
        {
          id: "dish-05",
          name: "手工花枝丸串（2串）",
          category: "snack",
          price: 45,
          desc: "純澎湖花枝漿現打現炸，吃得到彈牙花枝顆粒。",
          image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
          tag: "解饞小點",
          options: [
            {
              id: "flavor",
              title: "調味粉",
              required: true,
              type: "radio",
              choices: [
                { name: "經典胡椒鹽", extraPrice: 0, checked: true },
                { name: "辣味胡椒粉", extraPrice: 0 },
                { name: "芥末椒鹽", extraPrice: 0 }
              ]
            }
          ]
        },
        {
          id: "dish-06",
          name: "老火熬煮味噌貢丸湯",
          category: "drink",
          price: 40,
          desc: "白味噌與大骨高湯慢熬，搭配兩顆新竹香菇貢丸與嫩豆腐丁。",
          image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
          tag: "暖心湯品",
          options: [
            {
              id: "scallion",
              title: "蔥花與香菜",
              required: true,
              type: "radio",
              choices: [
                { name: "蔥花香菜都要", extraPrice: 0, checked: true },
                { name: "不要香菜", extraPrice: 0 },
                { name: "不要蔥花", extraPrice: 0 },
                { name: "都不要（只要清湯）", extraPrice: 0 }
              ]
            }
          ]
        },
        {
          id: "dish-07",
          name: "阿嬤古早味冬瓜檸檬（冰）",
          category: "drink",
          price: 35,
          desc: "古法熬製冬瓜露，加入屏東九如檸檬鮮汁，甜酸解膩。",
          image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
          tag: "冰涼解渴",
          options: [
            {
              id: "ice",
              title: "冰塊選擇",
              required: true,
              type: "radio",
              choices: [
                { name: "正常冰", extraPrice: 0, checked: true },
                { name: "微冰", extraPrice: 0 },
                { name: "去冰", extraPrice: 0 }
              ]
            },
            {
              id: "sweetness",
              title: "甜度微調",
              required: true,
              type: "radio",
              choices: [
                { name: "正常甜（原配方）", extraPrice: 0, checked: true },
                { name: "半糖（加水稀釋）", extraPrice: 0 }
              ]
            }
          ]
        }
      ]
    }
  };

  // 2. 狀態管理 (Application State)
  const State = {
    currentGroup: null,
    isSkipped: false,
    isOrderSubmitted: false, // 標記是否已送單成功
    cart: [],
    activeModalDish: null,
    tempDishQty: 1,
    lastSubmittedReceipt: null // 記錄最近一次送出訂單憑證
  };

  // 3. DOM 快取
  let DOM = {};

  function cacheDOM() {
    DOM = {
      stepCodeSection: document.getElementById("step-code-section"),
      formVerifyCode: document.getElementById("form-verify-code"),
      inputMemberCode: document.getElementById("input-member-code"),
      codeError: document.getElementById("code-error"),

      orderFlowWrapper: document.getElementById("order-flow-wrapper"),
      displayStoreName: document.getElementById("display-store-name"),
      displayHostName: document.getElementById("display-host-name"),
      displayPickupLocation: document.getElementById("display-pickup-location"),
      displayDeadline: document.getElementById("display-deadline"),
      displayGroupCode: document.getElementById("display-group-code"),
      btnChangeCode: document.getElementById("btn-change-code"),
      displayProgressHint: document.getElementById("display-progress-hint"),
      progressBarFill: document.getElementById("progress-bar-fill"),

      // 今日不參加（修正為符合 member.html 的元素）
      skipTodayBanner: document.getElementById("skip-today-banner"),
      btnOpenSkipModal: document.getElementById("btn-open-skip-modal"),
      btnCartSkipLink: document.getElementById("btn-cart-skip-link"),
      skipModal: document.getElementById("skip-modal"),
      btnCloseSkipModal: document.getElementById("btn-close-skip-modal"),
      btnConfirmSkip: document.getElementById("btn-confirm-skip"),
      btnCancelSkip: document.getElementById("btn-cancel-skip"),
      skipStatusCard: document.getElementById("skip-status-card"),
      skipStatusMeta: document.getElementById("skip-status-meta"),
      btnRevertToOrder: document.getElementById("btn-revert-to-order"),

      // 送單成功狀態卡片
      orderSuccessCard: document.getElementById("order-success-card"),
      receiptPickupNumber: document.getElementById("receipt-pickup-number"),
      receiptTotalAmount: document.getElementById("receipt-total-amount"),
      receiptMemberLabel: document.getElementById("receipt-member-label"),
      receiptItemsTbody: document.getElementById("receipt-items-tbody"),
      receiptPickupLoc: document.getElementById("receipt-pickup-loc"),
      receiptOrderTime: document.getElementById("receipt-order-time"),
      btnCopyOrderInfo: document.getElementById("btn-copy-order-info"),
      btnRevertFromOrder: document.getElementById("btn-revert-from-order"),

      // 選餐與購物車
      orderLayoutGrid: document.getElementById("order-layout-grid"),
      dishesContainer: document.getElementById("dishes-container"),
      categoryTabs: document.querySelectorAll(".category-tabs .tab-btn"),

      cartSidebar: document.getElementById("cart-sidebar"),
      cartItemsContainer: document.getElementById("cart-items-container"),
      cartFooter: document.getElementById("cart-footer"),
      cartTotalQty: document.getElementById("cart-total-qty"),
      cartTotalPrice: document.getElementById("cart-total-price"),
      btnClearCart: document.getElementById("btn-clear-cart"),
      inputNickname: document.getElementById("input-nickname"),
      btnSubmitOrder: document.getElementById("btn-submit-order"),

      mobileCartBar: document.getElementById("mobile-cart-bar"),
      btnToggleMobileCart: document.getElementById("btn-toggle-mobile-cart"),
      mobileBadgeCount: document.getElementById("mobile-badge-count"),
      mobilePriceVal: document.getElementById("mobile-price-val"),
      btnMobileCheckout: document.getElementById("btn-mobile-checkout"),

      dishModal: document.getElementById("dish-modal"),
      btnCloseDishModal: document.getElementById("btn-close-dish-modal"),
      modalDishTitle: document.getElementById("modal-dish-title"),
      modalDishBasePrice: document.getElementById("modal-dish-base-price"),
      modalDishDesc: document.getElementById("modal-dish-desc"),
      modalOptionsContainer: document.getElementById("modal-options-container"),
      inputDishRemark: document.getElementById("input-dish-remark"),
      btnQtyMinus: document.getElementById("btn-qty-minus"),
      btnQtyPlus: document.getElementById("btn-qty-plus"),
      inputDishQty: document.getElementById("input-dish-qty"),
      modalCurrentCalcPrice: document.getElementById("modal-current-calc-price"),
      formDishOptions: document.getElementById("form-dish-options")
    };
  }

  // 4. 代碼驗證
  function initCodeVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryCode = urlParams.get("code");
    if (queryCode) {
      DOM.inputMemberCode.value = queryCode.trim().toUpperCase();
      validateAndEnterGroup(queryCode.trim().toUpperCase());
    }

    DOM.formVerifyCode.addEventListener("submit", function (e) {
      e.preventDefault();
      const code = DOM.inputMemberCode.value.trim().toUpperCase();

      if (!code) {
        showCodeError("請輸入 4 位數團購代碼！");
        DOM.inputMemberCode.focus();
        return;
      }

      validateAndEnterGroup(code);
    });

    DOM.inputMemberCode.addEventListener("input", function () {
      DOM.codeError.style.display = "none";
    });

    DOM.btnChangeCode.addEventListener("click", function () {
      if (confirm("更換團購代碼將清空目前尚未送出的點餐內容，確定要更換嗎？")) {
        State.currentGroup = null;
        State.cart = [];
        State.isSkipped = false;
        State.isOrderSubmitted = false;
        DOM.orderFlowWrapper.style.display = "none";
        DOM.stepCodeSection.style.display = "block";
        DOM.mobileCartBar.style.display = "none";
        DOM.inputMemberCode.value = "";
        DOM.inputMemberCode.focus();
      }
    });
  }

  function showCodeError(msg) {
    DOM.codeError.textContent = msg;
    DOM.codeError.style.display = "block";
  }

  function validateAndEnterGroup(code) {
    let group = DEMO_GROUPS[code];
    if (!group) {
      group = {
        ...DEMO_GROUPS["8825"],
        code: code,
        storeName: `西門町排骨大王（代碼 ${code}）`
      };
    }

    State.currentGroup = group;
    State.isSkipped = false;
    State.isOrderSubmitted = false;
    DOM.stepCodeSection.style.display = "none";
    DOM.orderFlowWrapper.style.display = "block";

    renderGroupInfo();
    renderDishes("all");
    renderCart();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 5. 渲染看板
  function renderGroupInfo() {
    const g = State.currentGroup;
    if (!g) return;

    DOM.displayStoreName.textContent = g.storeName;
    DOM.displayHostName.textContent = g.hostName;
    DOM.displayPickupLocation.textContent = g.pickupLocation;
    DOM.displayDeadline.textContent = g.deadline;
    DOM.displayGroupCode.textContent = `#${g.code}`;

    const progressPercent = Math.min(100, Math.round((g.currentCount / g.targetCount) * 100));
    DOM.progressBarFill.style.width = `${progressPercent}%`;
    DOM.displayProgressHint.textContent = `目前已訂 ${g.currentCount} 份・${g.rewardText}`;
  }

  // 6. 「今日不參加」模組（修正綁定與純計數）
  function initSkipFeature() {
    DOM.btnOpenSkipModal?.addEventListener("click", () => openModal(DOM.skipModal));
    DOM.btnCartSkipLink?.addEventListener("click", () => openModal(DOM.skipModal));
    DOM.btnCloseSkipModal?.addEventListener("click", () => closeModal(DOM.skipModal));
    DOM.btnCancelSkip?.addEventListener("click", () => closeModal(DOM.skipModal));

    // 點擊「確認今日不參加（不記名登記）」
    DOM.btnConfirmSkip?.addEventListener("click", function () {
      State.isSkipped = true;
      State.isOrderSubmitted = false;
      State.cart = [];

      closeModal(DOM.skipModal);
      applySkipViewState();
    });

    DOM.btnRevertToOrder?.addEventListener("click", function () {
      State.isSkipped = false;
      applyOrderViewState();
    });
  }

  // 狀態視圖 A：套用「今日不參加」頁面卡片
  function applySkipViewState() {
    DOM.orderLayoutGrid.style.display = "none";
    DOM.skipTodayBanner.style.display = "none";
    DOM.mobileCartBar.style.display = "none";
    DOM.orderSuccessCard.style.display = "none";
    DOM.skipStatusCard.style.display = "block";

    DOM.skipStatusMeta.innerHTML = `
      <div><strong>登記狀態：</strong>已登記本次跳過（不記名人數統計 +1）</div>
      <div><strong>隱私保障：</strong>完全未記錄您的姓名或個資，主辦人總表僅記錄已回覆</div>
      <div><strong>登記時間：</strong>今天 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;

    renderCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 狀態視圖 B：套用「送出訂單後」頁面卡片
  function applyOrderSuccessViewState() {
    DOM.orderLayoutGrid.style.display = "none";
    DOM.skipTodayBanner.style.display = "none";
    DOM.mobileCartBar.style.display = "none";
    DOM.skipStatusCard.style.display = "none";
    DOM.orderSuccessCard.style.display = "block";

    const r = State.lastSubmittedReceipt;
    if (!r) return;

    // 渲染取餐號碼、金額與明細
    DOM.receiptPickupNumber.textContent = r.pickupNumber;
    DOM.receiptTotalAmount.textContent = `NT$ ${r.totalAmount}`;
    DOM.receiptMemberLabel.textContent = `外盒註記：${escapeHtml(r.nickname)}`;
    DOM.receiptPickupLoc.textContent = r.pickupLocation;
    DOM.receiptOrderTime.textContent = `今日 ${r.orderTime}`;

    DOM.receiptItemsTbody.innerHTML = "";
    r.items.forEach((item) => {
      const tr = document.createElement("tr");
      const specsText = item.specs.map(s => s.name).join("、");
      
      tr.innerHTML = `
        <td>
          <span class="receipt-dish-title">${escapeHtml(item.name)}</span>
          ${specsText ? `<div class="receipt-dish-meta">${escapeHtml(specsText)}</div>` : ""}
          ${item.remark ? `<span class="receipt-dish-remark">備註：${escapeHtml(item.remark)}</span>` : ""}
        </td>
        <td class="text-center"><strong>${item.qty}</strong></td>
        <td class="text-right receipt-dish-price">NT$ ${item.itemTotal}</td>
      `;
      DOM.receiptItemsTbody.appendChild(tr);
    });

    renderCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 狀態視圖 C：恢復點餐菜單與購物車
  function applyOrderViewState() {
    DOM.orderLayoutGrid.style.display = "grid";
    DOM.skipTodayBanner.style.display = "flex";
    DOM.skipStatusCard.style.display = "none";
    DOM.orderSuccessCard.style.display = "none";

    renderCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 7. 菜單分類與餐點列表
  function initCategoryTabs() {
    DOM.categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        DOM.categoryTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const category = tab.getAttribute("data-category");
        renderDishes(category);
      });
    });
  }

  function renderDishes(category) {
    const dishes = State.currentGroup.dishes;
    const filtered = (category === "all") 
      ? dishes 
      : dishes.filter(d => d.category === category);

    DOM.dishesContainer.innerHTML = "";

    filtered.forEach((dish) => {
      const card = document.createElement("article");
      card.className = "dish-card";
      card.innerHTML = `
        <div class="dish-image-wrap">
          <img 
            src="${dish.image}" 
            alt="${dish.name}" 
            class="dish-image" 
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="dish-fallback" style="display:none;" aria-hidden="true">
            <span>🍱</span>
          </div>
          ${dish.tag ? `<span class="dish-tag-badge">${escapeHtml(dish.tag)}</span>` : ""}
        </div>
        <div class="dish-content">
          <h3 class="dish-name">${escapeHtml(dish.name)}</h3>
          <p class="dish-desc">${escapeHtml(dish.desc)}</p>
          <div class="dish-footer">
            <span class="dish-price"><span class="currency">NT$</span>${dish.price}</span>
            <button type="button" class="btn btn-primary btn-sm btn-select-dish" data-dish-id="${dish.id}">
              選擇規格
            </button>
          </div>
        </div>
      `;
      DOM.dishesContainer.appendChild(card);
    });

    DOM.dishesContainer.querySelectorAll(".btn-select-dish").forEach((btn) => {
      btn.addEventListener("click", function () {
        const dishId = this.getAttribute("data-dish-id");
        openDishModal(dishId);
      });
    });
  }

  // 8. 規格客製化彈窗
  function openDishModal(dishId) {
    const dish = State.currentGroup.dishes.find(d => d.id === dishId);
    if (!dish) return;

    State.activeModalDish = dish;
    State.tempDishQty = 1;
    DOM.inputDishQty.value = "1";
    DOM.inputDishRemark.value = "";

    DOM.modalDishTitle.textContent = dish.name;
    DOM.modalDishBasePrice.textContent = `基本店內價 NT$ ${dish.price}`;
    DOM.modalDishDesc.textContent = dish.desc;

    DOM.modalOptionsContainer.innerHTML = "";
    if (dish.options && dish.options.length > 0) {
      dish.options.forEach((optGroup) => {
        const groupEl = document.createElement("div");
        groupEl.className = "option-group";

        const titleEl = document.createElement("div");
        titleEl.className = "option-group-title";
        titleEl.innerHTML = `
          <span>${escapeHtml(optGroup.title)}</span>
          ${optGroup.required ? '<span class="option-tag">必選</span>' : '<span class="option-tag">自由加選</span>'}
        `;
        groupEl.appendChild(titleEl);

        const choicesGrid = document.createElement("div");
        choicesGrid.className = "option-choices";

        optGroup.choices.forEach((choice, idx) => {
          const label = document.createElement("label");
          label.className = "option-choice-label";

          const input = document.createElement("input");
          input.type = optGroup.type;
          input.name = `opt_${optGroup.id}`;
          input.value = choice.name;
          input.dataset.extraPrice = choice.extraPrice || 0;
          if (choice.checked || (optGroup.type === "radio" && idx === 0)) {
            input.checked = true;
          }

          input.addEventListener("change", updateModalCurrentPrice);

          const nameSpan = document.createElement("span");
          nameSpan.textContent = choice.name;

          label.appendChild(input);
          label.appendChild(nameSpan);

          if (choice.extraPrice > 0) {
            const priceSpan = document.createElement("span");
            priceSpan.className = "choice-extra-price";
            priceSpan.textContent = `+NT$ ${choice.extraPrice}`;
            label.appendChild(priceSpan);
          }

          choicesGrid.appendChild(label);
        });

        groupEl.appendChild(choicesGrid);
        DOM.modalOptionsContainer.appendChild(groupEl);
      });
    }

    updateModalCurrentPrice();
    openModal(DOM.dishModal);
  }

  function updateModalCurrentPrice() {
    if (!State.activeModalDish) return;
    let unitTotal = State.activeModalDish.price;

    const checkedInputs = DOM.modalOptionsContainer.querySelectorAll("input:checked");
    checkedInputs.forEach((input) => {
      const extra = parseInt(input.dataset.extraPrice, 10) || 0;
      unitTotal += extra;
    });

    const qty = parseInt(DOM.inputDishQty.value, 10) || 1;
    const finalTotal = unitTotal * qty;
    DOM.modalCurrentCalcPrice.textContent = finalTotal;
  }

  function initDishModalEvents() {
    DOM.btnQtyMinus.addEventListener("click", () => {
      let qty = parseInt(DOM.inputDishQty.value, 10) || 1;
      if (qty > 1) {
        qty--;
        DOM.inputDishQty.value = qty;
        updateModalCurrentPrice();
      }
    });

    DOM.btnQtyPlus.addEventListener("click", () => {
      let qty = parseInt(DOM.inputDishQty.value, 10) || 1;
      if (qty < 99) {
        qty++;
        DOM.inputDishQty.value = qty;
        updateModalCurrentPrice();
      }
    });

    DOM.btnCloseDishModal.addEventListener("click", () => {
      closeModal(DOM.dishModal);
    });

    DOM.formDishOptions.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!State.activeModalDish) return;

      const checkedInputs = DOM.modalOptionsContainer.querySelectorAll("input:checked");
      const selectedSpecs = [];
      let extraTotal = 0;

      checkedInputs.forEach((input) => {
        const extra = parseInt(input.dataset.extraPrice, 10) || 0;
        extraTotal += extra;
        selectedSpecs.push({
          name: input.value,
          extraPrice: extra
        });
      });

      const qty = parseInt(DOM.inputDishQty.value, 10) || 1;
      const remark = DOM.inputDishRemark.value.trim();
      const unitPrice = State.activeModalDish.price + extraTotal;

      const cartItem = {
        cartItemId: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        dishId: State.activeModalDish.id,
        name: State.activeModalDish.name,
        unitPrice: unitPrice,
        qty: qty,
        specs: selectedSpecs,
        remark: remark,
        itemTotal: unitPrice * qty
      };

      State.cart.push(cartItem);
      closeModal(DOM.dishModal);
      renderCart();

      if (window.innerWidth <= 960) {
        animateMobileCartButton();
      }
    });
  }

  // 9. 購物車管理
  function renderCart() {
    const listContainer = DOM.cartItemsContainer;
    listContainer.innerHTML = "";

    if (State.cart.length === 0) {
      listContainer.innerHTML = `
        <div class="cart-empty-placeholder">
          <span class="empty-icon">🥢</span>
          <p class="empty-text">購物車目前是空的</p>
          <p class="empty-sub">點擊餐點的「選擇規格」開始點餐吧！</p>
          <div class="cart-skip-shortcut">
            <span>或者</span>
            <button type="button" class="btn-link-skip" id="btn-cart-skip-link">今天不訂了？登記「這次跳過」</button>
          </div>
        </div>
      `;
      document.getElementById("btn-cart-skip-link")?.addEventListener("click", () => {
        openModal(DOM.skipModal);
      });

      DOM.cartFooter.style.display = "none";
      DOM.btnClearCart.style.display = "none";
      updateMobileBar(0, 0);
      return;
    }

    DOM.cartFooter.style.display = "block";
    DOM.btnClearCart.style.display = "inline-block";

    let totalQty = 0;
    let totalPrice = 0;

    State.cart.forEach((item, index) => {
      totalQty += item.qty;
      totalPrice += item.itemTotal;

      const itemCard = document.createElement("div");
      itemCard.className = "cart-item";

      const specsText = item.specs.map(s => s.extraPrice > 0 ? `${s.name} (+${s.extraPrice})` : s.name).join(" / ");

      itemCard.innerHTML = `
        <div class="cart-item-top">
          <span class="cart-item-title">${escapeHtml(item.name)}</span>
          <button type="button" class="btn-remove-item" data-index="${index}" title="刪除品項">&times;</button>
        </div>
        <div class="cart-item-specs">
          ${specsText ? `<div>${escapeHtml(specsText)}</div>` : ""}
          ${item.remark ? `<span class="cart-item-remark">備註：${escapeHtml(item.remark)}</span>` : ""}
        </div>
        <div class="cart-item-bottom">
          <div class="mini-stepper">
            <button type="button" class="btn-cart-minus" data-index="${index}">-</button>
            <span>${item.qty}</span>
            <button type="button" class="btn-cart-plus" data-index="${index}">+</button>
          </div>
          <span class="cart-item-price">NT$ ${item.itemTotal}</span>
        </div>
      `;
      listContainer.appendChild(itemCard);
    });

    DOM.cartTotalQty.textContent = `${totalQty} 份`;
    DOM.cartTotalPrice.textContent = `NT$ ${totalPrice}`;

    listContainer.querySelectorAll(".btn-remove-item").forEach((btn) => {
      btn.addEventListener("click", function () {
        const idx = parseInt(this.getAttribute("data-index"), 10);
        State.cart.splice(idx, 1);
        renderCart();
      });
    });

    listContainer.querySelectorAll(".btn-cart-minus").forEach((btn) => {
      btn.addEventListener("click", function () {
        const idx = parseInt(this.getAttribute("data-index"), 10);
        if (State.cart[idx].qty > 1) {
          State.cart[idx].qty--;
          State.cart[idx].itemTotal = State.cart[idx].qty * State.cart[idx].unitPrice;
          renderCart();
        } else {
          State.cart.splice(idx, 1);
          renderCart();
        }
      });
    });

    listContainer.querySelectorAll(".btn-cart-plus").forEach((btn) => {
      btn.addEventListener("click", function () {
        const idx = parseInt(this.getAttribute("data-index"), 10);
        State.cart[idx].qty++;
        State.cart[idx].itemTotal = State.cart[idx].qty * State.cart[idx].unitPrice;
        renderCart();
      });
    });

    updateMobileBar(totalQty, totalPrice);
  }

  function updateMobileBar(totalQty, totalPrice) {
    if (totalQty > 0) {
      DOM.mobileCartBar.style.display = "flex";
      DOM.mobileBadgeCount.textContent = totalQty;
      DOM.mobilePriceVal.textContent = `NT$ ${totalPrice}`;
    } else {
      DOM.mobileCartBar.style.display = "none";
    }
  }

  function animateMobileCartButton() {
    DOM.mobileCartBar.classList.add("pulse");
    setTimeout(() => DOM.mobileCartBar.classList.remove("pulse"), 400);
  }

  function initCartEvents() {
    DOM.btnClearCart.addEventListener("click", () => {
      if (confirm("確定要清空個人點餐清單嗎？")) {
        State.cart = [];
        renderCart();
      }
    });

    DOM.btnToggleMobileCart.addEventListener("click", toggleMobileCart);
    DOM.btnMobileCheckout.addEventListener("click", toggleMobileCart);
    DOM.btnSubmitOrder.addEventListener("click", simulateSubmitOrder);
  }

  function toggleMobileCart() {
    DOM.cartSidebar.classList.toggle("mobile-open");
  }

  // 10. 送出訂單 -> 轉為頁面內狀態卡片呈現
  function simulateSubmitOrder() {
    if (State.cart.length === 0) {
      alert("購物車內尚未加入任何餐點！");
      return;
    }

    const nickname = DOM.inputNickname.value.trim() || "匿名團友";
    const store = State.currentGroup.storeName;
    const pickupLoc = State.currentGroup.pickupLocation;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const totalAmount = State.cart.reduce((sum, item) => sum + item.itemTotal, 0);

    const randomLetter = ["A", "B", "C"][Math.floor(Math.random() * 3)];
    const randomNum = String(Math.floor(1 + Math.random() * 25)).padStart(2, "0");
    const pickupNumber = `${randomLetter}${randomNum}`;

    State.lastSubmittedReceipt = {
      storeName: store,
      pickupNumber: pickupNumber,
      totalAmount: totalAmount,
      nickname: nickname,
      pickupLocation: pickupLoc,
      orderTime: nowTimeStr,
      items: JSON.parse(JSON.stringify(State.cart))
    };

    State.isOrderSubmitted = true;
    State.isSkipped = false;

    State.cart = [];
    DOM.inputNickname.value = "";
    DOM.cartSidebar.classList.remove("mobile-open");

    applyOrderSuccessViewState();
  }

  // 11. 狀態看板事件綁定（加點 / 複製明細）
  function initOrderStatusEvents() {
    DOM.btnRevertFromOrder?.addEventListener("click", () => {
      State.isOrderSubmitted = false;
      applyOrderViewState();
    });

    DOM.btnCopyOrderInfo?.addEventListener("click", () => {
      const r = State.lastSubmittedReceipt;
      if (!r) return;

      let clipText = `【來電送・取餐憑證】\n`;
      clipText += `店家：${r.storeName}\n`;
      clipText += `取餐號碼：${r.pickupNumber}\n`;
      clipText += `應付金額：NT$ ${r.totalAmount}\n`;
      clipText += `領餐標記：${r.nickname}\n`;
      clipText += `領取地點：${r.pickupLocation}\n`;
      clipText += `--------------------\n`;
      clipText += `餐點明細：\n`;
      r.items.forEach((it, i) => {
        const spec = it.specs.map(s => s.name).join("、");
        clipText += `${i + 1}. ${it.name} x ${it.qty} (NT$ ${it.itemTotal})`;
        if (spec) clipText += ` [${spec}]`;
        if (it.remark) clipText += ` (備註: ${it.remark})`;
        clipText += `\n`;
      });
      clipText += `--------------------\n※ 現場請自備零錢，憑取餐號碼向主辦人付款領餐！`;

      navigator.clipboard.writeText(clipText).then(() => {
        const originalText = DOM.btnCopyOrderInfo.innerHTML;
        DOM.btnCopyOrderInfo.innerHTML = "✓ 已成功複製到剪貼簿！";
        setTimeout(() => {
          DOM.btnCopyOrderInfo.innerHTML = originalText;
        }, 2200);
      }).catch(() => {
        alert("瀏覽器不支援自動複製，請手動截圖保存！");
      });
    });
  }

  // 12. 通用規格彈窗控制
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active", "is-active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active", "is-active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function initGlobalModals() {
    [DOM.dishModal, DOM.skipModal].forEach((modal) => {
      modal?.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal(DOM.dishModal);
        closeModal(DOM.skipModal);
        DOM.cartSidebar.classList.remove("mobile-open");
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 13. 啟動入口
  document.addEventListener("DOMContentLoaded", () => {
    cacheDOM();
    initCodeVerification();
    initSkipFeature();
    initOrderStatusEvents();
    initCategoryTabs();
    initDishModalEvents();
    initCartEvents();
    initGlobalModals();
  });
})();