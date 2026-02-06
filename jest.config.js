/** @type {import('jest').Config} */
module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式 - 只运行单元测试，排除需要服务器的 API 集成测试
  testMatch: [
    '**/backend/utils/__tests__/**/*.test.js'
  ],
  
  // 忽略的目录和文件 - 排除 API 集成测试
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/frontend/',
    '.*Api\\.test\\.js$'  // 排除所有 *Api.test.js 集成测试
  ],
  
  // 覆盖率报告
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/**/__tests__/**'
  ],
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 显示详细信息
  verbose: true
};
