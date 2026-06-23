const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const http = require('http');
const https = require('https');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Initialize PostgreSQL Pool
const pool = new Pool({
  connectionString: 'postgresql://seedance_admin:seedanceSecurePassWord2026@asia-southeast1-001.proxy.sevalla.app:30750/seedance_creator_db'
});

const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  secret: 'seedance-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false // set to true if using HTTPS
  }
}));

// Auth Middlewares
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Akses khusus Admin diperlukan.' });
  }
  next();
}

// ----------------------------------------------------
// 1. Authentication Routes
// ----------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      total_credits_used: user.total_credits_used || 0
    };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error saat login.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal logout.' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/session', async (req, res) => {
  if (req.session.user) {
    try {
      const userRes = await pool.query('SELECT total_credits_used FROM users WHERE id = $1', [req.session.user.id]);
      if (userRes.rows.length > 0) {
        req.session.user.total_credits_used = userRes.rows[0].total_credits_used || 0;
      }
    } catch (err) {
      console.error('Session DB fetch error:', err);
    }
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password minimal 4 karakter.' });
  }

  const currentUser = req.session.user;

  // Standard user can only change their own password. Admin can change anyone's.
  if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId, 10)) {
    return res.status(403).json({ error: 'Tidak memiliki izin untuk mengganti password user ini.' });
  }

  try {
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Gagal mengubah password.' });
  }
});

// ----------------------------------------------------
// 2. Settings (Proxy Settings) Routes
// ----------------------------------------------------

app.get('/api/settings', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proxy_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Gagal mengambil settings.' });
  }
});

app.post('/api/settings', requireAdmin, async (req, res) => {
  const settings = req.body; // e.g. { api_base_url, api_key, text_model, image_model, scene_count }
  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO proxy_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, String(value)]
      );
    }
    res.json({ success: true, message: 'Settings berhasil disimpan.' });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Gagal menyimpan settings.' });
  }
});

// ----------------------------------------------------
// 3. User Management Routes (Admin Only)
// ----------------------------------------------------

app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar user.' });
  }
});

app.post('/api/users', requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
  }

  try {
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, password, role]
    );
    res.json({ success: true, message: 'User berhasil ditambahkan.' });
  } catch (err) {
    console.error('Create user error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username sudah digunakan.' });
    }
    res.status(500).json({ error: 'Gagal menambahkan user.' });
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Gagal menghapus user.' });
  }
});

// ----------------------------------------------------
// 4. Freebeat Keys Routes
// ----------------------------------------------------

app.get('/api/freebeat-keys', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM freebeat_keys ORDER BY label ASC');
    
    // Mask the key for non-admin users
    const user = req.session.user;
    if (user.role !== 'admin') {
      const masked = result.rows.map(r => ({
        ...r,
        key: r.key.substring(0, 5) + '...' + r.key.substring(r.key.length - 4)
      }));
      return res.json(masked);
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get keys error:', err);
    res.status(500).json({ error: 'Gagal mengambil Freebeat keys.' });
  }
});

app.post('/api/freebeat-keys', requireAdmin, async (req, res) => {
  const { id, label, key, usedCredits, balance } = req.body;
  if (!id || !label || !key) {
    return res.status(400).json({ error: 'ID, label, dan key wajib diisi.' });
  }

  try {
    await pool.query(
      `INSERT INTO freebeat_keys (id, label, key, used_credits, balance) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE 
       SET label = $2, key = $3, used_credits = $4, balance = $5`,
      [id, label, key, usedCredits || 0, balance || null]
    );
    res.json({ success: true, message: 'Freebeat key berhasil disimpan.' });
  } catch (err) {
    console.error('Save key error:', err);
    res.status(500).json({ error: 'Gagal menyimpan Freebeat key.' });
  }
});

app.delete('/api/freebeat-keys/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM freebeat_keys WHERE id = $1', [id]);
    res.json({ success: true, message: 'Freebeat key berhasil dihapus.' });
  } catch (err) {
    console.error('Delete key error:', err);
    res.status(500).json({ error: 'Gagal menghapus Freebeat key.' });
  }
});

// ----------------------------------------------------
// 5. Video History Routes
// ----------------------------------------------------

app.get('/api/history', requireLogin, async (req, res) => {
  const user = req.session.user;
  try {
    const result = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY timestamp DESC', [user.id]);
    // Map db columns back to frontend state format
    const history = result.rows.map(row => ({
      id: row.id,
      recipeTitle: row.recipe_title,
      prompt: row.prompt,
      modelId: row.model_id,
      duration: row.duration,
      resolution: row.resolution,
      aspectRatio: row.aspect_ratio,
      generateAudio: row.generate_audio,
      timestamp: Number(row.timestamp),
      status: row.status,
      videoUrl: row.video_url || '',
      errorMsg: row.error_msg || '',
      credits: row.credits || 0,
      type: row.type || 'video'
    }));
    res.json(history);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Gagal mengambil history.' });
  }
});

