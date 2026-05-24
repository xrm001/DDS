-- ===========================================
-- 通知中心表（Notifications）
-- ===========================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` int NOT NULL COMMENT '接收人ID（关联person.id）',
  `notify` varchar(500) NOT NULL COMMENT '通知内容',
  `is_read` tinyint NOT NULL DEFAULT '0' COMMENT '0=未读, 1=已读',
  `type` tinyint DEFAULT '0' COMMENT '通知类型：0=系统通知, 1=插队申请, 2=插队响应, 3=订单状态变更, 4=验收通知',
  `related_order_id` int DEFAULT NULL COMMENT '关联订单ID',
  `related_user_id` int DEFAULT NULL COMMENT '关联用户ID（如插队申请人）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_related_order_id` (`related_order_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `person` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_order` FOREIGN KEY (`related_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知中心表';

-- 说明：
-- 1. id: 主键ID
-- 2. user_id: 接收人ID，关联 person 表
-- 3. notify: 通知内容（varchar(500)）
-- 4. is_read: 已读状态 0=未读, 1=已读
-- 5. type: 通知类型
-- 6. related_order_id: 关联订单ID（可选）
-- 7. related_user_id: 关联用户ID（可选，如插队申请人）
-- 8. created_at: 创建时间
-- 9. read_at: 阅读时间（已读时记录）