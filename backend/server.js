const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const open = require('open');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// 路由
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/history', require('./routes/history'));
app.use('/api/favorites', require('./routes/favorites'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
  console.log(`🚀 PromptCraft服务器启动成功！`);
  const url = `http://localhost:${PORT}`;
  console.log(`📱 访问地址: ${url}`);
  console.log(`🔧 API地址: ${url}/api`);

  // 在生产环境（非开发模式）下自动打开浏览器
  if (process.env.NODE_ENV !== 'development') {
    try {
      await open(url);
      console.log('🌐 已自动打开浏览器');
    } catch (err) {
      console.error('❌ 无法自动打开浏览器:', err);
    }
  }
});
