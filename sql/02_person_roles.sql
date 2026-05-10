-- ============================================
-- DDS 系统 - 第二批：人员角色关联表
-- 包含：person_roles
-- 依赖：person（已有）、roles（第一批）
-- 执行顺序：在 01_base_tables.sql 之后执行
-- ============================================

CREATE TABLE IF NOT EXISTS `person_roles` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `person_id` int NOT NULL COMMENT '人员ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关联时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_person_role` (`person_id`, `role_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_pr_person` FOREIGN KEY (`person_id`) REFERENCES `person` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人员角色关联表';

-- ============================================
-- 样例数据：人员角色关联（11条）
-- 说明：假设 person 表中 id=1~11 的人员存在
-- ============================================
INSERT IGNORE INTO `person_roles` (`person_id`, `role_id`) VALUES
(1, 8),
(2, 1),
(3, 2),
(4, 3),
(5, 3),
(6, 4),
(7, 5),
(8, 6),
(9, 7),
(10, 1),
(10, 4);
