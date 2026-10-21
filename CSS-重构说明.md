# CSS 重构说明

## 📋 概述

原本的 `style.css` (4286行) 已拆分为模块化的 CSS 文件结构，方便版本控制和多人协作开发。

## 📁 新的文件结构

```
css/
├── variables.css      # CSS 变量定义（设计系统）
├── base.css          # 基础样式、按钮、Header、Footer、表单、弹窗
├── index.css         # 首页专属样式
├── member.css        # 团员点餐页专属样式
├── host.css          # 主办人后台专属样式
├── merchant.css      # 商家后台专属样式
├── responsive.css    # 响应式样式（RWD）
└── style.css         # 旧文件（保留作为备份）
```

## 🎯 各文件说明

### 1. `variables.css`
**内容**：CSS 自订变量（Design Tokens）
- 品牌核心色彩
- 中性背景与文字色彩
- 字体家族
- 圆角系统
- 阴影系统
- 动画过渡

**适用范围**：所有页面

---

### 2. `base.css`
**内容**：基础全域排版与共用元件
- Reset 样式
- 基础排版（body、container、工具类）
- 顶部导航列（Site Header）
- 按钮系统（Buttons）
- 状态标签（Pills & Badges）
- 表单控制（Forms）
- 弹窗系统（Modals）
- Toast 提示条
- 页脚（Site Footer）

**适用范围**：所有页面

---

### 3. `index.css`
**内容**：首页专属样式
- Hero 主视觉区块
- 三身份角色卡片网格
- 4 码加入团购输入
- Demo 演示提示

**适用页面**：`index.html`

---

### 4. `member.css`
**内容**：团员点餐页专属样式
- 代码验证输入
- 团购即时状态看板
- 选餐网格
- 规格弹窗
- 购物车侧边栏
- 今日不参加横幅
- 送单成功凭证卡片

**适用页面**：`member.html`

---

### 5. `host.css`
**内容**：主办人后台专属样式
- 发起开团表单
- 进度时间轴轨道（Timeline）
- 代码分享栏
- 凑单阶梯进度
- 订单明细/厨房分页
- 现场收款核对

**适用页面**：`host.html`

---

### 6. `merchant.css`
**内容**：商家管理后台专属样式
- 双轨沙盒指引（传统/新店家）
- 开店导引精灵（Onboarding Wizard）
- 排程出餐条列
- 历史订单归档
- 菜单管理
- 规格分组建造器
- 供餐门槛设定

**适用页面**：`merchant.html`

---

### 7. `responsive.css`
**内容**：全站多阶断点响应式设计
- 平板中螢幕（<= 960px）
- 时间轴平板适配（<= 820px）
- 手机版排版（<= 640px）
- 窄螢幕手机（<= 480px）

**适用范围**：所有页面

---

## 🔗 HTML 引用方式

### index.html（首页）
```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/index.css">
<link rel="stylesheet" href="css/responsive.css">
```

### member.html（团员点餐页）
```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/member.css">
<link rel="stylesheet" href="css/responsive.css">
```

### host.html（主办人后台）
```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/host.css">
<link rel="stylesheet" href="css/responsive.css">
```

### merchant.html（商家后台）
```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/merchant.css">
<link rel="stylesheet" href="css/responsive.css">
```

---

## ✅ 重构优势

### 1. **Git 版本控制更清晰**
- 不同页面的样式修改不会相互冲突
- 每次 commit 只影响相关的 CSS 文件
- diff 比较更精准，易于 code review

### 2. **维护性提升**
- 各页面样式独立，修改时不会影响其他页面
- 共用样式（base.css）统一管理，修改一次即可全站生效
- 文件职责清晰，查找样式更快速

### 3. **性能优化潜力**
- 未来可按需加载 CSS
- 减少不必要的样式解析
- 方便做 CSS 压缩和合并

### 4. **团队协作友好**
- 不同开发者可以同时修改不同页面的样式
- 减少 merge conflict 机会
- 新成员更容易理解项目结构

---

## 📝 开发规范建议

### 修改样式时的流程：
1. **确认样式属于哪个文件**：
   - 共用组件 → `base.css`
   - 颜色/字体变量 → `variables.css`
   - 页面专属 → 对应页面的 CSS 文件
   - 响应式适配 → `responsive.css`

2. **避免跨文件重复样式**：
   - 如果多个页面都需要某个组件，应该放在 `base.css`
   - 如果只是某页面的特殊变体，放在页面专属 CSS

3. **变量优先原则**：
   - 新增颜色时，优先考虑是否应该加入 `variables.css`
   - 使用 CSS 变量（`var(--color-primary)`）而非写死颜色值

---

## 🔄 回滚方案

如果新结构有问题，可以临时回滚到旧的 `style.css`：

```html
<!-- 注释掉新的引用 -->
<!-- <link rel="stylesheet" href="css/variables.css"> -->
<!-- <link rel="stylesheet" href="css/base.css"> -->
<!-- <link rel="stylesheet" href="css/member.css"> -->
<!-- <link rel="stylesheet" href="css/responsive.css"> -->

<!-- 启用旧的单一文件 -->
<link rel="stylesheet" href="css/style.css">
```

---

## 📅 重构日期

**2026-10-21**

---

## 👨‍💻 备注

- 旧的 `style.css` 已保留作为备份，未来确认无误后可删除
- 所有 HTML 文件已更新为新的 CSS 引用结构
- 建议测试所有页面功能，确保样式显示正常
