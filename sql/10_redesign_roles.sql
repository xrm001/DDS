-- ============================================
-- DDS 系统 - 重新设计 roles 表
-- 15个新角色，覆盖下单人管理层+接单人+组长
-- ============================================

-- 1. 解除 person_roles 外键约束（临时）
ALTER TABLE `person_roles` DROP FOREIGN KEY `fk_pr_role`;

-- 2. 将 role_name 从 ENUM 改为 VARCHAR（解除枚举限制）
ALTER TABLE `roles` 
MODIFY COLUMN `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称';

-- 3. 清空旧角色数据
DELETE FROM `person_roles`;
DELETE FROM `roles`;

-- 4. 重置自增ID
ALTER TABLE `roles` AUTO_INCREMENT = 1;

-- 5. 插入15个新角色
INSERT INTO `roles` (`role_code`, `role_name`, `description`) VALUES
-- 下单人角色（1-8）
('business_orderer',           '业务下单人',         '业务部门的订单创建人员'),
('business_supervisor',        '业务主管下单人',     '能管理对应部门业务下单人的所有订单'),
('operation_supervisor',       '运营主管下单人',     '能管理运营下单人的所有订单'),
('newmedia_supervisor',        '新媒体运营主管下单人','能管理新媒体运营下单人的所有订单'),
('business_dept_manager',      '业务部门经理',       '能管理对应部门的业务下单人+业务主管的所有订单'),
('operation_dept_manager',     '市场运营部门经理',   '能管理运营下单人+运营主管+新媒体运营下单人+新媒体运营主管所有订单'),
('sales_center_manager',       '销售中心经理',       '能管理所有业务角色的订单'),
('brand_operation_center_manager', '品牌&运营中心经理', '能管理所有运营+新媒体运营角色的订单'),
-- 接单人角色（9-14）
('design_dept_manager',        '设计部经理',         '管理所有接单人和接单组长'),
('receiver_3d',                '3D接单人',           '负责3D设计任务执行'),
('receiver_graphic',           '平面接单人',         '负责平面设计任务执行'),
('receiver_brand',             '全案设计接单人',     '负责全案设计任务执行'),
('receiver_package',           '包装盒设计接单人',   '负责包装盒设计任务执行'),
('receiver_shop',              '店铺设计接单人',     '负责店铺设计任务执行'),
('receiver_team_leader',       '接单组长',           '接单团队组长，协助管理接单人'),
('receiver_photo',             '摄影接单人',         '负责摄影任务执行');

-- 6. 恢复 person_roles 外键约束
ALTER TABLE `person_roles` 
ADD CONSTRAINT `fk_pr_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

-- 7. 验证
SELECT id, role_code, role_name, description FROM roles ORDER BY id;
