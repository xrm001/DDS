-- ============================================
-- DDS 系统 - 第五批：消息 + 评价表
-- 包含：messages、evaluations
-- 依赖：orders（第三批）、person（已有）、attachments（第四批）
-- 执行顺序：在 04_history_attachments.sql 之后执行
-- ============================================

-- --------------------------------------------
-- messages 订单沟通消息表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` int NOT NULL COMMENT '订单ID',
  `sender_id` int NOT NULL COMMENT '发送人ID',
  `receiver_id` int DEFAULT NULL COMMENT '接收人ID（派单前为NULL）',
  `content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文字内容',
  `attachment_id` int DEFAULT NULL COMMENT '关联的图片附件ID',
  `is_read` tinyint DEFAULT '0' COMMENT '0=未读,1=已读',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_msg_order_id` (`order_id`),
  KEY `idx_msg_sender_id` (`sender_id`),
  KEY `idx_msg_receiver_id` (`receiver_id`),
  KEY `idx_msg_created_at` (`created_at`),
  CONSTRAINT `fk_msg_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_msg_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `person` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_attachment` FOREIGN KEY (`attachment_id`) REFERENCES `attachments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单沟通消息表';

-- --------------------------------------------
-- evaluations 评价表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` int NOT NULL COMMENT '订单ID',
  `evaluator_id` int NOT NULL COMMENT '评价人ID',
  `evaluatee_id` int NOT NULL COMMENT '被评价人ID',
  `eval_type` tinyint NOT NULL COMMENT '1=下单人评接单人, 2=接单人评下单人',
  `score_completion` tinyint DEFAULT NULL COMMENT '完成度（1-5星）',
  `score_communication_creator` tinyint DEFAULT NULL COMMENT '沟通-下单人评（1-5星）',
  `score_understanding` tinyint DEFAULT NULL COMMENT '任务理解（1-5星）',
  `score_technical` tinyint DEFAULT NULL COMMENT '技术（1-5星）',
  `score_design` tinyint DEFAULT NULL COMMENT '设计（1-5星）',
  `score_requirement` tinyint DEFAULT NULL COMMENT '需求描述（1-5星）',
  `score_attachment` tinyint DEFAULT NULL COMMENT '附件提供（1-5星）',
  `score_communication_receiver` tinyint DEFAULT NULL COMMENT '沟通-接单人评（1-5星）',
  `score_timeliness` tinyint DEFAULT NULL COMMENT '确认及时性（1-5星）',
  `overall_score` decimal(3,2) NOT NULL COMMENT '综合得分',
  `comment` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '文字评价',
  `is_visible_to_evaluatee` tinyint DEFAULT '0' COMMENT '0=不可见,1=可见',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评价时间',
  PRIMARY KEY (`id`),
  KEY `idx_eval_order_id` (`order_id`),
  KEY `idx_evaluator_id` (`evaluator_id`),
  KEY `idx_evaluatee_id` (`evaluatee_id`),
  KEY `idx_eval_type` (`eval_type`),
  CONSTRAINT `fk_eval_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eval_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_eval_evaluatee` FOREIGN KEY (`evaluatee_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

-- ============================================
-- 样例数据
-- ============================================

-- messages 沟通消息（4条）
INSERT IGNORE INTO `messages` (`order_id`, `sender_id`, `receiver_id`, `content`, `attachment_id`) VALUES
(1, 2, 6, '请查看需求文档，有参考图在附件中', NULL),
(1, 6, 2, '收到，请问主色调有偏好吗？', NULL),
(2, 2, 4, '3D模型文件已上传，请参考', NULL),
(3, 3, 7, '品牌全案需求比较紧急，请优先处理', NULL);

-- evaluations 评价（2条）
-- 下单人评接单人
INSERT IGNORE INTO `evaluations` (`order_id`, `evaluator_id`, `evaluatee_id`, `eval_type`, `score_completion`, `score_communication_creator`, `score_understanding`, `score_technical`, `score_design`, `overall_score`, `comment`) VALUES
(1, 2, 6, 1, 5, 5, 4, 5, 5, 4.80, '设计效果非常出色，沟通顺畅，建议继续保持');

-- 接单人评下单人
INSERT IGNORE INTO `evaluations` (`order_id`, `evaluator_id`, `evaluatee_id`, `eval_type`, `score_requirement`, `score_attachment`, `score_communication_receiver`, `score_timeliness`, `overall_score`, `comment`) VALUES
(1, 6, 2, 2, 4, 5, 5, 4, 4.50, '需求描述清晰，附件齐全，确认也比较及时');

-- 更新订单评价状态
UPDATE `orders` SET `is_evaluated_by_creator` = 1, `is_evaluated_by_receiver` = 1 WHERE `id` = 1;
