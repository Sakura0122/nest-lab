CREATE DATABASE IF NOT EXISTS `nest-lab`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nest-lab`;

SET NAMES utf8mb4;

-- 用户表
CREATE TABLE IF NOT EXISTS `users`
(
    `id`              CHAR(36)     NOT NULL COMMENT '业务表主键 UUID',
    `username`        VARCHAR(50)  NOT NULL COMMENT '用户名',
    `email`           VARCHAR(100) NOT NULL COMMENT '邮箱',
    `hashed_password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
    `is_active`       TINYINT(1)   NOT NULL COMMENT '是否启用',
    `is_superuser`    TINYINT(1)   NOT NULL COMMENT '是否为超级管理员',
    `last_login`      DATETIME     NULL COMMENT '最后登录时间',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at`      DATETIME     NULL COMMENT '软删除时间，为空表示未删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `ix_users_email` (`email`),
    UNIQUE KEY `ix_users_username` (`username`)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
    COMMENT = '用户表';

-- 权限表
CREATE TABLE IF NOT EXISTS `permissions`
(
    `id`          CHAR(36)     NOT NULL COMMENT '业务表主键 UUID',
    `code`        VARCHAR(100) NOT NULL COMMENT '权限编码',
    `name`        VARCHAR(100) NOT NULL COMMENT '权限名称',
    `parent_id`   CHAR(36)     NULL COMMENT '父级权限 UUID，顶级权限为空',
    `type`        TINYINT      NOT NULL COMMENT '权限类型: 1目录, 2菜单, 3按钮',
    `description` VARCHAR(200) NULL COMMENT '权限描述',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at`  DATETIME     NULL COMMENT '软删除时间，为空表示未删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_permissions_code` (`code`)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
    COMMENT = '权限表';

-- 角色表
CREATE TABLE IF NOT EXISTS `roles`
(
    `id`          CHAR(36)     NOT NULL COMMENT '业务表主键 UUID',
    `code`        VARCHAR(100) NOT NULL COMMENT '角色编码',
    `name`        VARCHAR(100) NOT NULL COMMENT '角色名称',
    `description` VARCHAR(200) NULL COMMENT '角色描述',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at`  DATETIME     NULL COMMENT '软删除时间，为空表示未删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_roles_code` (`code`)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
    COMMENT = '角色表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions`
(
    `id`            CHAR(36) NOT NULL COMMENT '业务表主键 UUID',
    `role_id`       CHAR(36) NOT NULL COMMENT '角色 UUID',
    `permission_id` CHAR(36) NOT NULL COMMENT '权限 UUID',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_role_permissions_pair` (`role_id`, `permission_id`)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
    COMMENT = '角色权限关联表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `user_roles`
(
    `id`         CHAR(36) NOT NULL COMMENT '业务表主键 UUID',
    `user_id`    CHAR(36) NOT NULL COMMENT '用户 UUID',
    `role_id`    CHAR(36) NOT NULL COMMENT '角色 UUID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_user_roles_pair` (`user_id`, `role_id`)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
    COMMENT = '用户角色关联表';