app.post('/api/history', requireLogin, async (req, res) => {
  const item = req.body;
  const user = req.session.user;
  try {
    // Check existing status
    const existing = await pool.query('SELECT status FROM history WHERE id = $1', [item.id]);
    const wasSuccess = existing.rows.length > 0 && existing.rows[0].status === 'success';

    await pool.query(
      `INSERT INTO history (id, recipe_title, prompt, model_id, duration, resolution, aspect_ratio, generate_audio, timestamp, status, video_url, error_msg, user_id, credits, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       ON CONFLICT (id) DO UPDATE 
       SET status = $10, video_url = $11, error_msg = $12, user_id = $13, credits = $14, type = $15`,
      [
        item.id,
        item.recipeTitle,
        item.prompt,
        item.modelId,
        item.duration,
        item.resolution,
        item.aspectRatio,
        item.generateAudio,
        BigInt(item.timestamp),
        item.status,
        item.videoUrl || null,
        item.errorMsg || null,
        user.id,
        item.credits || 0,
        item.type || 'video'
      ]
    );

    // If it transitions to success, accumulate the user's credits
    if (item.status === 'success' && !wasSuccess) {
      const creditsToAdd = item.credits || 0;
      if (creditsToAdd > 0) {
        await pool.query(
          'UPDATE users SET total_credits_used = total_credits_used + $1 WHERE id = $2',
          [creditsToAdd, user.id]
        );
        req.session.user.total_credits_used = (req.session.user.total_credits_used || 0) + creditsToAdd;
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save history error:', err);
    res.status(500).json({ error: 'Gagal menyimpan history.' });
  }
});

app.delete('/api/history', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM history');
    res.json({ success: true, message: 'Seluruh riwayat berhasil dihapus.' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Gagal menghapus riwayat.' });
  }
});

// ----------------------------------------------------
// 6. Secure Proxy AI completions / chat API
// ----------------------------------------------------

app.post('/api/ai/chat/completions', requireLogin, async (req, res) => {
  try {
    // Retrieve credentials from settings table
    const settingsRes = await pool.query("SELECT * FROM proxy_settings WHERE key IN ('api_base_url', 'api_key')");
    let api_base_url = '';
    let api_key = '';

    settingsRes.rows.forEach(row => {
      if (row.key === 'api_base_url') api_base_url = row.value;
      if (row.key === 'api_key') api_key = row.value;
    });

    if (!api_base_url || !api_key) {
      return res.status(400).json({ error: 'Koneksi API Proxy belum dikonfigurasi oleh Admin.' });
    }

    const payload = req.body;
    const targetUrl = `${api_base_url}/chat/completions`;
    const parsedUrl = new URL(targetUrl);
    const clientModule = parsedUrl.protocol === 'https:' ? https : http;

    const requestBody = JSON.stringify(payload);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const clientReq = clientModule.request(options, (clientRes) => {
      res.writeHead(clientRes.statusCode, clientRes.headers);
      clientRes.pipe(res);
    });

    clientReq.on('error', (err) => {
      console.error('AI Proxy request error:', err);
      res.status(500).json({ error: 'Koneksi ke AI API Proxy gagal.', details: err.message });
    });

    clientReq.write(requestBody);
    clientReq.end();

  } catch (err) {
    console.error('AI proxy error:', err);
    res.status(500).json({ error: 'Gagal me-proxy AI request.' });
  }
});

// ----------------------------------------------------
// 7. General Freebeat Proxy (Validates Login & key IDs)
// ----------------------------------------------------

app.all('/proxy', requireLogin, async (req, res) => {
  const targetUrl = req.headers['x-target-url'];
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing x-target-url header' });
  }

  // Resolve Freebeat Key ID in Authorization header
  let authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const keyResult = await pool.query('SELECT key FROM freebeat_keys WHERE id = $1', [authHeader]);
      if (keyResult.rows.length > 0) {
        authHeader = keyResult.rows[0].key;
      }
    } catch (e) {
      console.error('Error resolving Freebeat key ID:', e);
    }
  }

  const parsedUrl = new URL(targetUrl);
  const clientModule = parsedUrl.protocol === 'https:' ? https : http;
  
  // Construct clean headers to avoid remote server blocks (due to CORS/Origin, Cookie conflicts, or Accept-Encoding issues)
  const headers = {};
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  if (req.headers['content-type']) {
    headers['content-type'] = req.headers['content-type'];
  }
  if (req.headers['content-length']) {
    headers['content-length'] = req.headers['content-length'];
  }
  if (req.headers['accept']) {
    headers['accept'] = req.headers['accept'];
  }
  headers['user-agent'] = req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  let bodyData = null;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0;
  if (hasBody) {
    bodyData = JSON.stringify(req.body);
    headers['content-length'] = Buffer.byteLength(bodyData);
  } else {
    delete headers['content-length'];
  }

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method,
    headers: headers
  };

  console.log(`[Proxy Request] Method: ${options.method}, URL: ${targetUrl}`);
  console.log(`[Proxy Headers] Sent:`, JSON.stringify({ ...headers, authorization: headers.authorization ? headers.authorization.substring(0, 15) + '...' : undefined }));

  const clientReq = clientModule.request(options, (clientRes) => {
    console.log(`[Proxy Response] Status: ${clientRes.statusCode}`);
    res.writeHead(clientRes.statusCode, clientRes.headers);
    clientRes.pipe(res);
  });

  clientReq.on('error', (err) => {
    console.error('[Proxy Error] Request failed:', err);
    res.status(500).json({ error: 'Proxy request failed', details: err.message });
  });

  if (hasBody && bodyData) {
    clientReq.write(bodyData);
  }
  clientReq.end();
});

// ----------------------------------------------------
// 8. Serve Static Site
// ----------------------------------------------------

app.use(express.static(__dirname));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Express Server & CORS Proxy running at http://localhost:${PORT}/`);
});
