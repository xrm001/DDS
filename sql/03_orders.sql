-- ============================================
-- DDS 系统 - 第三批：订单核心表
-- 包含：orders（订单主表）
-- 依赖：task_types（第一批）、person（已有）
-- 执行顺序：在 01_base_tables.sql 之后执行
-- ============================================

CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `order_type` tinyint NOT NULL DEFAULT '1' COMMENT '1=原始单, 2=修改单',
  `original_order_id` int DEFAULT NULL COMMENT '修改单关联的原始订单ID',
  `task_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务名称',
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户名称',
  `customer_region` enum(
    '中国','中国香港','中国澳门','中国台湾',
    '阿富汗','阿尔巴尼亚','阿尔及利亚','安道尔','安哥拉','安提瓜和巴布达',
    '阿根廷','亚美尼亚','澳大利亚','奥地利','阿塞拜疆','巴哈马','巴林',
    '孟加拉国','巴巴多斯','白俄罗斯','比利时','伯利兹','贝宁','不丹',
    '玻利维亚','波斯尼亚和黑塞哥维那','博茨瓦纳','巴西','文莱','保加利亚',
    '布基纳法索','布隆迪','佛得角','柬埔寨','喀麦隆','加拿大','中非',
    '乍得','智利','哥伦比亚','科摩罗','刚果（布）','刚果（金）','哥斯达黎加',
    '克罗地亚','古巴','塞浦路斯','捷克','丹麦','吉布提','多米尼克',
    '多米尼加','厄瓜多尔','埃及','萨尔瓦多','赤道几内亚','厄立特里亚','爱沙尼亚',
    '斯威士兰','埃塞俄比亚','斐济','芬兰','法国','加蓬','冈比亚','格鲁吉亚',
    '德国','加纳','希腊','格林纳达','危地马拉','几内亚','几内亚比绍',
    '圭亚那','海地','洪都拉斯','匈牙利','冰岛','印度','印度尼西亚',
    '伊朗','伊拉克','爱尔兰','以色列','意大利','牙买加','日本','约旦',
    '哈萨克斯坦','肯尼亚','基里巴斯','朝鲜','韩国','科威特','吉尔吉斯斯坦',
    '老挝','拉脱维亚','黎巴嫩','莱索托','利比里亚','利比亚','列支敦士登',
    '立陶宛','卢森堡','马达加斯加','马拉维','马来西亚','马尔代夫','马里',
    '马耳他','马绍尔群岛','毛里塔尼亚','毛里求斯','墨西哥','密克罗尼西亚',
    '摩尔多瓦','摩纳哥','蒙古','黑山','摩洛哥','莫桑比克','缅甸','纳米比亚',
    '瑙鲁','尼泊尔','荷兰','新西兰','尼加拉瓜','尼日尔','尼日利亚',
    '北马其顿','挪威','阿曼','巴基斯坦','帕劳','巴拿马','巴布亚新几内亚',
    '巴拉圭','秘鲁','菲律宾','波兰','葡萄牙','卡塔尔','罗马尼亚','俄罗斯',
    '卢旺达','圣基茨和尼维斯','圣卢西亚','圣文森特和格林纳丁斯','萨摩亚',
    '圣马力诺','圣多美和普林西比','沙特阿拉伯','塞内加尔','塞尔维亚','塞舌尔',
    '塞拉利昂','新加坡','斯洛伐克','斯洛文尼亚','所罗门群岛','索马里','南非',
    '南苏丹','西班牙','斯里兰卡','苏丹','苏里南','瑞典','瑞士','叙利亚',
    '塔吉克斯坦','坦桑尼亚','泰国','东帝汶','多哥','汤加','特立尼达和多巴哥',
    '突尼斯','土耳其','土库曼斯坦','图瓦卢','乌干达','乌克兰','阿联酋',
    '英国','美国','乌拉圭','乌兹别克斯坦','瓦努阿图','委内瑞拉','越南',
    '也门','赞比亚','津巴布韦'
  ) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户国籍/地区',
  `task_type_id` int NOT NULL COMMENT '任务类型ID',
  `priority` tinyint NOT NULL DEFAULT '2' COMMENT '1=低, 2=普通, 3=紧急',
  `deadline` timestamp NULL DEFAULT NULL COMMENT '截止日期',
  `requirement_desc` text COLLATE utf8mb4_unicode_ci COMMENT '需求描述',
  `creator_id` int NOT NULL COMMENT '下单人ID',
  `receiver_id` int DEFAULT NULL COMMENT '接单人ID',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0=待派单,1=待接单,2=进行中,3=待验收,4=已完成,5=已拒绝,6=已取消',
  `is_evaluated_by_creator` tinyint DEFAULT '0' COMMENT '0=未评价,1=已评价',
  `is_evaluated_by_receiver` tinyint DEFAULT '0' COMMENT '0=未评价,1=已评价',
  `reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒单原因',
  `cancel_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '取消原因',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '实际完成时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_task_type_id` (`task_type_id`),
  KEY `idx_status` (`status`),
  KEY `idx_original_order_id` (`original_order_id`),
  CONSTRAINT `fk_order_creator` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `person` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_original` FOREIGN KEY (`original_order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_order_task_type` FOREIGN KEY (`task_type_id`) REFERENCES `task_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- ============================================
-- 样例数据：orders（5条）
-- 说明：creator_id 和 receiver_id 引用 person 表中已有人员
-- ============================================
INSERT IGNORE INTO `orders` (`order_no`, `order_type`, `task_name`, `customer_name`, `customer_region`, `task_type_id`, `priority`, `deadline`, `requirement_desc`, `creator_id`, `receiver_id`, `status`) VALUES
('DDS20250509001', 1, '新品宣传海报设计', '华为', '中国', 1, 3, '2025-05-20 18:00:00', '设计一款夏季新品宣传海报，尺寸A1，需体现科技感', 2, 6, 4),
('DDS20250509002', 1, '产品3D渲染图', '小米', '中国', 3, 2, '2025-05-25 12:00:00', '手机产品3D渲染图，需要6个角度', 2, 4, 2),
('DDS20250509003', 1, '品牌全案设计', 'Apple', '美国', 2, 3, '2025-05-15 10:00:00', '年度品牌视觉升级全案，包含VI系统和应用规范', 3, 7, 3),
('DDS20250509004', 1, '产品摄影', 'Sony', '日本', 4, 1, '2025-06-01 15:00:00', '耳机产品白底图摄影，需要20张精修', 3, 8, 1),
('DDS20250509005', 2, '新品宣传海报设计-修改', '华为', '中国', 1, 2, '2025-05-22 18:00:00', '调整色调为冷色系，更换主视觉元素', 2, 6, 2);

-- 更新修改单的 original_order_id
UPDATE `orders` SET `original_order_id` = 1 WHERE `id` = 5;
