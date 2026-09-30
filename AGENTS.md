# AGENTS.md

本文件用于约束在本仓库中工作的 AI 编码代理。除非用户明确提出例外，以下规则均为强制要求。

## 1. 项目结构与技术栈

- 本项目使用 TypeScript 和 pnpm workspace；使用 `pnpm` 执行命令和管理依赖，不混用 npm、yarn 或其他锁文件。
- `apps/api`：NestJS 后端，使用 `class-validator`、`class-transformer`、`@nestjs/swagger`、Drizzle ORM 和 MySQL。
- `apps/web`：React + Vite 前端，使用函数组件、Hooks 和现有 CSS 方案，已启用 React Compiler。
- `packages/shared`：存放前后端共用的请求、响应等接口契约，按业务模块组织纯 TypeScript 类型；按实际需求添加，不提前搭建抽象层。
- 代码检查使用 Oxlint，格式化使用 Oxfmt；遵循现有配置，不自行添加 ESLint 或 Prettier。
- 后端遵循现有 ESM 导入方式，相对模块导入使用 `.js` 扩展名；前端遵循 Vite 和当前 TypeScript 配置。
- 类、组件和类型使用 PascalCase，变量、方法和接口字段沿用 camelCase；数据库列名沿用 snake_case。
- 已知数据结构必须定义明确类型，不使用 `any`、宽泛对象或类型断言绕过检查；外部未知数据使用 `unknown` 并收窄类型。

## 2. 后端分层规范

新增代码应放入对应业务模块 `apps/api/src/modules/<模块名>`，按职责组织：

- `*.module.ts`：组织模块、控制器、Provider 和依赖导出。
- `*.controller.ts`：接收和校验参数、调用 Service、转换响应；不编写数据库查询或复杂业务逻辑。
- `*.service.ts`：业务规则、流程编排和事务边界。
- `*.repository.ts`：数据访问、查询条件和持久化操作，按需复用现有 `BaseRepository`。
- `*.schema.ts`：Drizzle 数据表定义，不用于放置请求与响应 DTO。
- `*.dto.ts` 或模块内的 `dto/`：后端运行时校验和 Swagger 所需的 DTO class，实现 `packages/shared` 中对应的接口契约，遵循所在模块已有组织方式。

公共响应、分页和业务异常复用 `src/common`，基础设施放在 `src/infra`，应用级配置沿用 `src/core`。不要为了简单功能创建没有实际职责的文件或层级。

- 使用 NestJS 依赖注入，通过构造方法声明依赖，不在 Controller 或 Service 中手动实例化 Repository、数据库连接等依赖。
- 数据库读写使用 Drizzle；参数化查询，不将用户输入直接拼接为 SQL。
- 排序字段、搜索字段等动态列名必须映射到允许使用的表字段，不直接信任客户端输入。
- 复用已有表字段和软删除约定；多次写入需要保持一致性时，由 Service 确定事务边界，相关 Repository 操作使用同一事务。
- 不因编写规范或实现无关功能而修改现有数据库结构。

## 3. 接口设计规范

### 3.1 Controller 与统一响应

- 使用 `@Controller` 按业务资源拆分接口；单词之间使用连字符，不使用下划线。
- 优先使用POST请求，有特殊需求时主动提出原因。
- 涉及异步调用的接口使用 `async`，明确声明 `Promise<Result<具体响应类型>>`；同步方法不为形式统一而添加 `async`。
- 所有业务接口使用 `src/common/result.ts` 中的 `Result<T>`，通过 `Result.success` 返回成功结果，不直接返回数据库记录或自行拼接响应结构。
- 业务错误抛出已有 `BusinessException`，错误码使用 `ResultCodeEnum` 中定义的值；复用全局异常过滤器，不在接口中吞掉异常或重复包装错误响应。
- 分页复用 `PageRequest`、`PageResult<T>` 及现有字段命名；补充所需校验和文档，不另起一套分页协议。

### 3.2 参数与 DTO

- 前后端共用的请求类型以 `Request` 结尾，响应类型以 `Response` 结尾，定义在 `packages/shared` 中；不得在前后端各自维护一份相同的接口契约。
- 后端 DTO class 以 `Dto` 结尾，通过 `implements` 实现对应共享类型，例如 `CreateUserDto implements CreateUserRequest`、`UserResponseDto implements UserResponse`，并在后端声明校验和 Swagger 装饰器。

## 4. Swagger / OpenAPI 注解规范

每个新增或修改的业务接口至少包括：

- Controller 上有意义的中文 `@ApiTags`。
- 方法上的 `@ApiOperation({ summary: '中文接口说明' })`。
- 路径参数使用 `@ApiParam`，查询参数使用 DTO 属性元数据或 `@ApiQuery`，提供中文说明及必要约束。
- DTO 中每个对外字段使用 `@ApiProperty` 或 `@ApiPropertyOptional`，提供中文 `description`。

- 不强制额外编写长篇 `description` 或重复列举错误响应；仅在类型与字段说明无法表达特殊行为或用户明确要求时添加。

## 5. React 前端规范

- 已启用 React Compiler，不默认给所有组件和计算添加 `memo`、`useMemo`、`useCallback`；仅在有明确必要时使用。

## 6. 方法与代码注释规范

- 注释用于补充代码、命名和类型无法直接表达的信息，不以覆盖所有函数为目标。
- Controller 已有清晰 Swagger `summary` 时，无需添加同义 JSDoc；简单构造方法、Provider、Service 和 Repository 方法不写冗余注释。
- Service 方法包含多个明确业务步骤时，使用 `// 1. ...`、`// 2. ...` 的连续编号注释划分流程，每个编号对应完整的业务阶段。
- 编号说明业务目的，例如“校验用户名唯一性”“保存用户”，不逐句翻译赋值或函数调用；纯返回语句通常无需单独编号。
- 存在关键业务规则、副作用、事务边界、特殊异常或缓存行为时，再添加简洁中文 JSDoc；不机械重复参数和返回类型。
- 行内注释仅解释不直观的业务原因、算法或约束；修改实现后同步检查注释和步骤编号。

## 7. 禁止新增测试文件

- 除非用户明确要求，不得创建、生成、补写或修改任何测试文件，包括 `*.spec.ts`、`*.test.ts`、`*.spec.tsx`、`*.test.tsx`、测试夹具、快照和测试数据文件。
- 使用代码生成器时，关闭测试文件生成，例如 Nest CLI 的 `--no-spec`，不得先生成再遗留测试文件。
- 不得为了满足覆盖率引入测试依赖、测试配置或 mock 代码。
- 可以执行不修改测试文件的现有检查命令；优先使用 Oxlint、Oxfmt、TypeScript 检查、构建和 OpenAPI 文档生成验证。
