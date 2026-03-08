const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const open = require('open');
const localModelManager = require('./services/localModelManager');
const safetyService = require('./services/safetyService');
const createSafetyMiddleware = require('./middleware/safetyMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// 安全审查中间件（Phase 14 — 在路由之前注册）
app.use(createSafetyMiddleware());

// 路由
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/history', require('./routes/history'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/prompts/dynamic-design', require('./routes/dynamicDesign'));
app.use('/api/models', require('./routes/models'));
app.use('/api/safety', require('./routes/safety'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    localModels: localModelManager.getStatus(),
    safety: {
      enabled: safetyService.config?.enabled || false,
      stats: safetyService.getStats()
    }
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 PromptAtelier服务器启动成功！`);
  const url = `http://localhost:${PORT}`;
  console.log(`📱 访问地址: ${url}`);
  console.log(`🔧 API地址: ${url}/api`);

  // 初始化安全审查服务（Phase 14）
  try {
    safetyService.initialize();
  } catch (err) {
    console.error('⚠️ 安全审查服务初始化警告:', err.message);
    console.log('  → 安全审查功能将不可用，其他功能正常运行');
  }

  // 初始化本地模型管理器（Phase 13）
  try {
    await localModelManager.initialize();
  } catch (err) {
    console.error('⚠️ 本地模型管理器初始化警告:', err.message);
    console.log('  → 本地模型功能将不可用，其他功能正常运行');
  }

  // 只在生产环境（npm start）下自动打开浏览器
  // 开发环境（npm run dev / nodemon）和 CI 环境不自动打开
  const isDevMode = process.argv.some(arg => arg.includes('nodemon')) || 
                    process.env.npm_lifecycle_event === 'dev';
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  
  if (!isDevMode && !isCI) {
    try {
      await open(url);
      console.log('🌐 已自动打开浏览器');
    } catch (err) {
      console.error('❌ 无法自动打开浏览器:', err);
    }
  } else {
    console.log('🔄 开发模式：跳过自动打开浏览器');
  }
});

// 优雅关闭（释放模型内存）
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} 收到，正在优雅关闭...`);
  try {
    await localModelManager.shutdown();
  } catch (err) {
    console.error('模型管理器关闭错误:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
