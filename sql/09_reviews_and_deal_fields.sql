-- ============================================
-- DDS 系统 - 第九批：订单审核 + 成交字段扩展
-- 包含：
--   1. order_reviews 订单审核表（独立表）
--   2. orders 表新增 deal_status + deal_amount 字段
-- 依赖：orders、person 表
-- 执行顺序：在 08_notifications.sql 之后执行
-- ============================================

-- --------------------------------------------
-- 1. order_reviews 订单审核表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `order_reviews` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '审核记录ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `review_round` int NOT NULL DEFAULT '1' COMMENT '审核轮次（驳回重新提交+1）',
  `review_type` tinyint NOT NULL DEFAULT '1' COMMENT '1=验收审核',
  `review_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `review_remark` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审核意见/驳回原因',
  `submitted_at` datetime NOT NULL COMMENT '接单人提交成果时间',
  `reviewed_at` datetime DEFAULT NULL COMMENT '下单人审核时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_review_order_id` (`order_id`),
  KEY `idx_review_status` (`review_status`),
  CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单审核表';

-- --------------------------------------------
-- 2. orders 表新增成交状态 + 成交金额字段
-- --------------------------------------------
ALTER TABLE `orders`
  ADD COLUMN `deal_status` tinyint DEFAULT '7' COMMENT '成交状态: 7=待确认, 8=谈单中, 9=已成交, 10=未成交' AFTER `completed_at`,
  ADD COLUMN `deal_amount` decimal(12,2) DEFAULT NULL COMMENT '成交金额' AFTER `deal_status`,
  ADD COLUMN `currency` enum('CNY','USD') DEFAULT 'CNY' COMMENT '币种' AFTER `deal_amount`;

-- ============================================
-- 说明
-- ============================================
-- 1. order_reviews 表用于替代 orders.acceptance_history JSON字段
--    - review_round: 第1轮提交审核=1，驳回后重新提交=2，以此类推
--    - review_status: pending(待审核) → approved(通过) 或 rejected(驳回)
--    - 驳回后订单状态回退为"进行中"(2)，接单人修改后重新提交生成新轮次
--    - reviewer_id 和 submitter_id 通过 JOIN orders 表获取（creator_id/receiver_id）
--
-- 2. orders.deal_status 字段说明:
--    - 7 (待确认): 订单完成后默认状态，3天内需更新
--    - 8 (谈单中): 正在洽谈价格
--    - 9 (已成交): 确认成交，触发通知
--    - 10 (未成交): 洽谈失败
--
-- 3. 迁移后需删除 orders.acceptance_history 字段（可选，建议先验证功能）
--    ALTER TABLE orders DROP COLUMN acceptance_history;
--
-- 4. 查询审核记录示例：
--    SELECT r.*, o.order_no, o.creator_id AS reviewer_id, o.receiver_id AS submitter_id
--    FROM order_reviews r
--    JOIN orders o ON r.order_id = o.id
--    WHERE o.id = ?
--    ORDER BY r.review_round DESC;
