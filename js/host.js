/**
 * 來電送 (LaiPower Food) - 團購主管理後台邏輯
 * 核心隱私原則：
 * 1. 團主端【看不到備註與客製規格，只能看到餐點品項】（消弭飲食壓力，保護團員隱私）
 * 2. 訂單明細表僅呈現：取餐編號、餐點品項、金額（及外送抵達後的收款狀態）
 * 3. 廚房備餐彙總僅統計品項數量，無名單、無備註[cite: 2]
 * 4. 今日不參加僅統計人數，完全不記名[cite: 2]
 */

(function () {
  "use strict";

  // 全域狀態
  const State = {
    isGroupCreated: false, // 預設未開團（乾淨表單）
    groupInfo: {
      code: "",
      storeName: "",
      deadline: "",
      hostName: "",
      phone: "",
      pickupLocation: "",
      targetTierCount: 10
    },
    orderStatus: "ordering", // 'ordering' | 'locked' | 'cooking' | 'delivered'
    timelineTimestamps: {
      created: "--:--",
      locked: "--:--",
      cooking: "--:--",
      delivered: "--:--"
    },
    // 訂單資料：即便團員端有備註，主辦人後台也只呈現 dish 與 price
    orders: [],
    skipCount: 0 // 純人數統計，不記名
  };

  let DOM = {};

  function cacheDOM() {
    DOM = {
      sectionCreateGroup: document.getElementById("section-create-group"),
      sectionHostDashboard: document.getElementById("section-host-dashboard"),

      formCreateGroup: document.getElementById("form-create-group"),
      selectStore: document.getElementById("select-store"),
      inputDeadline: document.getElementById("input-deadline"),
      inputHostName: document.getElementById("input-host-name"),
      inputHostPhone: document.getElementById("input-host-phone"),
      inputPickupLocation: document.getElementById("input-pickup-location"),
      createErrorMsg: document.getElementById("create-error-msg"),

      // 時間軸元件
      timelinePulseDot: document.getElementById("timeline-pulse-dot"),
      timelineStatusTitle: document.getElementById("timeline-status-title"),
      timelineStatusDesc: document.getElementById("timeline-status-desc"),
      timelineFillBar: document.getElementById("timeline-fill-bar"),
      nodeStage1: document.getElementById("node-stage-1"),
      nodeStage2: document.getElementById("node-stage-2"),
      nodeStage3: document.getElementById("node-stage-3"),
      nodeStage4: document.getElementById("node-stage-4"),
      timeStamp1: document.getElementById("time-stamp-1"),
      timeStamp2: document.getElementById("time-stamp-2"),
      timeStamp3: document.getElementById("time-stamp-3"),
      timeStamp4: document.getElementById("time-stamp-4"),
      pillStage1: document.getElementById("pill-stage-1"),
      pillStage2: document.getElementById("pill-stage-2"),
      pillStage3: document.getElementById("pill-stage-3"),
      pillStage4: document.getElementById("pill-stage-4"),

      // 代碼與分享
      codeChar1: document.getElementById("code-char-1"),
      codeChar2: document.getElementById("code-char-2"),
      codeChar3: document.getElementById("code-char-3"),
      codeChar4: document.getElementById("code-char-4"),
      codeCopyTrigger: document.getElementById("code-copy-trigger"),
      btnCopyGroupLink: document.getElementById("btn-copy-group-link"),
      btnEditGroupInfo: document.getElementById("btn-edit-group-info"),
      btnResetGroupTop: document.getElementById("btn-reset-group-top"),

      dashStoreName: document.getElementById("dash-store-name"),
      dashDeadline: document.getElementById("dash-deadline"),
      dashHostInfo: document.getElementById("dash-host-info"),
      dashPickupLoc: document.getElementById("dash-pickup-loc"),
      dashTierBadge: document.getElementById("dash-tier-badge"),
      dashTierText: document.getElementById("dash-tier-text"),
      dashProgressFill: document.getElementById("dash-progress-fill"),

      kpiTotalAmount: document.getElementById("kpi-total-amount"),
      kpiTotalCount: document.getElementById("kpi-total-count"),
      kpiSkipCount: document.getElementById("kpi-skip-count"),

      // 分頁與表格
      tabBtnBreakdown: document.getElementById("tab-btn-breakdown"),
      tabBtnKitchen: document.getElementById("tab-btn-kitchen"),
      tabCountBreakdown: document.getElementById("tab-count-breakdown"),
      tabCountKitchen: document.getElementById("tab-count-kitchen"),
      tabActiveCaption: document.getElementById("tab-active-caption"),
      paneTabBreakdown: document.getElementById("pane-tab-breakdown"),
      paneTabKitchen: document.getElementById("pane-tab-kitchen"),
      ordersThead: document.getElementById("orders-thead"),
      ordersTbody: document.getElementById("orders-tbody"),
      ordersTfoot: document.getElementById("orders-tfoot"),
      kitchenTbody: document.getElementById("kitchen-tbody"),
      kitchenTotalCount: document.getElementById("kitchen-total-count"),

      // 收款看板
      paymentCollectionBanner: document.getElementById("payment-collection-banner"),
      bannerPaidAmount: document.getElementById("banner-paid-amount"),
      bannerTotalAmount: document.getElementById("banner-total-amount"),
      bannerPaidCount: document.getElementById("banner-paid-count"),
      bannerTotalOrders: document.getElementById("banner-total-orders"),
      paymentProgressFill: document.getElementById("payment-progress-fill"),
      btnToggleAllPaid: document.getElementById("btn-toggle-all-paid"),

      // 操作按鈕
      btnToggleLockOrder: document.getElementById("btn-toggle-lock-order"),
      btnSubmitToMerchant: document.getElementById("btn-submit-to-merchant"),
      btnMarkDelivered: document.getElementById("btn-mark-delivered"),
      statusActionHint: document.getElementById("status-action-hint"),

      // 編輯彈窗
      editInfoModal: document.getElementById("edit-info-modal"),
      btnCloseEditModal: document.getElementById("btn-close-edit-modal"),
      formEditGroup: document.getElementById("form-edit-group"),
      editDeadline: document.getElementById("edit-deadline"),
      editLocation: document.getElementById("edit-location"),
      editPhone: document.getElementById("edit-phone"),

      hostToast: document.getElementById("host-toast")
    };
  }

  // =========================================================================
  // 1. 開團表單處理
  // =========================================================================
  function initCreateGroupForm() {
    DOM.formCreateGroup.addEventListener("submit", function (e) {
      e.preventDefault();

      const store = DOM.selectStore.value;
      const deadline = DOM.inputDeadline.value;
      const hostName = DOM.inputHostName.value.trim();
      const phone = DOM.inputHostPhone.value.trim();
      const location = DOM.inputPickupLocation.value.trim();

      if (!store) {
        showCreateError("請選擇今日合作店家！");
        DOM.selectStore.focus();
        return;
      }
      if (!deadline) {
        showCreateError("請設定收單截止時間！");
        DOM.inputDeadline.focus();
        return;
      }
      if (!hostName) {
        showCreateError("請輸入召集人姓名！");
        DOM.inputHostName.focus();
        return;
      }
      if (!phone || !/^09\d{8}$/.test(phone)) {
        showCreateError("請輸入正確的手機號碼格式（例：0912345678）");
        DOM.inputHostPhone.focus();
        return;
      }
      if (!location) {
        showCreateError("請填寫送餐地點 / 取餐處！");
        DOM.inputPickupLocation.focus();
        return;
      }

      DOM.createErrorMsg.style.display = "none";

      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      const nowStr = getNowTimeString();

      State.groupInfo = {
        code: randomCode,
        storeName: store,
        deadline: deadline,
        hostName: hostName,
        phone: phone,
        pickupLocation: location,
        targetTierCount: 10
      };

      State.timelineTimestamps.created = nowStr;
      State.timelineTimestamps.locked = `預計 ${deadline}`;
      State.timelineTimestamps.cooking = "--:--";
      State.timelineTimestamps.delivered = "--:--";

      State.isGroupCreated = true;
      State.orderStatus = "ordering";

      // 載入示範測試資料（僅保留品項與價格，團主後台看不到飲食備註）
      State.orders = [
        { id: "A01", dish: "酥炸厚切排骨便當", price: 135, paid: false },
        { id: "A02", dish: "酥炸厚切排骨便當", price: 120, paid: false },
        { id: "A03", dish: "秘製黃金雞腿便當", price: 130, paid: false }
      ];
      State.skipCount = 2;

      renderView();
      showToast(`🎉 成功發起【${store}】團購！代碼：${randomCode}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function showCreateError(msg) {
    DOM.createErrorMsg.textContent = msg;
    DOM.createErrorMsg.style.display = "block";
  }

  // =========================================================================
  // 2. 畫面渲染與【時間軸核心推進演算法】
  // =========================================================================
  function renderView() {
    if (!State.isGroupCreated) {
      DOM.sectionCreateGroup.style.display = "block";
      DOM.sectionHostDashboard.style.display = "none";
      return;
    }

    DOM.sectionCreateGroup.style.display = "none";
    DOM.sectionHostDashboard.style.display = "block";

    // 填寫代碼
    const code = State.groupInfo.code;
    DOM.codeChar1.textContent = code.charAt(0) || "-";
    DOM.codeChar2.textContent = code.charAt(1) || "-";
    DOM.codeChar3.textContent = code.charAt(2) || "-";
    DOM.codeChar4.textContent = code.charAt(3) || "-";

    // 填寫摘要資訊
    DOM.dashStoreName.textContent = State.groupInfo.storeName;
    DOM.dashDeadline.textContent = `今日 ${State.groupInfo.deadline}`;
    DOM.dashHostInfo.textContent = `${State.groupInfo.hostName}（${State.groupInfo.phone}）`;
    DOM.dashPickupLoc.textContent = State.groupInfo.pickupLocation;

    renderOrderTimeline();

    // 數據卡片與明細表格
    const totalCount = State.orders.length;
    const totalAmount = State.orders.reduce((sum, item) => sum + item.price, 0);

    DOM.kpiTotalCount.textContent = totalCount;
    DOM.kpiTotalAmount.textContent = totalAmount.toLocaleString();
    DOM.kpiSkipCount.textContent = State.skipCount;

    renderTierProgress(totalCount);
    DOM.tabCountBreakdown.textContent = totalCount;

    // 渲染「無備註」的純粹品項明細表與備餐彙總表
    renderBreakdownTable(totalAmount);
    renderKitchenSummaryTable();
    renderPaymentBanner(totalAmount);
  }

  function renderOrderTimeline() {
    const status = State.orderStatus;
    const ts = State.timelineTimestamps;

    DOM.timeStamp1.textContent = ts.created;
    DOM.timeStamp2.textContent = ts.locked;
    DOM.timeStamp3.textContent = ts.cooking;
    DOM.timeStamp4.textContent = ts.delivered;

    [DOM.nodeStage1, DOM.nodeStage2, DOM.nodeStage3, DOM.nodeStage4].forEach((node) => {
      node.className = "timeline-node";
    });

    if (status === "ordering") {
      DOM.timelineStatusTitle.textContent = "餐點狀態：點餐收單中";
      DOM.timelineStatusDesc.textContent = "目前團員可自由填單，時間截止前主辦人可隨時送單至店家。";
      DOM.timelinePulseDot.style.backgroundColor = "#27AE60";
      DOM.timelineFillBar.style.width = "12%";

      DOM.nodeStage1.classList.add("current");
      DOM.pillStage1.className = "node-pill pill-active";
      DOM.pillStage1.textContent = "進行中";

      DOM.nodeStage2.classList.add("pending");
      DOM.pillStage2.className = "node-pill pill-pending";
      DOM.pillStage2.textContent = "等待中";

      DOM.nodeStage3.classList.add("pending");
      DOM.pillStage3.className = "node-pill pill-pending";
      DOM.pillStage3.textContent = "等待中";

      DOM.nodeStage4.classList.add("pending");
      DOM.pillStage4.className = "node-pill pill-pending";
      DOM.pillStage4.textContent = "等待中";

      DOM.btnSubmitToMerchant.style.display = "inline-flex";
      DOM.btnSubmitToMerchant.textContent = "🚀 送單至商家（確認製作）";
      DOM.btnToggleLockOrder.style.display = "inline-flex";
      DOM.btnToggleLockOrder.textContent = "🔒 提早截止（鎖定收單）";
      DOM.btnMarkDelivered.style.display = "none";
      DOM.statusActionHint.textContent = "目前團員可自由點餐。點擊「送單至商家」後將鎖定點餐並通知廚房製作。";

    } else if (status === "locked") {
      DOM.timelineStatusTitle.textContent = "餐點狀態：已截止收單（鎖單中）";
      DOM.timelineStatusDesc.textContent = "已停止團員點餐，訂單已凍結。請確認餐點數量無誤後點擊「送單至商家」。";
      DOM.timelinePulseDot.style.backgroundColor = "#E5A93C";
      DOM.timelineFillBar.style.width = "38%";

      DOM.nodeStage1.classList.add("completed");
      DOM.pillStage1.className = "node-pill pill-completed";
      DOM.pillStage1.textContent = "✓ 已完成";

      DOM.nodeStage2.classList.add("current");
      DOM.pillStage2.className = "node-pill pill-active";
      DOM.pillStage2.textContent = "已鎖單";

      DOM.nodeStage3.classList.add("pending");
      DOM.pillStage3.className = "node-pill pill-pending";
      DOM.pillStage3.textContent = "等待中";

      DOM.nodeStage4.classList.add("pending");
      DOM.pillStage4.className = "node-pill pill-pending";
      DOM.pillStage4.textContent = "等待中";

      DOM.btnSubmitToMerchant.style.display = "inline-flex";
      DOM.btnSubmitToMerchant.textContent = "🚀 送單至商家（交單製作）";
      DOM.btnToggleLockOrder.textContent = "🔓 重新開放點餐";
      DOM.btnMarkDelivered.style.display = "none";
      DOM.statusActionHint.textContent = "點單已截止。確認無誤後，請點擊「送單至商家」向廚房發單。";

    } else if (status === "cooking") {
      DOM.timelineStatusTitle.textContent = "餐點狀態：店家廚房備餐製作中";
      DOM.timelineStatusDesc.textContent = "訂單已傳達店家廚房全力現做中。待店家外送抵達取餐地點時，點擊「外送已抵達」。";
      DOM.timelinePulseDot.style.backgroundColor = "#D96B43";
      DOM.timelineFillBar.style.width = "68%";

      DOM.nodeStage1.classList.add("completed");
      DOM.pillStage1.className = "node-pill pill-completed";
      DOM.pillStage1.textContent = "✓ 已完成";

      DOM.nodeStage2.classList.add("completed");
      DOM.pillStage2.className = "node-pill pill-completed";
      DOM.pillStage2.textContent = "✓ 已完成";

      DOM.nodeStage3.classList.add("current");
      DOM.pillStage3.className = "node-pill pill-active";
      DOM.pillStage3.textContent = "現做備餐中";

      DOM.nodeStage4.classList.add("pending");
      DOM.pillStage4.className = "node-pill pill-pending";
      DOM.pillStage4.textContent = "配送中";

      DOM.btnSubmitToMerchant.style.display = "none";
      DOM.btnToggleLockOrder.style.display = "none";
      DOM.btnMarkDelivered.style.display = "inline-flex";
      DOM.statusActionHint.textContent = "店家正在現做餐點。待外送員抵達時，請點擊「外送已抵達」通知取餐。";

    } else if (status === "delivered") {
      DOM.timelineStatusTitle.textContent = "餐點狀態：餐點已送達（開放領餐）";
      DOM.timelineStatusDesc.textContent = "餐點已送達指定取餐處！請團友自備零錢，憑取餐編號向主辦人付款領餐。";
      DOM.timelinePulseDot.style.backgroundColor = "#27AE60";
      DOM.timelineFillBar.style.width = "100%";

      DOM.nodeStage1.classList.add("completed");
      DOM.pillStage1.className = "node-pill pill-completed";
      DOM.pillStage1.textContent = "✓ 已完成";

      DOM.nodeStage2.classList.add("completed");
      DOM.pillStage2.className = "node-pill pill-completed";
      DOM.pillStage2.textContent = "✓ 已完成";

      DOM.nodeStage3.classList.add("completed");
      DOM.pillStage3.className = "node-pill pill-completed";
      DOM.pillStage3.textContent = "✓ 已完成";

      DOM.nodeStage4.classList.add("completed");
      DOM.pillStage4.className = "node-pill pill-completed";
      DOM.pillStage4.textContent = "★ 送達可領取";

      DOM.btnSubmitToMerchant.style.display = "none";
      DOM.btnToggleLockOrder.style.display = "none";
      DOM.btnMarkDelivered.style.display = "none";
      DOM.statusActionHint.textContent = "🎉 餐點已全數抵達！請核對取餐編號交付餐點，並於下方勾選收款。";
    }
  }

  // =========================================================================
  // 3. 【核心修改】：訂單明細表（團主端看不到備註，只顯示餐點品項）
  // =========================================================================
  function renderBreakdownTable(totalAmount) {
    const isDelivered = (State.orderStatus === "delivered");

    // 1. 動態渲染表頭：移除備註欄，僅留取餐編號、餐點品項、金額與收款狀態
    DOM.ordersThead.innerHTML = `
      <tr>
        <th scope="col" style="width: ${isDelivered ? '20%' : '25%'};">取餐編號</th>
        <th scope="col" style="width: ${isDelivered ? '40%' : '50%'};">餐點品項</th>
        <th scope="col" style="width: ${isDelivered ? '20%' : '25%'};" class="text-right">金額</th>
        ${isDelivered ? '<th scope="col" style="width: 20%;" class="text-center">收款狀態</th>' : ''}
      </tr>
    `;

    DOM.ordersTbody.innerHTML = "";

    if (State.orders.length === 0) {
      DOM.ordersTbody.innerHTML = `
        <tr>
          <td colspan="${isDelivered ? 4 : 3}" class="text-center text-muted" style="padding: 2.5rem;">
            目前尚無團員送單，請點擊上方複製揪團連結分享至群組！
          </td>
        </tr>
      `;
      DOM.ordersTfoot.innerHTML = `
        <tr class="table-summary-row">
          <td colspan="2" class="text-left font-bold">總計</td>
          <td class="text-right font-bold total-highlight">總計 0元</td>
          ${isDelivered ? '<td></td>' : ''}
        </tr>
      `;
      return;
    }

    // 2. 渲染各訂單列：只顯示品項名稱，不顯示任何飲食備註
    State.orders.forEach((order) => {
      const tr = document.createElement("tr");
      if (isDelivered && order.paid) {
        tr.classList.add("row-paid");
      }

      // 收款核取方塊
      const paidColHtml = isDelivered ? `
        <td class="text-center">
          <label class="pay-checkbox-label" title="點擊切換收款狀態">
            <input 
              type="checkbox" 
              class="pay-checkbox" 
              data-id="${order.id}" 
              ${order.paid ? 'checked' : ''}
            >
            <span class="pay-status-txt ${order.paid ? 'text-paid' : 'text-unpaid'}">
              ${order.paid ? '✓ 已收款' : '未收款'}
            </span>
          </label>
        </td>
      ` : '';

      tr.innerHTML = `
        <td><span class="pickup-id-badge">${order.id}</span></td>
        <td><strong class="table-dish-name">${escapeHtml(order.dish)}</strong></td>
        <td class="text-right"><strong>NT$ ${order.price}</strong></td>
        ${paidColHtml}
      `;
      DOM.ordersTbody.appendChild(tr);
    });

    // 3. 綁定收款核取點擊事件
    if (isDelivered) {
      DOM.ordersTbody.querySelectorAll(".pay-checkbox").forEach((cb) => {
        cb.addEventListener("change", function () {
          const orderId = this.getAttribute("data-id");
          const target = State.orders.find(o => o.id === orderId);
          if (target) {
            target.paid = this.checked;
            renderView();
            
            const allPaid = State.orders.every(o => o.paid);
            if (allPaid && State.orders.length > 0) {
              showToast("🎉 太棒了！全團現金已全數收齊！");
            }
          }
        });
      });
    }

    // 4. 表尾加總欄位適配（colspan 改為 2）
    const paidCount = State.orders.filter(o => o.paid).length;
    DOM.ordersTfoot.innerHTML = `
      <tr class="table-summary-row">
        <td colspan="2" class="text-left font-bold">總計</td>
        <td class="text-right font-bold total-highlight">總計 ${totalAmount}元</td>
        ${isDelivered ? `<td class="text-center text-paid-total font-bold">已收 ${paidCount} /${State.orders.length} 筆</td>` : ''}
      </tr>
    `;
  }

  // =========================================================================
  // 4. 【核心修改】：廚房備餐彙總（只有數量，沒有備註與名單）
  // =========================================================================
  function renderKitchenSummaryTable() {
    DOM.kitchenTbody.innerHTML = "";

    // 僅依餐點名稱聚合數量
    const aggregated = {};
    State.orders.forEach((order) => {
      if (!aggregated[order.dish]) {
        aggregated[order.dish] = 0;
      }
      aggregated[order.dish] += 1;
    });

    const dishKeys = Object.keys(aggregated);
    DOM.tabCountKitchen.textContent = `${dishKeys.length} 品項`;
    DOM.kitchenTotalCount.textContent = `共 ${State.orders.length} 份餐點`;

    if (dishKeys.length === 0) {
      DOM.kitchenTbody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center text-muted" style="padding: 2rem;">
            尚無餐點出餐資料
          </td>
        </tr>
      `;
      return;
    }

    dishKeys.forEach((dishName) => {
      const count = aggregated[dishName];
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><strong class="table-dish-name">${escapeHtml(dishName)}</strong></td>
        <td class="text-center">
          <span class="kitchen-qty-badge">${count} 份</span>
        </td>
      `;
      DOM.kitchenTbody.appendChild(tr);
    });
  }

  // =========================================================================
  // 5. 收款進度看板渲染
  // =========================================================================
  function renderPaymentBanner(totalAmount) {
    if (State.orderStatus !== "delivered") {
      DOM.paymentCollectionBanner.style.display = "none";
      return;
    }

    DOM.paymentCollectionBanner.style.display = "flex";

    const totalOrders = State.orders.length;
    const paidOrders = State.orders.filter(o => o.paid);
    const paidAmount = paidOrders.reduce((sum, o) => sum + o.price, 0);
    const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

    DOM.bannerPaidAmount.textContent = `NT$ ${paidAmount}`;
    DOM.bannerTotalAmount.textContent = `NT$ ${totalAmount}`;
    DOM.bannerPaidCount.textContent = paidOrders.length;
    DOM.bannerTotalOrders.textContent = totalOrders;
    DOM.paymentProgressFill.style.width = `${paidPercent}%`;

    const isAllPaid = (paidOrders.length === totalOrders && totalOrders > 0);
    DOM.btnToggleAllPaid.textContent = isAllPaid ? "↺ 重設為全未收款" : "✓ 一鍵全選已收款";
  }

  function initPaymentBannerEvents() {
    DOM.btnToggleAllPaid.addEventListener("click", function () {
      const isAllPaid = State.orders.every(o => o.paid);
      State.orders.forEach(o => {
        o.paid = !isAllPaid;
      });
      renderView();
      if (!isAllPaid) {
        showToast("已將所有訂單標記為【已收款】！");
      } else {
        showToast("已重設收款狀態。");
      }
    });
  }

  function renderTierProgress(currentCount) {
    const target = State.groupInfo.targetTierCount;
    const diff = target - currentCount;
    const percent = Math.min(100, Math.round((currentCount / target) * 100));

    DOM.dashProgressFill.style.width = `${percent}%`;

    if (diff > 0) {
      DOM.dashTierBadge.textContent = `還差 ${diff} 份達標`;
      DOM.dashTierText.innerHTML = `目前已訂 <strong>${currentCount} 份</strong>，再訂 <strong>${diff} 份</strong> 即贈「店家招牌冰紅茶」！`;
    } else {
      DOM.dashTierBadge.textContent = "已達成滿額禮！";
      DOM.dashTierText.innerHTML = `🎉 太棒了！已累計 <strong>${currentCount} 份</strong>，成功解鎖贈送紅茶門檻！`;
    }
  }

  // =========================================================================
  // 6. 操作互動與流程切換
  // =========================================================================
  function initOrderStatusEvents() {
    DOM.btnToggleLockOrder.addEventListener("click", function () {
      if (State.orderStatus === "ordering") {
        State.orderStatus = "locked";
        State.timelineTimestamps.locked = getNowTimeString();
        showToast("已提前截止收單！時間軸推進至【已截止鎖單】。");
      } else if (State.orderStatus === "locked") {
        State.orderStatus = "ordering";
        State.timelineTimestamps.locked = `預計 ${State.groupInfo.deadline}`;
        showToast("已重新開放點餐！");
      }
      renderView();
    });

    DOM.btnSubmitToMerchant.addEventListener("click", function () {
      if (State.orders.length === 0) {
        alert("目前訂單明細為空，無法送單至商家！");
        return;
      }

      const totalCount = State.orders.length;
      const totalAmount = State.orders.reduce((sum, item) => sum + item.price, 0);

      const confirmMsg = `即將向【${State.groupInfo.storeName}】送出訂單：\n` +
                         `・總餐點數：${totalCount} 份\n` +
                         `・整單總額：NT$ ${totalAmount}\n` +
                         `・送餐地址：${State.groupInfo.pickupLocation}\n\n` +
                         `送單後時間軸將推進至「廚房製作」，確定送出嗎？`;

      if (confirm(confirmMsg)) {
        State.orderStatus = "cooking";
        const now = getNowTimeString();
        if (State.timelineTimestamps.locked.startsWith("預計")) {
          State.timelineTimestamps.locked = now;
        }
        State.timelineTimestamps.cooking = now;
        renderView();
        showToast("🚀 訂單已送達店家！時間軸狀態已切換為【廚房製作中】");
      }
    });

    DOM.btnMarkDelivered.addEventListener("click", function () {
      if (confirm("確認外送餐點已送達指定地點，並開放團員現場取餐與收款？")) {
        State.orderStatus = "delivered";
        State.timelineTimestamps.delivered = getNowTimeString();
        renderView();
        showToast("🛵 餐點已送達！已開放領餐，請於下方核對取餐編號並勾選收款。");
      }
    });

    DOM.btnResetGroupTop.addEventListener("click", function () {
      if (confirm("確定要結束本次團購，並返回未開團的乾淨表單嗎？")) {
        resetToCleanForm();
      }
    });
  }

  function resetToCleanForm() {
    State.isGroupCreated = false;
    State.groupInfo = {
      code: "",
      storeName: "",
      deadline: "",
      hostName: "",
      phone: "",
      pickupLocation: "",
      targetTierCount: 10
    };
    State.orders = [];
    State.skipCount = 0;
    State.orderStatus = "ordering";
    State.timelineTimestamps = {
      created: "--:--",
      locked: "--:--",
      cooking: "--:--",
      delivered: "--:--"
    };

    DOM.formCreateGroup.reset();
    DOM.selectStore.selectedIndex = 0;
    DOM.createErrorMsg.style.display = "none";

    renderView();
    showToast("已重設！已回到未開團的乾淨表單。");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // =========================================================================
  // 7. 分頁切換、代碼複製與資訊彈窗
  // =========================================================================
  function initTabs() {
    const tabs = [
      { btn: DOM.tabBtnBreakdown, pane: DOM.paneTabBreakdown, caption: "僅顯示取餐編號與餐點品項，備註由店家直接核對" },
      { btn: DOM.tabBtnKitchen, pane: DOM.paneTabKitchen, caption: "廚房免手算備餐品項數量加總" }
    ];

    tabs.forEach((tab) => {
      tab.btn.addEventListener("click", function () {
        tabs.forEach((t) => {
          t.btn.classList.remove("active");
          t.btn.setAttribute("aria-selected", "false");
          t.pane.style.display = "none";
        });

        tab.btn.classList.add("active");
        tab.btn.setAttribute("aria-selected", "true");
        tab.pane.style.display = "block";
        DOM.tabActiveCaption.textContent = tab.caption;
      });
    });
  }

  function initShareEvents() {
    DOM.codeCopyTrigger.addEventListener("click", function () {
      if (!State.groupInfo.code) return;
      copyToClipboard(State.groupInfo.code, `團購代碼【${State.groupInfo.code}】已複製到剪貼簿！`);
    });

    DOM.btnCopyGroupLink.addEventListener("click", function () {
      if (!State.groupInfo.code) return;
      const currentUrl = window.location.href;
      const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/")) || ".";
      const inviteUrl = `${baseUrl}/member.html?code=${State.groupInfo.code}`;
      copyToClipboard(inviteUrl, "📋 揪團連結已複製！可發送至 LINE 群組邀請大家點餐。");
    });
  }

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      showToast(successMsg);
    } catch (e) {
      alert(`請複製：${text}`);
    }
    document.body.removeChild(ta);
  }

  function initEditInfoModal() {
    DOM.btnEditGroupInfo.addEventListener("click", function () {
      DOM.editDeadline.value = State.groupInfo.deadline;
      DOM.editLocation.value = State.groupInfo.pickupLocation;
      DOM.editPhone.value = State.groupInfo.phone;
      openModal(DOM.editInfoModal);
    });

    DOM.btnCloseEditModal.addEventListener("click", function () {
      closeModal(DOM.editInfoModal);
    });

    DOM.formEditGroup.addEventListener("submit", function (e) {
      e.preventDefault();
      const newDeadline = DOM.editDeadline.value;
      const newLoc = DOM.editLocation.value.trim();
      const newPhone = DOM.editPhone.value.trim();

      if (!newDeadline || !newLoc || !newPhone) {
        alert("請完整填寫所有欄位！");
        return;
      }

      State.groupInfo.deadline = newDeadline;
      State.groupInfo.pickupLocation = newLoc;
      State.groupInfo.phone = newPhone;
      if (State.orderStatus === "ordering") {
        State.timelineTimestamps.locked = `預計 ${newDeadline}`;
      }

      closeModal(DOM.editInfoModal);
      renderView();
      showToast("開團資訊已成功更新！");
    });

    DOM.editInfoModal.addEventListener("click", function (e) {
      if (e.target === DOM.editInfoModal) closeModal(DOM.editInfoModal);
    });
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function showToast(msg) {
    if (!DOM.hostToast) return;
    DOM.hostToast.textContent = msg;
    DOM.hostToast.classList.add("show");
    setTimeout(() => DOM.hostToast.classList.remove("show"), 2800);
  }

  function getNowTimeString() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  document.addEventListener("DOMContentLoaded", () => {
    cacheDOM();
    initCreateGroupForm();
    initOrderStatusEvents();
    initPaymentBannerEvents();
    initTabs();
    initShareEvents();
    initEditInfoModal();
    renderView();
  });
})();