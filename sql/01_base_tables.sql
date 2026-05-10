-- ============================================
-- DDS 系统 - 第一批：基础字典表
-- 包含：roles（角色定义表）、task_types（任务类型字典表）
-- 依赖：无（仅依赖已有表 person，但不创建外键）
-- 执行顺序：最先执行
-- ============================================

-- --------------------------------------------
-- roles 角色定义表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色编码',
  `role_name` enum('业务下单人','运营下单人','3D接单人','平面接单人','品牌接单人','摄影接单人','负责人','系统管理员') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '角色描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色定义表';

-- --------------------------------------------
-- task_types 任务类型字典表
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `task_types` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type_name` enum('平面设计','全案设计','3D设计','摄影') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务类型名称',
  `type_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '代码标识',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_code` (`type_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务类型字典表';

-- ============================================
-- 样例数据
-- ============================================

-- roles 角色定义（8条）
INSERT IGNORE INTO `roles` (`role_code`, `role_name`, `description`) VALUES
('business_orderer', '业务下单人', '业务部门的订单创建人员'),
('operation_orderer', '运营下单人', '运营部门的订单创建人员'),
('receiver_3d', '3D接单人', '负责3D设计任务执行'),
('receiver_graphic', '平面接单人', '负责平面设计任务执行'),
('receiver_brand', '品牌接单人', '负责全案设计和品牌设计任务执行'),
('receiver_photo', '摄影接单人', '负责摄影任务执行'),
('manager', '负责人', '拥有全部订单管理权限和数据统计权限'),
('admin', '系统管理员', '系统配置和管理权限');

-- task_types 任务类型（4条）
INSERT IGNORE INTO `task_types` (`type_name`, `type_code`) VALUES
('平面设计', 'graphic'),
('全案设计', 'brand'),
('3D设计', '3d'),
('摄影', 'photo');
