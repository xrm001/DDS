-- ===========================================
-- 插队申请表（Cut-in-line Requests）
-- ===========================================

CREATE TABLE IF NOT EXISTS `cut_in_line_requests` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `creator_id` int NOT NULL COMMENT '插队人（下单人）ID',
  `order_id` int NOT NULL COMMENT '插队订单ID',
  `target_order_id` int NOT NULL COMMENT '被插队订单ID',
  `receiver_id` int DEFAULT NULL COMMENT '接单人ID',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0=待处理,1=已同意,2=已拒绝',
  `reason` varchar(500) DEFAULT NULL COMMENT '插队理由',
  `response_reason` varchar(500) DEFAULT NULL COMMENT '同意/拒绝原因',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `responded_at` timestamp NULL DEFAULT NULL COMMENT '响应时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_target_order_id` (`target_order_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_cut_creator` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cut_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cut_target_order` FOREIGN KEY (`target_order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='插队申请表';

-- 说明：
-- 1. creator_id: 插队人（下单人），关联 person 表
-- 2. order_id: 插队订单号，关联 orders 表的 id
-- 3. target_order_id: 被插队订单号，关联 orders 表的 id（原排队首位的订单）
-- 4. receiver_id: 接单人ID，用于筛选和通知
-- 5. status: 0=待处理, 1=已同意, 2=已拒绝
-- 6. reason: 插队理由（可选）
-- 7. response_reason: 同意或拒绝的原因（可选）
