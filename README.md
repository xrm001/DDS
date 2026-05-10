# DDS - 视觉设计派单管理系统

> Design Dispatch System - 公司内部视觉设计任务订单的派发与管理系统

## 项目简介

DDS系统针对公司营销部门在产品营销过程中需要用到的产品视觉设计（3D设计、平面设计、全案设计、摄影），实现需求任务的派发、执行、验收的全流程监控与管理。

## 技术栈

- **前端**: Vite + React
- **后端**: Node.js + Express
- **数据库**: 阿里云 RDS MySQL
- **对象存储**: 阿里云 OSS

## 项目结构

```
DDS/
├── backend/          # Node.js + Express 后端API
│   ├── db/           # 数据库连接池
│   ├── routes/       # 路由模块
│   └── server.js     # 服务入口
├── frontend/         # Vite + React 前端
│   ├── src/
│   │   ├── pages/    # 页面组件
│   │   └── App.jsx
│   └── vite.config.js
├── sql/              # 数据库初始化脚本
│   ├── 01_base_tables.sql
│   ├── 02_person_roles.sql
│   ├── 03_orders.sql
│   ├── 04_history_attachments.sql
│   └── 05_messages_evaluations.sql
└── .env.example      # 环境变量模板
```

## 角色体系

| 角色 | 职责 |
|---|---|
| 业务下单人 / 运营下单人 | 创建订单、沟通、验收、评价 |
| 3D / 平面 / 品牌 / 摄影接单人 | 接单、执行任务、提交成果、评价 |
| 负责人 | 全局监控、数据统计 |
| 系统管理员 | 系统配置、人员/部门管理 |

## 快速开始

### 1. 配置环境变量

复制 `.env.example` 为 `.env`，填入阿里云 RDS 和 OSS 配置：

```bash
cp .env.example .env
```

### 2. 初始化数据库

按顺序在 RDS 中执行 `sql/` 目录下的 SQL 文件：

```
01_base_tables.sql → 02_person_roles.sql → 03_orders.sql
→ 04_history_attachments.sql → 05_messages_evaluations.sql
```

### 3. 启动后端

```bash
cd backend
npm install
node server.js
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173 进入登录页。

## 业务流程

```
下单 → 自动派单 → 接单执行 → 沟通/提交 → 完结 → 双向评价 →（可选）修改单
```
