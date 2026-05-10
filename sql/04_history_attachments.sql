-- ============================================
-- DDS 系统 - 第四批：状态历史 + 附件表
-- 包含：order_status_history、attachments
-- 依赖：orders（第三批）、person（已有）
-- 执行顺序：在 03_orders.sql 之后执行
-- ============================================

-- --------------------------------------------
-- order_status_history 订单状态变更历史
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` int NOT NULL COMMENT '订单ID',
  `from_status` tinyint DEFAULT NULL COMMENT '变更前状态',
  `to_status` tinyint NOT NULL COMMENT '变更后状态',
  `operator_id` int NOT NULL COMMENT '操作人ID',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
  PRIMARY KEY (`id`),
  KEY `idx_osh_order_id` (`order_id`),
  KEY `idx_osh_operator_id` (`operator_id`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osh_operator` FOREIGN KEY (`operator_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单状态变更历史';

-- --------------------------------------------
-- attachments 附件/文件表（订单专用）
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `uploader_id` int NOT NULL COMMENT '上传人ID',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '原始文件名',
  `oss_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'OSS存储路径/Key',
  `file_type` tinyint NOT NULL COMMENT '1=过程文件, 2=成果文件, 3=其他',
  `file_size` bigint DEFAULT NULL COMMENT '文件大小（字节）',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MIME类型',
  `is_deleted` tinyint DEFAULT '0' COMMENT '0=正常, 1=删除',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`id`),
  KEY `idx_att_order_id` (`order_id`),
  KEY `idx_att_uploader_id` (`uploader_id`),
  KEY `idx_att_file_type` (`file_type`),
  CONSTRAINT `fk_att_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单附件表';

-- ============================================
-- 样例数据
-- ============================================

-- order_status_history（6条）
INSERT IGNORE INTO `order_status_history` (`order_id`, `from_status`, `to_status`, `operator_id`, `remark`) VALUES
(1, NULL, 0, 2, '创建订单'),
(1, 0, 1, 9, '系统自动派单'),
(1, 1, 2, 6, '接单人确认接单'),
(1, 2, 3, 6, '提交设计成果'),
(1, 3, 4, 2, '验收通过，订单完结'),
(2, NULL, 0, 2, '创建订单');

-- attachments（3条）
INSERT IGNORE INTO `attachments` (`order_id`, `uploader_id`, `file_name`, `oss_key`, `file_type`, `file_size`, `mime_type`) VALUES
(1, 2, '参考图-科技感海报.jpg', 'orders/2025/05/DDS20250509001/ref_001.jpg', 3, 2048000, 'image/jpeg'),
(2, 2, '手机3D模型参考.obj', 'orders/2025/05/DDS20250509002/model_ref.obj', 3, 5242880, 'application/octet-stream'),
(3, 3, '品牌VI规范手册.pdf', 'orders/2025/05/DDS20250509003/vi_manual.pdf', 1, 10485760, 'application/pdf');
