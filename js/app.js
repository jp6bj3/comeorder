/**
 * 來電送 (LaiPower Food) - 首頁前端核心互動邏輯
 * 
 * 功能：
 * 1. 團友入口：點擊開啟 4 碼代碼輸入彈窗（若點擊備援則直連 member.html）。
 * 2. 團購主入口：直接原生超連結跳轉至 host.html。
 * 3. 商家入口：直接原生超連結跳轉至 merchant.html。
 * 4. 4 碼輸入格體驗控制（自動跳格、退格回溯、貼上解析與驗證後跳轉）。
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  console.log("【來電送】首頁腳本已啟動，身分超連結已生效...");

  // 1. 彈窗元素選取
  const memberModal = document.getElementById("member-modal");
  const btnOpenMember = document.getElementById("btn-open-member-modal");
  const btnCloseMember = document.getElementById("btn-close-member-modal");
  const btnCancelMember = document.getElementById("btn-cancel-member");

  // 團員代碼輸入元件
  const formJoinGroup = document.getElementById("form-join-group");
  const codeDigits = Array.from(document.querySelectorAll(".code-digit"));
  const codeErrorMessage = document.getElementById("code-error-message");
  const memberDemoResult = document.getElementById("member-demo-result");
  const memberResultText = document.getElementById("member-result-text");
  const btnDirectGoMember = document.getElementById("btn-direct-go-member");

  // 2. 通用彈窗開啟/關閉管理器
  const openModal = (modalElement) => {
    if (!modalElement) return;
    modalElement.classList.add("active", "is-active");
    modalElement.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // 鎖定背景捲軸

    // 自動聚焦第一個輸入欄位
    if (codeDigits[0]) {
      setTimeout(() => codeDigits[0].focus(), 150);
    }
  };

  const closeModal = (modalElement) => {
    if (!modalElement) return;
    modalElement.classList.remove("active", "is-active");
    modalElement.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; // 恢復背景捲軸
  };

  // 3. 團員點擊開啟彈窗（阻止 <a> 原生跳轉，改由彈窗輸入 4 碼）
  if (btnOpenMember) {
    btnOpenMember.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(memberModal);
    });
  }

  // 團購主 (btn-go-host) 與商家 (btn-go-merchant) 採原生 <a> 跳轉，不進行 JS 攔截！

  // 關閉按鈕事件綁定
  [btnCloseMember, btnCancelMember].forEach((btn) => {
    btn?.addEventListener("click", () => closeModal(memberModal));
  });

  // 點擊遮罩背景關閉
  memberModal?.addEventListener("click", (e) => {
    if (e.target === memberModal) {
      closeModal(memberModal);
    }
  });

  // ESC 鍵關閉
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && memberModal?.classList.contains("active")) {
      closeModal(memberModal);
    }
  });

  // 4. 團員 4 碼輸入跳格控制
  codeDigits.forEach((digitInput, index) => {
    // 輸入時：過濾非英數、轉大寫、自動跳至下一格
    digitInput.addEventListener("input", () => {
      digitInput.value = digitInput.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      clearCodeError();

      if (digitInput.value.length === 1 && index < codeDigits.length - 1) {
        codeDigits[index + 1].focus();
      }
    });

    // 倒退鍵 (Backspace)：本格為空時回溯至上一格
    digitInput.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && digitInput.value === "" && index > 0) {
        codeDigits[index - 1].focus();
      }
    });

    // 剪貼簿貼上 (Paste)：支援一次貼上整組 4 碼代碼（如 "8825"）
    digitInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData("text").trim().toUpperCase();
      const cleanData = pastedData.replace(/[^A-Z0-9]/g, "").slice(0, 4);

      if (cleanData.length > 0) {
        cleanData.split("").forEach((char, charIdx) => {
          if (codeDigits[charIdx]) codeDigits[charIdx].value = char;
        });
        clearCodeError();
        const nextTargetIndex = Math.min(cleanData.length, codeDigits.length - 1);
        codeDigits[nextTargetIndex].focus();
      }
    });
  });

  const clearCodeError = () => {
    if (codeErrorMessage) {
      codeErrorMessage.style.display = "none";
      codeErrorMessage.textContent = "";
    }
    codeDigits.forEach((input) => input.classList.remove("has-error"));
  };

  const showCodeError = (msg) => {
    if (codeErrorMessage) {
      codeErrorMessage.style.display = "block";
      codeErrorMessage.textContent = msg;
    }
    codeDigits.forEach((input) => input.classList.add("has-error"));
  };

  const escapeHtml = (str) => {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // 5. 提交 4 碼表單並跳轉至 member.html
  formJoinGroup?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fullCode = codeDigits.map((input) => input.value.trim()).join("");

    if (fullCode.length === 0) {
      showCodeError("請輸入 4 位數團購代碼！");
      codeDigits[0]?.focus();
      return;
    }

    if (fullCode.length < 4) {
      showCodeError(`代碼長度不足，目前僅輸入 ${fullCode.length} 碼，請完整填寫 4 碼！`);
      const emptyInput = codeDigits.find((input) => input.value === "");
      if (emptyInput) emptyInput.focus();
      return;
    }

    const targetUrl = `member.html?code=${encodeURIComponent(fullCode)}`;
    clearCodeError();

    if (formJoinGroup) formJoinGroup.style.display = "none";
    if (memberDemoResult) memberDemoResult.style.display = "block";
    if (memberResultText) {
      memberResultText.innerHTML = `已鎖定團購代碼：<strong style="color: var(--color-primary); font-size: 1.25rem;">#${escapeHtml(fullCode)}</strong><br>即將載入西門町合作店家菜單...`;
    }
    if (btnDirectGoMember) btnDirectGoMember.href = targetUrl;

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 700);
  });
});