/* app.js - Seedance Storyboard and AI Prompt Generator Logic (Single-Prompt Mode) */

// Application State
const state = {
  sessionUser: null, // { id, username, role }
  storyboardTitle: 'Indomie Nyemek Viral',
  masterGridPrompt: '',
  masterSeedancePrompt: '',
  combinedImage: '',
  combinedImage2: '',
  textModel: 'gpt-4o-mini',
  imageModel: '108',
  imageSize: '1024x1024',
  imageCount: 1,
  sceneCount: 11,
  productImage: '',
  characterImage: '',
  productImageUrl: '',
  characterImageUrl: '',
  
  // Freebeat Keys State
  freebeatKeys: [], // [{ id: 'uuid', label: 'My Key', key: 'sk-...', balance: 1000 }]
  activeFreebeatKeyId: '',
  
  // History and Multiple Polling State
  freebeatHistory: [], // [{ id: 'batchId', recipeTitle: '...', prompt: '...', modelId: '...', duration: 5, resolution: '720p', aspectRatio: '9:16', generateAudio: false, timestamp: 1234567, status: 'success'/'failed'/'processing', videoUrl: '...', errorMsg: '...' }]
  freebeatVideoIntervals: {}, // { batchId: intervalId }
  
  // Selected reference files/URLs for Video generation
  vStartFile: null,
  vStartImage: '',
  vEndFile: null,
  vEndImage: '',
  vRefFile: null,
  vRefVideo: '',
  videoGenerationType: 1,
  freebeatImageIntervals: {}, // { batchId: intervalId }
  latestVideoBatchId: '',

  // New Per-Frame and Model-Specific State
  storyboardMode: 'grid', // 'grid' or 'per-frame'
  videoPrompts: {}, // { [modelId]: promptText }
  scenes: [] // [{ scene_number: 1, title: 'Finished Dish', image_prompt: '...', video_prompt: '...', imageUrl: '', isGenerating: false, batchId: '' }]
};

// Freebeat Video Studio Model Configurations (Duration, Resolution & Cost Mapping)
const modelConfigs = {
  '94': {
    name: 'Pixverse V6',
    supportedModes: [1, 2], // 1: T2V, 2: I2V
    minDuration: 5,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: (d, res) => res === '1080p' ? 495 : 345
  },
  '103': {
    name: 'Pixverse C1',
    supportedModes: [1, 2, 3], // 1: T2V, 2: I2V, 3: V2V
    minDuration: 1,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['360p', '540p', '720p', '1080p'],
    defaultResolution: '720p',
    getCost: (d, res) => {
      if (res === '360p') return 7;
      if (res === '540p') return 8;
      if (res === '1080p') return 19;
      return 10;
    }
  },
  '104': {
    name: 'Wan V2.7',
    supportedModes: [1, 2, 3],
    minDuration: 2,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: null
  },
  '102': {
    name: 'SeedDance 2.0',
    supportedModes: [1, 2, 3],
    minDuration: 4,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p'],
    defaultResolution: '720p',
    getCost: null
  },
  '101': {
    name: 'SeedDance 2.0 Fast',
    supportedModes: [1, 2, 3],
    minDuration: 4,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p'],
    defaultResolution: '720p',
    getCost: null
  },
  '112': {
    name: 'Kling V3 4K',
    supportedModes: [1, 2],
    minDuration: 3,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['4k'],
    defaultResolution: '4k',
    getCost: null
  },
  '56': {
    name: 'Sora 2 Pro',
    supportedModes: [1],
    allowedDurations: [4, 8, 12],
    defaultDuration: 4,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: null
  },
  '111': {
    name: 'HappyHorse',
    supportedModes: [1, 3],
    minDuration: 3,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: null
  }
};

// Built-in Templates Data loaded dynamically from templates.js

// UI Elements
const els = {
  // Login overlays
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),

  // Main container
  appMainLayout: document.getElementById('app-main-layout'),

  // Session profile info
  sessionUsername: document.getElementById('session-username'),
  sessionRole: document.getElementById('session-role'),
  btnShowChangePwd: document.getElementById('btn-show-change-pwd'),
  btnLogout: document.getElementById('btn-logout'),

  // Change Password Modal
  changePasswordModal: document.getElementById('change-password-modal'),
  changePasswordForm: document.getElementById('change-password-form'),
  changePwdUserid: document.getElementById('change-pwd-userid'),
  changePwdLabelUsername: document.getElementById('change-pwd-label-username'),
  changePwdVal: document.getElementById('change-pwd-val'),
  btnClosePwdModal: document.getElementById('btn-close-pwd-modal'),

  // Proxy Settings
  apiBaseUrl: document.getElementById('api-base-url'),
  apiKey: document.getElementById('api-key'),
  btnTestConnection: document.getElementById('btn-test-connection'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusText: document.getElementById('api-status-text'),
  settingsForm: document.getElementById('settings-form'),
  
  templateSelect: document.getElementById('template-select'),
  
  recipeConcept: document.getElementById('recipe-concept'),
  textModelSelect: document.getElementById('text-model-select'),
  imageModelSelect: document.getElementById('image-model-select'),
  imageSizeSelect: document.getElementById('image-size-select'),
  imageCountSelect: document.getElementById('image-count-select'),
  sceneCount: document.getElementById('scene-count'),
  sceneCountVal: document.getElementById('scene-count-val'),
  btnGenerateStoryboard: document.getElementById('btn-generate-storyboard'),
  btnOneClickFlow: document.getElementById('btn-one-click-flow'),
  
  // Preview Area
  storyboardEmptyState: document.getElementById('storyboard-empty-state'),
  storyboardPreviewWrapper: document.getElementById('storyboard-preview-wrapper'),
  storyboardDisplayTitle: document.getElementById('storyboard-display-title'),
  storyboardDisplayMeta: document.getElementById('storyboard-display-meta'),
  
  // Combined Image Elements
  btnClearStoryboard: document.getElementById('btn-clear-storyboard'),
  storyboardImagesContainer: document.getElementById('storyboard-images-container'),
  storyboardImagesGrid: document.getElementById('storyboard-images-grid'),
  lblStoryboardImg1: document.getElementById('lbl-storyboard-img1'),
  storyboardImg2Wrapper: document.getElementById('storyboard-img2-wrapper'),
  combinedStoryboardImage: document.getElementById('combined-storyboard-image'),
  combinedStoryboardImage2: document.getElementById('combined-storyboard-image-2'),
  combinedImagePlaceholder: document.getElementById('combined-image-placeholder'),
  combinedImageLoader: document.getElementById('combined-image-loader'),
  combinedLoaderText: document.getElementById('combined-loader-text'),
  btnUploadCombined: document.getElementById('btn-upload-combined'),
  btnDownloadCombined: document.getElementById('btn-download-combined'),
  btnExportStoryboard: document.getElementById('btn-export-storyboard'),
  combinedFileInput: document.getElementById('combined-file-input'),
  
  // Master Prompt Editor Elements
  masterGridPrompt: document.getElementById('master-grid-prompt'),
  btnCopyMasterPrompt: document.getElementById('btn-copy-master-prompt'),
  btnGenerateCombinedImage: document.getElementById('btn-generate-combined-image'),
  
  // Master Seedance Video Prompt Elements
  masterSeedancePrompt: document.getElementById('master-seedance-prompt'),
  btnCopySeedancePrompt: document.getElementById('btn-copy-seedance-prompt'),
  
  // Product image elements
  productImageInput: document.getElementById('product-image-input'),
  btnUploadProduct: document.getElementById('btn-upload-product'),
  btnClearProduct: document.getElementById('btn-clear-product'),
  productPreviewContainer: document.getElementById('product-preview-container'),
  productPreviewImg: document.getElementById('product-preview-img'),
  
  // Character image elements
  characterImageInput: document.getElementById('character-image-input'),
  btnUploadCharacter: document.getElementById('btn-upload-character'),
  btnClearCharacter: document.getElementById('btn-clear-character'),
  characterPreviewContainer: document.getElementById('character-preview-container'),
  characterPreviewImg: document.getElementById('character-preview-img'),
  
  // Toast Notification
  toastNotification: document.getElementById('toast-notification'),
  toastMessage: document.getElementById('toast-message'),

  // Freebeat Configuration Elements
  freebeatKeySelect: document.getElementById('freebeat-key-select'),
  freebeatActiveBalanceWrapper: document.getElementById('freebeat-active-balance-wrapper'),
  freebeatActiveBalanceDisplay: document.getElementById('freebeat-active-balance-display'),
  btnRefreshFreebeatBalance: document.getElementById('btn-refresh-freebeat-balance'),

  // Freebeat Video Generator Elements
  freebeatModelSelect: document.getElementById('freebeat-model-select'),
  freebeatAspectRatio: document.getElementById('freebeat-aspect-ratio'),
  freebeatDuration: document.getElementById('freebeat-duration'),
  freebeatResolution: document.getElementById('freebeat-resolution'),
  freebeatGenerateAudio: document.getElementById('freebeat-generate-audio'),
  btnGenerateFreebeatVideo: document.getElementById('btn-generate-freebeat-video'),
  freebeatGenerationType: document.getElementById('freebeat-generation-type'),
  
  // Conditionally visible containers
  freebeatI2vInputs: document.getElementById('freebeat-i2v-inputs'),
  freebeatV2vInputs: document.getElementById('freebeat-v2v-inputs'),

  // I2V Inputs
  btnUploadVStart: document.getElementById('btn-upload-v-start'),
  btnUseStoryboardStart1: document.getElementById('btn-use-storyboard-start-1'),
  btnUseStoryboardStart2: document.getElementById('btn-use-storyboard-start-2'),
  freebeatVStartInput: document.getElementById('freebeat-v-start-input'),
  vStartPreviewContainer: document.getElementById('v-start-preview-container'),
  vStartPreviewImg: document.getElementById('v-start-preview-img'),

  btnUploadVEnd: document.getElementById('btn-upload-v-end'),
  btnUseStoryboardEnd1: document.getElementById('btn-use-storyboard-end-1'),
  btnUseStoryboardEnd2: document.getElementById('btn-use-storyboard-end-2'),
  freebeatVEndInput: document.getElementById('freebeat-v-end-input'),
  vEndPreviewContainer: document.getElementById('v-end-preview-container'),
  vEndPreviewImg: document.getElementById('v-end-preview-img'),

  // V2V Inputs
  btnUploadVRef: document.getElementById('btn-upload-v-ref'),
  freebeatVRefInput: document.getElementById('freebeat-v-ref-input'),
  freebeatVRefUrl: document.getElementById('freebeat-v-ref-url'),
  vRefPreviewContainer: document.getElementById('v-ref-preview-container'),
  vRefPreviewVideo: document.getElementById('v-ref-preview-video'),

  // Freebeat Video Output Elements
  freebeatVideoStatusContainer: document.getElementById('freebeat-video-status-container'),
  freebeatVideoLoader: document.getElementById('freebeat-video-loader'),
  freebeatVideoLoaderText: document.getElementById('freebeat-video-loader-text'),
  freebeatVideoLoaderSubtext: document.getElementById('freebeat-video-loader-subtext'),
  freebeatVideoPlayerWrapper: document.getElementById('freebeat-video-player-wrapper'),
  freebeatGeneratedVideo: document.getElementById('freebeat-generated-video'),
  btnDownloadFreebeatVideo: document.getElementById('btn-download-freebeat-video'),
  freebeatVideoErrorWrapper: document.getElementById('freebeat-video-error-wrapper'),
  freebeatVideoErrorMsg: document.getElementById('freebeat-video-error-msg'),
  
  // Manage Users Tab Elements
  addUserForm: document.getElementById('add-user-form'),
  newUserUsername: document.getElementById('new-user-username'),
  newUserPassword: document.getElementById('new-user-password'),
  newUserRole: document.getElementById('new-user-role'),
  usersListBody: document.getElementById('users-list-body'),

  // Manage Freebeat Keys Tab Elements
  addFreebeatKeyForm: document.getElementById('add-freebeat-key-form'),
  newKeyLabel: document.getElementById('new-key-label'),
  newKeyVal: document.getElementById('new-key-val'),
  keysListBody: document.getElementById('keys-list-body'),

  // Tab History Elements
  historyGridContainer: document.getElementById('history-grid-container'),
  btnClearHistoryTab: document.getElementById('btn-clear-history-tab'),

  // Session total credits
  sessionTotalCredits: document.getElementById('session-total-credits'),

  // New Storyboard Mode Elements
  storyboardModeSelect: document.getElementById('storyboard-mode-select'),
  gridModeContent: document.getElementById('grid-mode-content'),
  perFrameModeContent: document.getElementById('per-frame-mode-content'),
  perFrameScenesList: document.getElementById('per-frame-scenes-list'),
  videoPromptModelBadge: document.getElementById('video-prompt-model-badge')
};

// Update user total credits in sidebar
function updateUserCreditsUI() {
  if (state.sessionUser && els.sessionTotalCredits) {
    els.sessionTotalCredits.textContent = `${state.sessionUser.total_credits_used || 0} Credits`;
  }
}

// Refresh session user data (total credits used) from server
async function refreshSessionUserCredits() {
  try {
    const response = await fetch('/api/auth/session');
    const data = await response.json();
    if (data.loggedIn) {
      state.sessionUser = data.user;
      updateUserCreditsUI();
    }
  } catch (e) {
    console.error('Failed to refresh user credits:', e);
  }
}

// Populate dropdown from templates.js
function populateTemplateDropdown() {
  if (!els.templateSelect) return;
  els.templateSelect.innerHTML = '<option value="" disabled selected>-- Pilih Gaya / Format Video --</option>';
  Object.entries(templates).forEach(([id, tpl]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = tpl.title;
    els.templateSelect.appendChild(opt);
  });
}

// Initialization
function init() {
  populateTemplateDropdown();
  setupEventListeners();
  setupTabNavigation();
  updateModelOptions();
  checkSession();
}

// Check Active Session
async function checkSession() {
  try {
    const response = await fetch('/api/auth/session');
    const data = await response.json();
    if (data.loggedIn) {
      handleLoginSuccess(data.user);
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Session check error:', error);
    showLoginScreen();
  }
}

// Show Login Page
function showLoginScreen() {
  els.loginScreen.style.display = 'flex';
  els.appMainLayout.style.display = 'none';
}

// Show Dashboard Main Layout
function handleLoginSuccess(user) {
  state.sessionUser = user;
  els.loginScreen.style.display = 'none';
  els.appMainLayout.style.display = 'flex';
  
  els.sessionUsername.textContent = user.username;
  els.sessionRole.textContent = user.role;
  updateUserCreditsUI();
  
  applyRoleAccess(user.role);
  
  // Load data
  loadFreebeatKeys();
  loadFreebeatHistory();
  
  if (user.role === 'admin') {
    loadSettings();
    loadUsersList();
  }
  
  // Switch to default Tab: Storyboard Creator
  switchTab('tab-generator');
  
}

// Apply Role-based access constraints on UI
function applyRoleAccess(role) {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (role === 'admin') ? '' : 'none';
  });
}

// Sidebar Tab switching
function setupTabNavigation() {
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      
      // Safety check: standard users cannot open admin tabs
      if (state.sessionUser && state.sessionUser.role !== 'admin' && item.classList.contains('admin-only')) {
        return;
      }
      
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Toggle active class on Nav Items
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle active class on Tab sheets
  document.querySelectorAll('.app-tab').forEach(tab => {
    if (tab.id === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Show/Hide sidebar generator controls depending on Storyboard Creator tab
  const generatorControls = document.getElementById('generator-sidebar-controls');
  if (tabId === 'tab-generator') {
    generatorControls.style.display = 'block';
    document.getElementById('top-nav-actions').style.display = '';
  } else {
    generatorControls.style.display = 'none';
    document.getElementById('top-nav-actions').style.display = 'none';
  }

  // Update Top Navigation Title & Icon
  const topNavTitle = document.getElementById('top-nav-title');
  const topNavIcon = document.getElementById('top-nav-icon');
  
  if (tabId === 'tab-generator') {
    topNavTitle.textContent = 'Panel Storyboard & Prompt';
    topNavIcon.className = 'fa-solid fa-clapperboard';
  } else if (tabId === 'tab-history') {
    topNavTitle.textContent = 'Riwayat Video Studio';
    topNavIcon.className = 'fa-solid fa-history';
    loadFreebeatHistory(); // Reload history when tab is viewed
  } else if (tabId === 'tab-users') {
    topNavTitle.textContent = 'Manajemen Pengguna (Users)';
    topNavIcon.className = 'fa-solid fa-users-gear';
    loadUsersList();
  } else if (tabId === 'tab-freebeat-keys') {
    topNavTitle.textContent = 'Kelola Freebeat API Keys';
    topNavIcon.className = 'fa-solid fa-key';
    loadFreebeatKeys();
  } else if (tabId === 'tab-settings') {
    topNavTitle.textContent = 'Koneksi API Proxy';
    topNavIcon.className = 'fa-solid fa-gears';
    loadSettings();
  }
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
  els.toastMessage.textContent = message;
  els.toastNotification.className = `toast active ${type}`;
  
  const icon = els.toastNotification.querySelector('i');
  if (type === 'success') icon.className = 'fa-solid fa-circle-check';
  else if (type === 'error') icon.className = 'fa-solid fa-circle-exclamation';
  else icon.className = 'fa-solid fa-circle-info';
  
  setTimeout(() => {
    els.toastNotification.classList.remove('active');
  }, 4000);
}

// Event Listeners Setup
function setupEventListeners() {
  // Login Form
  els.loginForm.addEventListener('submit', handleLogin);
  
  // Logout
  els.btnLogout.addEventListener('click', handleLogout);

  // Own Change Password triggering
  els.btnShowChangePwd.addEventListener('click', () => {
    if (state.sessionUser) {
      openChangePasswordModal(state.sessionUser.id, state.sessionUser.username);
    }
  });

  // Change Password Form
  els.changePasswordForm.addEventListener('submit', handleChangePassword);
  els.btnClosePwdModal.addEventListener('click', closeChangePasswordModal);

  // Settings / Connection
  els.settingsForm.addEventListener('submit', handleSaveSettings);
  els.btnTestConnection.addEventListener('click', testApiConnection);

  // Generator triggers
  els.sceneCount.addEventListener('input', () => {
    els.sceneCountVal.textContent = els.sceneCount.value;
    state.sceneCount = parseInt(els.sceneCount.value, 10);
  });

  els.storyboardModeSelect.addEventListener('change', handleStoryboardModeChange);
  
  els.masterSeedancePrompt.addEventListener('input', () => {
    const modelId = els.freebeatModelSelect.value;
    if (modelId) {
      state.videoPrompts[modelId] = els.masterSeedancePrompt.value;
      state.masterSeedancePrompt = els.masterSeedancePrompt.value;
    }
  });

  els.btnGenerateStoryboard.addEventListener('click', generateStoryboardWithAI);
  els.btnClearStoryboard.addEventListener('click', clearStoryboard);
  els.btnOneClickFlow.addEventListener('click', runOneClickFlow);
  
  // Combined Image and Master Prompt Actions
  els.btnGenerateCombinedImage.addEventListener('click', generateCombinedStoryboardImage);
  els.btnCopyMasterPrompt.addEventListener('click', copyMasterPrompt);
  els.btnCopySeedancePrompt.addEventListener('click', copySeedancePrompt);
  els.btnDownloadCombined.addEventListener('click', downloadCombinedStoryboardImage);
  els.btnExportStoryboard.addEventListener('click', downloadCombinedStoryboardImage);
  els.btnUploadCombined.addEventListener('click', () => els.combinedFileInput.click());
  els.combinedFileInput.addEventListener('change', handleCombinedFileUpload);
  
  els.imageModelSelect.addEventListener('change', () => {
    state.imageModel = els.imageModelSelect.value;
  });
  els.imageSizeSelect.addEventListener('change', () => {
    state.imageSize = els.imageSizeSelect.value;
  });
  els.imageCountSelect.addEventListener('change', () => {
    state.imageCount = parseInt(els.imageCountSelect.value, 10) || 1;
  });

  // Product image events
  els.btnUploadProduct.addEventListener('click', () => els.productImageInput.click());
  els.productImageInput.addEventListener('change', handleProductImageUpload);
  els.btnClearProduct.addEventListener('click', clearProductImage);

  // Character image events
  els.btnUploadCharacter.addEventListener('click', () => els.characterImageInput.click());
  els.characterImageInput.addEventListener('change', handleCharacterImageUpload);
  els.btnClearCharacter.addEventListener('click', clearCharacterImage);

  // Template select
  els.templateSelect.addEventListener('change', () => {
    const val = els.templateSelect.value;
    if (val) loadTemplate(val);
  });

  // Freebeat options triggering
  els.freebeatKeySelect.addEventListener('change', handleSelectFreebeatKey);
  els.btnGenerateFreebeatVideo.addEventListener('click', handleGenerateFreebeatVideo);
  els.btnDownloadFreebeatVideo.addEventListener('click', downloadFreebeatVideo);
  els.btnRefreshFreebeatBalance.addEventListener('click', autoDetectFreebeatBalance);
  
  // Video Mode triggering
  els.freebeatGenerationType.addEventListener('change', handleSelectVideoMode);
  
  // I2V event listeners
  els.btnUploadVStart.addEventListener('click', () => els.freebeatVStartInput.click());
  els.freebeatVStartInput.addEventListener('change', handleVStartImageUpload);
  els.btnUseStoryboardStart1.addEventListener('click', () => handleUseStoryboardStart(1));
  els.btnUseStoryboardStart2.addEventListener('click', () => handleUseStoryboardStart(2));

  els.btnUploadVEnd.addEventListener('click', () => els.freebeatVEndInput.click());
  els.freebeatVEndInput.addEventListener('change', handleVEndImageUpload);
  els.btnUseStoryboardEnd1.addEventListener('click', () => handleUseStoryboardEnd(1));
  els.btnUseStoryboardEnd2.addEventListener('click', () => handleUseStoryboardEnd(2));

  // V2V event listeners
  els.btnUploadVRef.addEventListener('click', () => els.freebeatVRefInput.click());
  els.freebeatVRefInput.addEventListener('change', handleVRefVideoUpload);
  
  // Dynamic duration and cost calculation listeners
  els.freebeatModelSelect.addEventListener('change', () => {
    updateDurationOptionsAndCost();
    handleVideoModelChange(els.freebeatModelSelect.value);
  });
  els.freebeatDuration.addEventListener('change', updateEstimatedCostUI);
  els.freebeatResolution.addEventListener('change', updateEstimatedCostUI);

  // User Management triggers
  els.addUserForm.addEventListener('submit', handleAddUser);

  // Freebeat Keys Management triggers
  els.addFreebeatKeyForm.addEventListener('submit', handleAddFreebeatKey);

  // Clear History
  els.btnClearHistoryTab.addEventListener('click', clearFreebeatHistory);
}

// ----------------------------------------------------
// 1. Authentication Handlers
// ----------------------------------------------------

async function handleLogin(e) {
  e.preventDefault();
  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value.trim();
  
  if (!username || !password) {
    showToast('Username dan password wajib diisi!', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      els.loginUsername.value = '';
      els.loginPassword.value = '';
      showToast('Login Berhasil!', 'success');
      handleLoginSuccess(data.user);
    } else {
      showToast(data.error || 'Login Gagal!', 'error');
    }
  } catch (error) {
    console.error('Login request error:', error);
    showToast('Server error saat mencoba login.', 'error');
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) {
      // Clear polling intervals
      Object.keys(state.freebeatVideoIntervals).forEach(id => {
        clearInterval(state.freebeatVideoIntervals[id]);
      });
      state.freebeatVideoIntervals = {};
      state.sessionUser = null;
      
      showToast('Berhasil logout!', 'success');
      showLoginScreen();
    } else {
      showToast('Gagal logout.', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showLoginScreen();
  }
}

function openChangePasswordModal(userId, username) {
  els.changePwdUserid.value = userId;
  els.changePwdLabelUsername.textContent = `Username: ${username}`;
  els.changePwdVal.value = '';
  els.changePasswordModal.style.display = 'flex';
  els.changePasswordModal.offsetHeight;
  els.changePasswordModal.classList.add('active');
}

function closeChangePasswordModal() {
  els.changePasswordModal.classList.remove('active');
  setTimeout(() => {
    if (!els.changePasswordModal.classList.contains('active')) {
      els.changePasswordModal.style.display = 'none';
    }
  }, 250);
}

async function handleChangePassword(e) {
  e.preventDefault();
  const userId = els.changePwdUserid.value;
  const newPassword = els.changePwdVal.value.trim();
  
  if (!newPassword || newPassword.length < 4) {
    showToast('Password minimal 4 karakter!', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      showToast(data.message || 'Password berhasil diubah.', 'success');
      closeChangePasswordModal();
    } else {
      showToast(data.error || 'Gagal mengubah password.', 'error');
    }
  } catch (err) {
    console.error('Change password error:', err);
    showToast('Gagal terhubung ke server untuk mengubah password.', 'error');
  }
}

// ----------------------------------------------------
// 2. Settings (Proxy Settings) Handlers
// ----------------------------------------------------

async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const settings = await response.json();
      if (settings.api_base_url) els.apiBaseUrl.value = settings.api_base_url;
      if (settings.api_key) els.apiKey.value = settings.api_key;
      if (settings.text_model) els.textModelSelect.value = settings.text_model;
      if (settings.image_model) els.imageModelSelect.value = settings.image_model;
      
      syncStateFromInputs();
      checkApiConnectionQuietly();
    }
  } catch (error) {
    console.error('Load settings error:', error);
  }
}

function syncStateFromInputs() {
  state.baseUrl = els.apiBaseUrl.value.trim();
  state.apiKey = els.apiKey.value.trim();
  state.textModel = els.textModelSelect.value;
  state.imageModel = els.imageModelSelect.value;
}

async function handleSaveSettings(e) {
  e.preventDefault();
  syncStateFromInputs();
  
  const settings = {
    api_base_url: state.baseUrl,
    api_key: state.apiKey,
    text_model: state.textModel,
    image_model: state.imageModel
  };
  
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      showToast(data.message || 'Pengaturan berhasil disimpan!', 'success');
      checkApiConnectionQuietly();
    } else {
      showToast(data.error || 'Gagal menyimpan pengaturan.', 'error');
    }
  } catch (error) {
    console.error('Save settings error:', error);
    showToast('Gagal terhubung ke server.', 'error');
  }
}

// Check connection quietly on load
async function checkApiConnectionQuietly() {
  const isOk = await verifyConnection(false);
  updateConnectionStatusUI(isOk);
}

// Check Connection with explicit user trigger
async function testApiConnection() {
  els.btnTestConnection.disabled = true;
  showToast('Menghubungi server API proxy...', 'info');
  const isOk = await verifyConnection(true);
  updateConnectionStatusUI(isOk);
  els.btnTestConnection.disabled = false;
}

// Connection Verification Logic
async function verifyConnection(showToasts = true) {
  const url = els.apiBaseUrl.value.trim();
  const key = els.apiKey.value.trim();
  
  if (!url || !key) {
    if (showToasts) showToast('Password dan Base URL harus diisi!', 'error');
    return false;
  }
  
  try {
    const response = await fetch('/proxy', {
      method: 'GET',
      headers: {
        'x-target-url': `${url}/models`,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.ok) {
      if (showToasts) showToast('Koneksi berhasil! API Key Proxy valid.', 'success');
      return true;
    } else {
      if (showToasts) showToast(`Koneksi gagal. HTTP Status: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    console.error('API Verification error:', error);
    if (showToasts) showToast('Gagal terhubung ke proxy. Periksa Base URL.', 'error');
    return false;
  }
}

// Connection Status UI updater
function updateConnectionStatusUI(connected) {
  if (connected) {
    els.apiStatusDot.className = 'status-dot connected';
    els.apiStatusText.textContent = 'Connected';
  } else {
    els.apiStatusDot.className = 'status-dot';
    els.apiStatusText.textContent = 'Disconnected';
  }
}

// ----------------------------------------------------
// 3. User Management Handlers (Admin Only)
// ----------------------------------------------------

async function loadUsersList() {
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      const users = await response.json();
      renderUsersTable(users);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function renderUsersTable(users) {
  els.usersListBody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.id}</td>
      <td><strong>${user.username}</strong></td>
      <td><span style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: ${user.role === 'admin' ? 'var(--accent-gold)' : 'var(--text-secondary)'}">${user.role}</span></td>
      <td>
        <button class="btn btn-secondary btn-action-pwd" style="display: inline-flex; width: auto; margin-top: 0; padding: 4px 10px; font-size: 11px;" type="button">
          <i class="fa-solid fa-key"></i> Ubah Pwd
        </button>
        <button class="btn btn-secondary btn-action-del" style="display: ${user.username === 'admin' || user.id === state.sessionUser.id ? 'none' : 'inline-flex'}; width: auto; margin-top: 0; padding: 4px 10px; font-size: 11px; border-color: var(--accent-red); color: var(--accent-red);" type="button">
          <i class="fa-solid fa-trash"></i> Hapus
        </button>
      </td>
    `;
    
    tr.querySelector('.btn-action-pwd').addEventListener('click', () => {
      openChangePasswordModal(user.id, user.username);
    });
    
    const delBtn = tr.querySelector('.btn-action-del');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        handleDeleteUser(user.id, user.username);
      });
    }
    
    els.usersListBody.appendChild(tr);
  });
}

async function handleAddUser(e) {
  e.preventDefault();
  const username = els.newUserUsername.value.trim();
  const password = els.newUserPassword.value.trim();
  const role = els.newUserRole.value;
  
  if (!username || !password || !role) {
    showToast('Semua field wajib diisi!', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      showToast('User berhasil ditambahkan!', 'success');
      els.newUserUsername.value = '';
      els.newUserPassword.value = '';
      loadUsersList();
    } else {
      showToast(data.error || 'Gagal menambahkan user.', 'error');
    }
  } catch (error) {
    console.error('Add user error:', error);
    showToast('Gagal terhubung ke server.', 'error');
  }
}

async function handleDeleteUser(userId, username) {
  if (!confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.ok && data.success) {
      showToast('User berhasil dihapus.', 'success');
      loadUsersList();
    } else {
      showToast(data.error || 'Gagal menghapus user.', 'error');
    }
  } catch (error) {
    console.error('Delete user error:', error);
    showToast('Gagal terhubung ke server.', 'error');
  }
}

// ----------------------------------------------------
// 4. Freebeat API Keys Handlers
// ----------------------------------------------------

async function loadFreebeatKeys() {
  try {
    const response = await fetch('/api/freebeat-keys');
    if (response.ok) {
      state.freebeatKeys = await response.json();
      
      // Determine active key
      const savedActiveId = localStorage.getItem('active_freebeat_key_id');
      const exists = state.freebeatKeys.some(k => k.id === savedActiveId);
      if (exists) {
        state.activeFreebeatKeyId = savedActiveId;
      } else if (state.freebeatKeys.length > 0) {
        state.activeFreebeatKeyId = state.freebeatKeys[0].id;
      } else {
        state.activeFreebeatKeyId = '';
      }
      
      renderFreebeatKeySelect();
      if (state.sessionUser && state.sessionUser.role === 'admin') {
        renderFreebeatKeysTable();
      }
    }
  } catch (err) {
    console.error('Error loading Freebeat keys:', err);
  }
}

function renderFreebeatKeySelect() {
  els.freebeatKeySelect.innerHTML = '';
  
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.disabled = true;
  defaultOpt.selected = !state.activeFreebeatKeyId;
  defaultOpt.textContent = '-- Pilih API Key --';
  els.freebeatKeySelect.appendChild(defaultOpt);
  
  state.freebeatKeys.forEach(key => {
    const opt = document.createElement('option');
    opt.value = key.id;
    opt.selected = (key.id === state.activeFreebeatKeyId);
    
    const used = key.used_credits || 0;
    opt.textContent = `${key.label} (${key.key}) • Terpakai: ${used} Cr`;
    els.freebeatKeySelect.appendChild(opt);
  });
  
  // Show active balance UI
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (activeKey) {
    const used = activeKey.used_credits || 0;
    const hasBalance = (activeKey.balance !== undefined && activeKey.balance !== null);
    const balanceText = hasBalance ? `<span style="display: inline-flex; align-items: center; gap: 4px; margin-left: 12px;"><i class="fa-solid fa-wallet" style="color: var(--text-muted);"></i> Sisa: <strong>${activeKey.balance} Credits</strong></span>` : '';
    els.freebeatActiveBalanceDisplay.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-gold);"></i> Terpakai: <strong>${used} Credits</strong></span>${balanceText}
    `;
    els.freebeatActiveBalanceWrapper.style.display = 'block';
  } else {
    els.freebeatActiveBalanceWrapper.style.display = 'none';
  }
}

function renderFreebeatKeysTable() {
  els.keysListBody.innerHTML = '';
  if (state.freebeatKeys.length === 0) {
    els.keysListBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada API Key.</td></tr>';
    return;
  }
  
  state.freebeatKeys.forEach(key => {
    const tr = document.createElement('tr');
    
    const used = key.used_credits || 0;
    const sisa = (key.balance !== null && key.balance !== undefined) ? `${key.balance} Credits` : '-';
    
    tr.innerHTML = `
      <td><strong>${key.label}</strong></td>
      <td><span style="font-family: monospace; font-size: 11px;">${key.key} (${sisa})</span></td>
      <td>${used} Credits</td>
      <td>
        <button class="btn btn-secondary btn-action-del-key" style="display: inline-flex; width: auto; margin-top: 0; padding: 4px 10px; font-size: 11px; border-color: var(--accent-red); color: var(--accent-red);" type="button">
          <i class="fa-solid fa-trash"></i> Hapus
        </button>
      </td>
    `;
    
    tr.querySelector('.btn-action-del-key').addEventListener('click', () => {
      handleDeleteFreebeatKey(key.id, key.label);
    });
    
    els.keysListBody.appendChild(tr);
  });
}

async function handleAddFreebeatKey(e) {
  e.preventDefault();
  const label = els.newKeyLabel.value.trim();
  const keyVal = els.newKeyVal.value.trim();
  
  if (!label || !keyVal) {
    showToast('Semua field wajib diisi!', 'error');
    return;
  }
  
  const id = 'fb_' + Date.now().toString();
  
  try {
    const response = await fetch('/api/freebeat-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, label, key: keyVal })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      showToast('API Key Freebeat berhasil ditambahkan!', 'success');
      els.newKeyLabel.value = '';
      els.newKeyVal.value = '';
      
      // Auto save active key selection
      if (state.freebeatKeys.length === 0) {
        state.activeFreebeatKeyId = id;
        localStorage.setItem('active_freebeat_key_id', id);
      }
      
      await loadFreebeatKeys();
      autoDetectFreebeatBalance();
    } else {
      showToast(data.error || 'Gagal menambahkan API Key.', 'error');
    }
  } catch (error) {
    console.error('Add freebeat key error:', error);
    showToast('Gagal terhubung ke server.', 'error');
  }
}

async function handleDeleteFreebeatKey(keyId, label) {
  if (!confirm(`Apakah Anda yakin ingin menghapus API Key "${label}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/freebeat-keys/${keyId}`, { method: 'DELETE' });
    const data = await response.json();
    if (response.ok && data.success) {
      showToast('API Key berhasil dihapus.', 'success');
      if (state.activeFreebeatKeyId === keyId) {
        state.activeFreebeatKeyId = '';
        localStorage.removeItem('active_freebeat_key_id');
      }
      loadFreebeatKeys();
    } else {
      showToast(data.error || 'Gagal menghapus API Key.', 'error');
    }
  } catch (error) {
    console.error('Delete key error:', error);
    showToast('Gagal terhubung ke server.', 'error');
  }
}

function handleSelectFreebeatKey() {
  state.activeFreebeatKeyId = els.freebeatKeySelect.value;
  localStorage.setItem('active_freebeat_key_id', state.activeFreebeatKeyId);
  renderFreebeatKeySelect();
  showToast('API Key Aktif diganti.', 'info');
  
  autoDetectFreebeatBalance();
}

async function autoDetectFreebeatBalance() {
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (!activeKey) {
    return;
  }
  
  const refreshBtn = els.btnRefreshFreebeatBalance;
  const icon = refreshBtn.querySelector('i');
  if (icon) icon.classList.add('fa-spin');
  refreshBtn.disabled = true;
  
  showToast('Menghubungi server Freebeat untuk menyinkronkan balance...', 'info');
  try {
    // Attempt credits API
    const response = await fetch('/proxy', {
      method: 'GET',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/credits',
        'Authorization': activeKey.id // Sending Key ID which server resolves
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data.code === 200 || data.code === 0) {
            const credits = data.data.credits + (data.data.extra_credits || 0);
            await saveKeyBalanceToDB(activeKey, credits);
            return;
          }
        } catch (e) {}
      }
    }
    
    // Fallback: user info API
    const infoResponse = await fetch('/proxy', {
      method: 'GET',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/user/info',
        'Authorization': activeKey.id
      }
    });
    
    if (infoResponse.ok) {
      const text = await infoResponse.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data.code === 0 && data.data && data.data.credits !== undefined) {
            const credits = data.data.credits + (data.data.extra_credits || 0);
            await saveKeyBalanceToDB(activeKey, credits);
            return;
          }
        } catch (e) {}
      }
    }
    
    showToast('Cek Balance: API Developer Freebeat tidak menyediakan info sisa balance. Menggunakan pelacakan manual.', 'warning');
  } catch (err) {
    console.error('Error auto detecting balance:', err);
    showToast('Gagal terhubung ke API Freebeat untuk cek balance.', 'error');
  } finally {
    if (icon) icon.classList.remove('fa-spin');
    refreshBtn.disabled = false;
  }
}

async function saveKeyBalanceToDB(keyObj, credits) {
  try {
    // Send to DB to save
    const response = await fetch('/api/freebeat-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: keyObj.id,
        label: keyObj.label,
        key: keyObj.key, // Masked if user is non-admin, but server route will check conf schema.
        usedCredits: keyObj.used_credits || 0,
        balance: credits
      })
    });
    if (response.ok) {
      await loadFreebeatKeys();
      showToast(`Balance berhasil disinkronkan: ${credits} Credits!`, 'success');
    }
  } catch (error) {
    console.error('Save balance error:', error);
  }
}

// ----------------------------------------------------
// 5. Generator logic (Load built-in templates)
// ----------------------------------------------------

function loadTemplate(templateId) {
  const tpl = templates[templateId];
  if (!tpl) return;
  
  // Clear/reset active storyboard workspace instead of populating with dummy scene data
  state.storyboardTitle = '';
  state.masterGridPrompt = '';
  state.masterSeedancePrompt = '';
  state.scenes = [];
  state.videoPrompts = {};
  
  // Reset image
  state.combinedImage = '';
  state.combinedImage2 = '';
  state.imageCount = 1;
  els.combinedStoryboardImage.src = '';
  els.combinedStoryboardImage.style.display = 'none';
  els.combinedStoryboardImage2.src = '';
  els.combinedStoryboardImage2.style.display = 'none';
  els.combinedImagePlaceholder.style.display = 'flex';
  els.btnDownloadCombined.disabled = true;
  els.btnExportStoryboard.disabled = true;
  
  // Reset I2V/V2V states
  state.vStartFile = null;
  state.vStartImage = '';
  state.vEndFile = null;
  state.vEndImage = '';
  state.vRefFile = null;
  state.vRefVideo = '';
  state.videoGenerationType = 1;
  state.imageSize = '1024x1024';
  
  els.freebeatGenerationType.value = "1";
  els.imageSizeSelect.value = "1024x1024";
  els.imageCountSelect.value = "1";
  els.freebeatI2vInputs.style.display = 'none';
  els.freebeatV2vInputs.style.display = 'none';
  els.vStartPreviewContainer.style.display = 'none';
  els.vEndPreviewContainer.style.display = 'none';
  els.vRefPreviewContainer.style.display = 'none';
  els.freebeatVRefUrl.value = '';
  els.lblStoryboardImg1.style.display = 'none';
  els.storyboardImg2Wrapper.style.display = 'none';
  els.storyboardImagesGrid.style.gridTemplateColumns = '1fr';
  els.storyboardImagesContainer.style.display = 'none';
  els.btnUseStoryboardStart2.style.display = 'none';
  els.btnUseStoryboardEnd2.style.display = 'none';
  
  // Clear prompts editor values
  els.masterGridPrompt.value = '';
  els.masterSeedancePrompt.value = '';
  
  // Hide video preview/status if open
  els.freebeatVideoStatusContainer.style.display = 'none';
  els.freebeatGeneratedVideo.src = '';
  
  // Keep storyboard preview hidden, show empty state
  els.storyboardPreviewWrapper.style.display = 'none';
  els.storyboardEmptyState.style.display = 'block';
  els.btnClearStoryboard.style.display = 'none';
  
  if (els.perFrameScenesList) {
    els.perFrameScenesList.innerHTML = '';
  }
  
  // Sync template dropdown option selection
  els.templateSelect.value = templateId;
  
  showToast(`Gaya Video "${tpl.title}" berhasil dipilih. Tulis konsep video Anda lalu klik "Buat Storyboard AI" untuk memulai!`, 'info');
}

// Clear Storyboard Creator State
function clearStoryboard() {
  state.storyboardTitle = '';
  state.masterGridPrompt = '';
  state.masterSeedancePrompt = '';
  state.combinedImage = '';
  state.combinedImage2 = '';
  state.imageCount = 1;
  
  // Clear inputs
  els.recipeConcept.value = '';
  els.templateSelect.value = '';
  els.imageCountSelect.value = '1';
  
  // Clear product reference image if any
  if (state.productImage) {
    clearProductImage();
  }
  
  // Clear character reference image if any
  if (state.characterImage) {
    clearCharacterImage();
  }
  
  // Reset I2V/V2V states
  state.vStartFile = null;
  state.vStartImage = '';
  state.vEndFile = null;
  state.vEndImage = '';
  state.vRefFile = null;
  state.vRefVideo = '';
  state.videoGenerationType = 1;
  state.imageSize = '1024x1024';
  
  els.freebeatGenerationType.value = "1";
  els.imageSizeSelect.value = "1024x1024";
  els.freebeatI2vInputs.style.display = 'none';
  els.freebeatV2vInputs.style.display = 'none';
  
  els.vStartPreviewContainer.style.display = 'none';
  els.vStartPreviewImg.src = '';
  els.btnUploadVStart.innerHTML = '<i class="fa-solid fa-image"></i> Upload Gambar Awal';
  
  els.vEndPreviewContainer.style.display = 'none';
  els.vEndPreviewImg.src = '';
  els.btnUploadVEnd.innerHTML = '<i class="fa-solid fa-image"></i> Upload Gambar Akhir';
  
  els.freebeatVRefUrl.value = '';
  els.vRefPreviewContainer.style.display = 'none';
  els.vRefPreviewVideo.src = '';
  els.btnUploadVRef.innerHTML = '<i class="fa-solid fa-video"></i> Upload File Video';
  
  // Clear prompts
  els.masterGridPrompt.value = '';
  els.masterSeedancePrompt.value = '';
  
  // Reset combined image view
  els.combinedStoryboardImage.src = '';
  els.combinedStoryboardImage2.src = '';
  els.lblStoryboardImg1.style.display = 'none';
  els.storyboardImg2Wrapper.style.display = 'none';
  els.storyboardImagesGrid.style.gridTemplateColumns = '1fr';
  els.storyboardImagesContainer.style.display = 'none';
  
  els.btnUseStoryboardStart2.style.display = 'none';
  els.btnUseStoryboardEnd2.style.display = 'none';
  
  els.combinedImagePlaceholder.style.display = 'flex';
  els.btnDownloadCombined.disabled = true;
  els.btnExportStoryboard.disabled = true;
  
  // Reset per frame scenes and model prompts
  state.scenes = [];
  state.videoPrompts = {};
  if (els.perFrameScenesList) {
    els.perFrameScenesList.innerHTML = '';
  }
  
  // Hide video preview/status if open
  els.freebeatVideoStatusContainer.style.display = 'none';
  els.freebeatGeneratedVideo.src = '';
  
  // Toggle Visibility
  els.storyboardPreviewWrapper.style.display = 'none';
  els.storyboardEmptyState.style.display = 'block';
  els.btnClearStoryboard.style.display = 'none';
  
  showToast('Storyboard berhasil dibersihkan.', 'success');
}

// Copy Master Grid Prompt
async function copyMasterPrompt() {
  const text = els.masterGridPrompt.value.trim();
  if (!text) return;
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('Prompt Master Storyboard berhasil disalin!', 'success');
  } catch (err) {
    showToast('Gagal menyalin teks.', 'error');
  }
}

// Copy Seedance Video Prompt
async function copySeedancePrompt() {
  const text = els.masterSeedancePrompt.value.trim();
  if (!text) return;
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('Prompt Seedance berhasil disalin!', 'success');
  } catch (err) {
    showToast('Gagal menyalin teks.', 'error');
  }
}

// Helper to sanitize JSON response from LLM by escaping control characters (newlines, tabs, etc.) inside string literals
function sanitizeJsonString(str) {
  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escape) {
      inString = !inString;
    }
    
    if (inString) {
      const code = char.charCodeAt(0);
      if (code < 32) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += '\\u' + code.toString(16).padStart(4, '0');
        }
      } else {
        result += char;
      }
    } else {
      result += char;
    }
    
    if (char === '\\' && !escape) {
      escape = true;
    } else {
      escape = false;
    }
  }
  return result;
}

// API Generation: Create Storyboard Steps with LLM (via secure endpoint)
async function generateStoryboardWithAI() {
  let concept = els.recipeConcept.value.trim();
  const selectedTemplateId = els.templateSelect.value;
  if (!concept && selectedTemplateId && templates[selectedTemplateId]) {
    concept = templates[selectedTemplateId].title;
  }
  if (!concept) {
    showToast('Harap masukkan konsep resep/video atau pilih template terlebih dahulu!', 'error');
    return;
  }
  
  els.btnGenerateStoryboard.disabled = true;
  els.btnGenerateStoryboard.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan AI...';
  
  let systemPrompt = '';
  if (state.storyboardMode === 'per-frame') {
    systemPrompt = `You are an expert storyboard planner for AI video generation on platforms like Seedance.
Your task is to take a cooking recipe, video concept, or a base template and design a step-by-step storyboard consisting of ${state.sceneCount} sequential scenes.
CRITICAL: If the user provides a product reference image, you MUST analyze it and explicitly describe the product's visual features (such as branding, colors, shape, and packaging) in the generated image prompts of all scenes to maintain visual consistency. If a character reference image is provided, you MUST analyze it and explicitly describe the character's face, hair, clothing, and overall appearance in all scenes involving the character to maintain visual consistency.
For each scene, you must design:
1. An image prompt ("image_prompt") in English that will generate a clean, high-quality, professional food/beverage or product photography image representing that scene. The image MUST contain NO text overlays, NO borders, and NO grid lines.
2. A video prompt ("video_prompt") in English that describes the animation, camera movement, and detail for that specific scene starting from the generated image. Since this is for a single image to video, it should describe the motion starting from the image itself.
3. A title ("title") in Indonesian representing the scene action (e.g. "Finished Dish", "Bahan-Bahan", "Iris Bawang").

Respond ONLY with a JSON object in this format (no markdown blocks, just raw JSON, or wrap it inside clean markdown JSON):
{
  "title": "NAMA RESEP / KONSEP",
  "scenes": [
    {
      "scene_number": 1,
      "title": "...",
      "image_prompt": "...",
      "video_prompt": "..."
    },
    ...
  ]
}`;
  } else {
    systemPrompt = `You are an expert storyboard planner for AI video generation on platforms like Seedance.
Your task is to take a cooking recipe, video concept, or a base template and design:
1. A master grid prompt ("master_grid_prompt") in English that will generate a single vertical storyboard grid image consisting of ${state.sceneCount} sequential vertical panels. The image should be formatted exactly like a cooking video recipe infographic. Each panel must depict a step. Instruct the image generator to draw "SCENE X" (yellow bold text) on the top-left of each panel, timestamps (white text) on the top-right, and a solid black footer directly below each panel containing a bold yellow/gold title in Indonesian and a short description in white text in Indonesian. Separate all panels with a clean thin white border line. Use a dark background and professional food photography style.
CRITICAL: If the user provides a product reference image, you MUST analyze it and explicitly describe the product's visual features (such as branding, colors, shape, and packaging) in the generated master grid prompt. If a character reference image is provided, you MUST analyze it and explicitly describe the character's face, hair, clothing, and overall appearance consistently in all panels involving the character.
2. A single master Seedance prompt ("master_seedance_prompt") in English. This is a unified prompt that will be sent to Seedance along with the uploaded grid image to animate the storyboard. It must describe the chronological animation, camera movement, and visual details for each of the ${state.sceneCount} panels sequentially, referencing the timestamps.
CRITICAL: You MUST begin the "master_seedance_prompt" with a strong instruction directing the video generator to completely ignore and crop out all grid lines, borders, black footers, text overlays, and labels from the input image, and to zoom in to show only the clean food/beverage and action in full screen. For example, begin with: "IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the food/beverage and action in clean full screen. At the very beginning (0-Xs), start directly with a clean, full-screen cinematic shot of [Scene 1 Description], with absolutely no text or borders visible." and then list the remaining scenes.

Respond ONLY with a JSON object in this format (no markdown blocks, just raw JSON, or wrap it inside clean markdown JSON):
{
  "title": "NAMA RESEP / KONSEP",
  "master_grid_prompt": "...",
  "master_seedance_prompt": "..."
}`;
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    const isPerFrame = state.storyboardMode === 'per-frame';
    const storyboardTypeStr = isPerFrame ? 'per-frame' : 'single-prompt master grid';

    let userText = `Create a ${storyboardTypeStr} storyboard with ${state.sceneCount} steps for: "${concept}".`;
    if (selectedTemplateId && templates[selectedTemplateId]) {
      const tpl = templates[selectedTemplateId];
      userText += `\n\nCRITICAL STYLE DIRECTION: You MUST format and structure the storyboard according to the "${tpl.title}" style guidelines:\n${tpl.instructions}\n`;
      userText += `\nHere are the baseline scene flows of the style for your reference:\n`;
      tpl.scenes.forEach((s, i) => {
        userText += `Scene ${i+1}: ${s.title}\n- Image Prompt Base: ${s.image_prompt}\n- Video Prompt Base: ${s.video_prompt}\n`;
      });
    }

    if (state.productImage || state.characterImage) {
      const userContent = [
        { type: 'text', text: userText }
      ];
      
      let instructions = '';
      if (state.productImage) {
        userContent.push({ type: 'image_url', image_url: { url: state.productImage } });
        instructions += ' Analyze the attached product reference image. You MUST explicitly and in detail describe this specific product (e.g. its packaging shape, colors, brand text/logo placement, and physical details) in the generated image prompts of all scenes to maintain visual consistency.';
      }
      if (state.characterImage) {
        userContent.push({ type: 'image_url', image_url: { url: state.characterImage } });
        instructions += ' Analyze the attached character reference image. You MUST explicitly and consistently describe this specific character\'s appearance, face, hair style, clothing, and styling in all scenes involving the character to maintain visual consistency.';
      }
      
      userContent[0].text += instructions;
      
      messages.push({
        role: 'user',
        content: userContent
      });
    } else {
      messages.push({
        role: 'user',
        content: userText
      });
    }

    const response = await fetch('/api/ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: state.textModel,
        response_format: { type: "json_object" },
        messages: messages
      })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server error: ${response.status}`);
    }
    
    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }
    
    const parsedData = JSON.parse(sanitizeJsonString(content));
    
    state.storyboardTitle = parsedData.title || 'Custom Recipe Storyboard';
    
    if (state.storyboardMode === 'per-frame') {
      state.scenes = (parsedData.scenes || []).map(scene => ({
        scene_number: scene.scene_number,
        title: scene.title || `Scene ${scene.scene_number}`,
        image_prompt: scene.image_prompt || '',
        video_prompt: scene.video_prompt || '',
        imageUrl: '',
        isGenerating: false,
        batchId: ''
      }));
      
      // Also generate a combined master Seedance prompt from all individual video prompts
      const combinedVideoPrompt = state.scenes.map(s => `Scene ${s.scene_number}: ${s.video_prompt}`).join('\n');
      state.masterSeedancePrompt = combinedVideoPrompt;
      els.masterSeedancePrompt.value = combinedVideoPrompt;
      
      // Update prompt for current model
      const modelId = els.freebeatModelSelect.value;
      if (modelId) {
        state.videoPrompts[modelId] = combinedVideoPrompt;
      }
      
      renderPerFrameScenes();
      
      showToast('Storyboard AI berhasil dibuat (Mode Per Frame)!', 'success');
      
      // Show Preview Wrapper
      els.storyboardEmptyState.style.display = 'none';
      els.storyboardPreviewWrapper.style.display = 'flex';
      els.btnClearStoryboard.style.display = 'flex';
      els.storyboardDisplayTitle.textContent = state.storyboardTitle;
      els.storyboardDisplayMeta.textContent = `Per Frame • ${state.scenes.length} Langkah`;
    } else {
      state.masterGridPrompt = parsedData.master_grid_prompt || '';
      state.masterSeedancePrompt = parsedData.master_seedance_prompt || '';
      
      // Set prompt input values
      els.masterGridPrompt.value = state.masterGridPrompt;
      els.masterSeedancePrompt.value = state.masterSeedancePrompt;
      
      // Update prompt for current model
      const modelId = els.freebeatModelSelect.value;
      if (modelId) {
        state.videoPrompts[modelId] = state.masterSeedancePrompt;
      }
      
      showToast('Storyboard AI berhasil dibuat!', 'success');
      
      // Show Preview Wrapper
      els.storyboardEmptyState.style.display = 'none';
      els.storyboardPreviewWrapper.style.display = 'flex';
      els.btnClearStoryboard.style.display = 'flex';
      els.storyboardDisplayTitle.textContent = state.storyboardTitle;
      els.storyboardDisplayMeta.textContent = `Infografis Gabungan • ${state.sceneCount} Langkah`;
      
      // Reset image placeholder
      state.combinedImage = '';
      els.combinedStoryboardImage.src = '';
      els.combinedStoryboardImage.style.display = 'none';
      els.combinedImagePlaceholder.style.display = 'flex';
      els.btnDownloadCombined.disabled = true;
      els.btnExportStoryboard.disabled = true;
    }
    
  } catch (error) {
    console.error('LLM generation error:', error);
    showToast(`Gagal membuat storyboard: ${error.message}`, 'error');
  } finally {
    els.btnGenerateStoryboard.disabled = false;
    els.btnGenerateStoryboard.innerHTML = '<i class="fa-solid fa-bolt"></i> Buat Storyboard AI';
  }
}

// Helper to upload reference images to Freebeat and cache S3 URLs
async function getUploadedReferenceUrls() {
  let productUrl = state.productImageUrl || '';
  if (state.productImage && !productUrl) {
    try {
      const blob = dataURLtoBlob(state.productImage);
      const file = new File([blob], 'product_ref.png', { type: blob.type });
      productUrl = await uploadFileToFreebeat(file, 'agent/product');
      state.productImageUrl = productUrl;
    } catch (e) {
      console.error('Failed to upload product reference image:', e);
      showToast('Gagal mengunggah gambar referensi produk ke server Freebeat.', 'warning');
    }
  }

  let characterUrl = state.characterImageUrl || '';
  if (state.characterImage && !characterUrl) {
    try {
      const blob = dataURLtoBlob(state.characterImage);
      const file = new File([blob], 'character_ref.png', { type: blob.type });
      characterUrl = await uploadFileToFreebeat(file, 'agent/character');
      state.characterImageUrl = characterUrl;
    } catch (e) {
      console.error('Failed to upload character reference image:', e);
      showToast('Gagal mengunggah gambar referensi karakter ke server Freebeat.', 'warning');
    }
  }

  return { productUrl, characterUrl };
}

// API Generation: Generate the Single Combined Grid Image using the Master Grid Prompt
async function generateCombinedStoryboardImage() {
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (!activeKey) {
    showToast('Silakan pilih atau tambahkan API Key Freebeat terlebih dahulu!', 'error');
    return;
  }

  const prompt = els.masterGridPrompt.value.trim();
  if (!prompt) {
    showToast('Master grid prompt kosong! Harap muat template atau buat dengan AI.', 'error');
    return;
  }
  
  els.btnGenerateCombinedImage.disabled = true;
  els.btnGenerateCombinedImage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Grid...';
  
  // Show image loading overlay
  els.combinedImagePlaceholder.style.display = 'none';
  els.combinedStoryboardImage.style.display = 'none';
  els.combinedImageLoader.style.display = 'flex';
  els.combinedLoaderText.textContent = 'Memulai antrean render Image Studio...';

  let productUrl = '';
  let characterUrl = '';
  if (state.productImage || state.characterImage) {
    els.combinedLoaderText.textContent = 'Mengunggah gambar referensi ke server...';
    const urls = await getUploadedReferenceUrls();
    productUrl = urls.productUrl;
    characterUrl = urls.characterUrl;
    els.combinedLoaderText.textContent = 'Memulai antrean render Image Studio...';
  }

  const itemData = {
    businessType: 9,
    modelId: String(state.imageModel),
    generationType: 6,
    prompt: prompt.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
    size: state.imageSize || "1024x1024",
    resolution: state.imageSize || "1024x1024",
    quality: "medium",
    count: parseInt(state.imageCount, 10) || 1
  };

  const refImages = [];
  if (productUrl) refImages.push(productUrl);
  if (characterUrl) refImages.push(characterUrl);
  if (refImages.length > 0) {
    itemData.images = refImages;
  }

  const requestBody = {
    items: [itemData]
  };

  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/createImageBatch',
        'Authorization': activeKey.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Koneksi API gagal. HTTP status: ${response.status}`);
    }
    
    const text = await response.text();
    const data = JSON.parse(sanitizeJsonString(text));
    if (data.code !== 0) {
      throw new Error(data.msg || 'Terjadi kesalahan dari API Freebeat');
    }
    
    const batchData = data.data;
    const batchId = batchData.batchId;
    const item = batchData.items[0];
    
    if (item && !item.accepted) {
      throw new Error(item.message || 'Render gambar ditolak oleh server Freebeat.');
    }
    
    els.combinedLoaderText.textContent = 'Render gambar diterima! Menunggu antrean rendering...';
    showToast('Render gambar berhasil dibuat! Memulai polling...', 'success');
    
    // Create new history item in DB
    const historyItem = {
      id: batchId,
      recipeTitle: state.storyboardTitle || 'Gambar Storyboard',
      prompt: prompt + '\n\n=== VIDEO PROMPT ===\n\n' + (state.masterSeedancePrompt || ''),
      modelId: String(state.imageModel),
      duration: 0,
      resolution: state.imageSize || '1024x1024',
      aspectRatio: '1:1',
      generateAudio: false,
      timestamp: Date.now(),
      status: 'processing',
      videoUrl: '',
      errorMsg: '',
      credits: 0,
      type: 'image'
    };
    
    try {
      const saveResponse = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyItem)
      });
      if (saveResponse.ok) {
        await loadFreebeatHistory();
      }
    } catch (e) {
      console.error('Failed to save image processing history:', e);
    }

    startFreebeatImagePolling(batchId, activeKey);
    
  } catch (error) {
    console.error('Combined image generation error:', error);
    showToast(`Gagal: ${error.message}`, 'error');
    
    // Restore empty placeholder
    els.combinedImagePlaceholder.style.display = 'flex';
    els.combinedStoryboardImage.style.display = 'none';
    els.combinedImageLoader.style.display = 'none';
    els.btnDownloadCombined.disabled = true;
    els.btnExportStoryboard.disabled = true;
    
    els.btnGenerateCombinedImage.disabled = false;
    els.btnGenerateCombinedImage.innerHTML = '<i class="fa-solid fa-image"></i> Generate Gambar Storyboard (1 Prompt)';
  }
}

// Poll status of image generation
function startFreebeatImagePolling(batchId, activeKey) {
  if (state.freebeatImageIntervals[batchId]) {
    clearInterval(state.freebeatImageIntervals[batchId]);
  }
  
  state.freebeatImageIntervals[batchId] = setInterval(async () => {
    try {
      const response = await fetch('/proxy', {
        method: 'POST',
        headers: {
          'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/queryBatch',
          'Authorization': activeKey.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchId: batchId })
      });
      
      if (!response.ok) return; // Silent retry
      
      const data = await response.json();
      if (data.code !== 0) return; // Silent retry
      
      const batchData = data.data;
      const items = batchData.items || [];
      if (items.length === 0) return;
      
      const allDone = items.every(item => {
        const status = String(item.status).toLowerCase();
        return (status === 'success' || status === 'completed' || status === 'finished' || status === 'failed' || status === 'rejected' || status === 'error');
      });
      
      if (allDone) {
        clearInterval(state.freebeatImageIntervals[batchId]);
        delete state.freebeatImageIntervals[batchId];
        
        els.combinedImageLoader.style.display = 'none';
        els.btnGenerateCombinedImage.disabled = false;
        els.btnGenerateCombinedImage.innerHTML = '<i class="fa-solid fa-image"></i> Generate Gambar Storyboard (1 Prompt)';
        
        const successes = items.filter(item => {
          const status = String(item.status).toLowerCase();
          return (status === 'success' || status === 'completed' || status === 'finished');
        });
        
        if (successes.length === items.length) {
          const imgUrl1 = successes[0].imageUrl || successes[0].videoUrl;
          if (!imgUrl1) {
            showToast('Gagal: Image URL 1 kosong dari response Freebeat.', 'error');
            els.combinedImagePlaceholder.style.display = 'flex';
            els.storyboardImagesContainer.style.display = 'none';
            return;
          }
          
          state.combinedImage = imgUrl1;
          els.combinedStoryboardImage.src = imgUrl1;
          els.combinedStoryboardImage.style.display = 'block';
          
          if (items.length > 1) {
            const imgUrl2 = successes[1].imageUrl || successes[1].videoUrl;
            if (imgUrl2) {
              state.combinedImage2 = imgUrl2;
              els.combinedStoryboardImage2.src = imgUrl2;
              els.combinedStoryboardImage2.style.display = 'block';
              els.lblStoryboardImg1.style.display = 'block';
              els.storyboardImg2Wrapper.style.display = 'block';
              els.storyboardImagesGrid.style.gridTemplateColumns = '1fr 1fr';
              
              els.btnUseStoryboardStart2.style.display = 'inline-block';
              els.btnUseStoryboardEnd2.style.display = 'inline-block';
            }
          } else {
            state.combinedImage2 = '';
            els.combinedStoryboardImage2.src = '';
            els.combinedStoryboardImage2.style.display = 'none';
            els.lblStoryboardImg1.style.display = 'none';
            els.storyboardImg2Wrapper.style.display = 'none';
            els.storyboardImagesGrid.style.gridTemplateColumns = '1fr';
            
            els.btnUseStoryboardStart2.style.display = 'none';
            els.btnUseStoryboardEnd2.style.display = 'none';
          }
          
          els.storyboardImagesContainer.style.display = 'block';
          els.combinedImagePlaceholder.style.display = 'none';
          
          els.btnDownloadCombined.disabled = false;
          els.btnExportStoryboard.disabled = false;
          showToast('Gambar infografis storyboard berhasil dibuat!', 'success');

          // Extract credits and save success state to DB
          const totalCredits = successes.reduce((acc, item) => acc + (item.usedCredits !== undefined ? item.usedCredits : (item.credits !== undefined ? item.credits : 0)), 0);
          
          try {
            const existingHistory = state.freebeatHistory.find(h => h.id === batchId) || {};
            const historyItem = {
              id: batchId,
              recipeTitle: existingHistory.recipeTitle || state.storyboardTitle || 'Gambar Storyboard',
              prompt: existingHistory.prompt || '',
              modelId: existingHistory.modelId || String(state.imageModel),
              duration: 0,
              resolution: existingHistory.resolution || state.imageSize || '1024x1024',
              aspectRatio: '1:1',
              generateAudio: false,
              timestamp: existingHistory.timestamp || Date.now(),
              status: 'success',
              videoUrl: imgUrl1,
              errorMsg: '',
              credits: totalCredits,
              type: 'image'
            };
            
            await fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(historyItem)
            });

            // Deduct credits and update key balance
            const newUsed = (activeKey.used_credits || 0) + totalCredits;
            let newBalance = activeKey.balance;
            if (activeKey.balance !== null && activeKey.balance !== undefined) {
              newBalance = Math.max(0, activeKey.balance - totalCredits);
            }
            
            await fetch('/api/freebeat-keys', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: activeKey.id,
                label: activeKey.label,
                key: activeKey.key,
                usedCredits: newUsed,
                balance: newBalance
              })
            });
            
            await loadFreebeatKeys();
            await loadFreebeatHistory();
            await refreshSessionUserCredits();
          } catch (e) {
            console.error('Failed to update image success history:', e);
          }
        } else {
          const failedItem = items.find(item => {
            const status = String(item.status).toLowerCase();
            return (status === 'failed' || status === 'rejected' || status === 'error');
          });
          const errorMsg = failedItem?.errorMessage || 'Proses render gambar di server Freebeat gagal.';
          
          // Save failed state to DB
          try {
            const existingHistory = state.freebeatHistory.find(h => h.id === batchId) || {};
            const historyItem = {
              id: batchId,
              recipeTitle: existingHistory.recipeTitle || state.storyboardTitle || 'Gambar Storyboard',
              prompt: existingHistory.prompt || '',
              modelId: existingHistory.modelId || String(state.imageModel),
              duration: 0,
              resolution: existingHistory.resolution || state.imageSize || '1024x1024',
              aspectRatio: '1:1',
              generateAudio: false,
              timestamp: existingHistory.timestamp || Date.now(),
              status: 'failed',
              videoUrl: '',
              errorMsg: errorMsg,
              credits: 0,
              type: 'image'
            };
            
            await fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(historyItem)
            });
            await loadFreebeatHistory();
          } catch (e) {
            console.error('Failed to update failed image history:', e);
          }

          showToast(`Gagal generate gambar: ${errorMsg}`, 'error');
          els.combinedImagePlaceholder.style.display = 'flex';
          els.storyboardImagesContainer.style.display = 'none';
        }
      } else {
        const statuses = items.map(item => String(item.status).toUpperCase()).join(', ');
        els.combinedLoaderText.textContent = `Rendering gambar... Status: ${statuses}`;
      }
    } catch (err) {
      console.error('Image polling error:', err);
    }
  }, 5000);
}

// Download action for combined image
function downloadCombinedStoryboardImage() {
  if (!state.combinedImage) return;
  
  const link = document.createElement('a');
  const safeTitle = state.storyboardTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  link.download = `storyboard_${safeTitle}.png`;
  link.href = state.combinedImage;
  link.click();
  showToast('Gambar storyboard infografis berhasil diunduh!', 'success');
}

// Upload action for combined image manual file override
function handleCombinedFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.combinedImage = e.target.result;
    state.combinedImage2 = '';
    
    els.combinedStoryboardImage.src = state.combinedImage;
    els.combinedStoryboardImage2.src = '';
    els.lblStoryboardImg1.style.display = 'none';
    els.storyboardImg2Wrapper.style.display = 'none';
    els.storyboardImagesGrid.style.gridTemplateColumns = '1fr';
    
    els.storyboardImagesContainer.style.display = 'block';
    els.combinedImagePlaceholder.style.display = 'none';
    
    els.btnDownloadCombined.disabled = false;
    els.btnExportStoryboard.disabled = false;
    showToast('File gambar infografis manual berhasil diupload!', 'success');
  };
  reader.readAsDataURL(file);
}

// End-to-End One-Click Flow
async function runOneClickFlow() {
  const concept = els.recipeConcept.value.trim();
  if (!concept) {
    showToast('Harap masukkan konsep resep/video terlebih dahulu!', 'error');
    return;
  }
  
  els.btnOneClickFlow.disabled = true;
  els.btnOneClickFlow.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Storyboard...';
  
  try {
    // 1. Generate text details and prompts
    showToast('Langkah 1: Membuat urutan storyboard & prompt master...', 'info');
    await generateStoryboardWithAI();
    
    if (!state.masterGridPrompt) {
      throw new Error('Gagal memuat prompt grid master.');
    }
    
    // 2. Generate the single combined grid image
    els.btnOneClickFlow.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Grid Image...';
    showToast('Langkah 2: Menghasilkan gambar infografis gabungan...', 'info');
    await generateCombinedStoryboardImage();
    
    if (state.combinedImage) {
      // 3. Download
      downloadCombinedStoryboardImage();
      showToast('Proses 1-Click selesai! File infografis berhasil diunduh.', 'success');
    } else {
      throw new Error('Gagal menghasilkan gambar gabungan.');
    }
  } catch (error) {
    console.error('One click flow error:', error);
    showToast(`Gagal menyelesaikan proses: ${error.message}`, 'error');
  } finally {
    els.btnOneClickFlow.disabled = false;
    els.btnOneClickFlow.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 1-Click: Buat & Ekspor PNG';
  }
}

// Helper function to compress and resize base64 images before sending to vision LLM
function compressAndResizeImage(file, maxDimension = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target.result); // Fallback to original
      };
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
}

async function handleProductImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  showToast('Memproses gambar referensi produk...', 'info');
  try {
    const compressedDataUrl = await compressAndResizeImage(file, 800);
    state.productImage = compressedDataUrl;
    state.productImageUrl = ''; // Reset cached S3 URL
    els.productPreviewImg.src = state.productImage;
    els.productPreviewContainer.style.display = 'flex';
    els.btnClearProduct.style.display = 'block';
    els.btnUploadProduct.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Foto Produk';
    showToast('Gambar referensi produk berhasil diunggah dan dioptimalkan!', 'success');
  } catch (error) {
    console.error('Product image processing error:', error);
    showToast('Gagal memproses gambar referensi produk.', 'error');
  }
}

function clearProductImage() {
  state.productImage = '';
  state.productImageUrl = ''; // Reset cached S3 URL
  els.productImageInput.value = '';
  els.productPreviewImg.src = '';
  els.productPreviewContainer.style.display = 'none';
  els.btnClearProduct.style.display = 'none';
  els.btnUploadProduct.innerHTML = '<i class="fa-solid fa-camera"></i> Upload Foto Produk';
  showToast('Gambar referensi produk dihapus.', 'info');
}

async function handleCharacterImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  showToast('Memproses gambar referensi karakter...', 'info');
  try {
    const compressedDataUrl = await compressAndResizeImage(file, 800);
    state.characterImage = compressedDataUrl;
    state.characterImageUrl = ''; // Reset cached S3 URL
    els.characterPreviewImg.src = state.characterImage;
    els.characterPreviewContainer.style.display = 'flex';
    els.btnClearCharacter.style.display = 'block';
    els.btnUploadCharacter.innerHTML = '<i class="fa-solid fa-user-astronaut"></i> Ganti Foto Karakter';
    showToast('Gambar referensi karakter berhasil diunggah dan dioptimalkan!', 'success');
  } catch (error) {
    console.error('Character image processing error:', error);
    showToast('Gagal memproses gambar referensi karakter.', 'error');
  }
}

function clearCharacterImage() {
  state.characterImage = '';
  state.characterImageUrl = ''; // Reset cached S3 URL
  els.characterImageInput.value = '';
  els.characterPreviewImg.src = '';
  els.characterPreviewContainer.style.display = 'none';
  els.btnClearCharacter.style.display = 'none';
  els.btnUploadCharacter.innerHTML = '<i class="fa-solid fa-user-astronaut"></i> Upload Foto Karakter';
  showToast('Gambar referensi karakter dihapus.', 'info');
}

// Video Mode Selection toggler
function handleSelectVideoMode() {
  const mode = parseInt(els.freebeatGenerationType.value, 10) || 1;
  state.videoGenerationType = mode;
  
  if (mode === 1) {
    els.freebeatI2vInputs.style.display = 'none';
    els.freebeatV2vInputs.style.display = 'none';
  } else if (mode === 2) {
    els.freebeatI2vInputs.style.display = 'block';
    els.freebeatV2vInputs.style.display = 'none';
  } else if (mode === 3) {
    els.freebeatI2vInputs.style.display = 'none';
    els.freebeatV2vInputs.style.display = 'block';
  }
  
  updateModelOptions();
}

// I2V Image Handlers
function handleVStartImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  state.vStartFile = file;
  state.vStartImage = '';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    els.vStartPreviewImg.src = e.target.result;
    els.vStartPreviewContainer.style.display = 'flex';
    els.btnUploadVStart.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Awal';
    showToast('Gambar awal berhasil dimuat secara lokal!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleUseStoryboardStart(imgNum = 1) {
  const targetImage = imgNum === 2 ? state.combinedImage2 : state.combinedImage;
  if (!targetImage) {
    showToast(`Gambar storyboard ${imgNum} kosong! Silakan generate storyboard terlebih dahulu.`, 'error');
    return;
  }
  state.vStartFile = null;
  state.vStartImage = targetImage;
  
  els.vStartPreviewImg.src = targetImage;
  els.vStartPreviewContainer.style.display = 'flex';
  els.btnUploadVStart.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Awal';
  showToast(`Menggunakan Gambar ${imgNum} Storyboard sebagai Gambar Awal!`, 'success');
}

function handleVEndImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  state.vEndFile = file;
  state.vEndImage = '';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    els.vEndPreviewImg.src = e.target.result;
    els.vEndPreviewContainer.style.display = 'flex';
    els.btnUploadVEnd.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Akhir';
    showToast('Gambar akhir berhasil dimuat secara lokal!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleUseStoryboardEnd(imgNum = 2) {
  const actualNum = (imgNum === 2 && !state.combinedImage2) ? 1 : imgNum;
  const targetImage = actualNum === 2 ? state.combinedImage2 : state.combinedImage;
  if (!targetImage) {
    showToast('Gambar storyboard kosong! Silakan generate storyboard terlebih dahulu.', 'error');
    return;
  }
  state.vEndFile = null;
  state.vEndImage = targetImage;
  
  els.vEndPreviewImg.src = targetImage;
  els.vEndPreviewContainer.style.display = 'flex';
  els.btnUploadVEnd.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Akhir';
  
  showToast(`Menggunakan Gambar ${actualNum} Storyboard sebagai Gambar Akhir!`, 'success');
}

// V2V Video Handler
function handleVRefVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  state.vRefFile = file;
  state.vRefVideo = '';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    els.vRefPreviewVideo.src = e.target.result;
    els.vRefPreviewContainer.style.display = 'flex';
    els.btnUploadVRef.innerHTML = '<i class="fa-solid fa-video"></i> Ganti Video Referensi';
    showToast('Video referensi berhasil dimuat secara lokal!', 'success');
  };
  reader.readAsDataURL(file);
}

// Upload file to Freebeat's S3 bucket using presigned URLs
async function uploadFileToFreebeat(file, keyPrefix = 'agent/character') {
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (!activeKey) {
    throw new Error('API Key Freebeat tidak ditemukan. Silakan pilih API key terlebih dahulu.');
  }

  const ext = file.name.split('.').pop() || 'png';
  const fileName = file.name;
  const key = `${keyPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bucketName = "freebeat-static";

  // 1. Get Presigned URL
  const response = await fetch('/proxy', {
    method: 'POST',
    headers: {
      'x-target-url': 'https://api.freebeatfit.com/v1/mcp/agent/genUploadSignUrl',
      'Authorization': activeKey.id,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reqList: [{ key, fileName, bucketName }] })
  });

  if (!response.ok) {
    throw new Error(`Gagal membuat upload URL. HTTP status: ${response.status}`);
  }

  const text = await response.text();
  const data = JSON.parse(sanitizeJsonString(text));
  if (data.code !== 0 || !data.data || !data.data.list || data.data.list.length === 0) {
    throw new Error(data.msg || 'Gagal membuat upload URL dari Freebeat API.');
  }

  const { signURL, finalStaticUrl } = data.data.list[0];

  // 2. Upload file to presigned URL
  const uploadHeaders = {
    'Content-Type': file.type
  };
  
  const parsedUrl = new URL(signURL);
  const signedHeaders = parsedUrl.searchParams.get("X-Amz-SignedHeaders")?.split(";").map(h => h.trim().toLowerCase()) ?? [];
  if (signedHeaders.includes("x-amz-acl")) {
    uploadHeaders["x-amz-acl"] = "public-read";
  }

  const uploadRes = await fetch(signURL, {
    method: 'PUT',
    headers: uploadHeaders,
    body: file
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload file ke S3 gagal. HTTP status: ${uploadRes.status}`);
  }

  return finalStaticUrl;
}

// Convert Base64 dataURL to Blob for S3 upload
function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

// ----------------------------------------------------
// 6. Freebeat Video Studio Operations & History
// ----------------------------------------------------

// Filter models select options based on current video mode
function updateModelOptions() {
  const currentMode = state.videoGenerationType || 1;
  const currentSelectedModel = els.freebeatModelSelect.value;
  
  els.freebeatModelSelect.innerHTML = '';
  
  const displayNames = {
    '94': 'Pixverse V6 (Premium - 5-15 Detik)',
    '103': 'Pixverse C1 (Standard - 1-15 Detik)',
    '104': 'Wan V2.7 (Universal - 2-15 Detik)',
    '102': 'SeedDance 2.0 (Dynamic - 4-15 Detik)',
    '101': 'SeedDance 2.0 Fast (Fast - 4-15 Detik)',
    '112': 'Kling V3 4K (Cinematic - 3-15 Detik)',
    '56': 'Sora 2 Pro (Ultra Quality - 4/8/12 Detik)',
    '111': 'HappyHorse (Fun/Creative - 3-15 Detik)'
  };
  
  let firstCompatibleModel = null;
  let keepSelected = false;
  
  Object.entries(modelConfigs).forEach(([id, config]) => {
    if (config.supportedModes && config.supportedModes.includes(currentMode)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = displayNames[id] || config.name;
      if (id === currentSelectedModel) {
        opt.selected = true;
        keepSelected = true;
      }
      els.freebeatModelSelect.appendChild(opt);
      if (!firstCompatibleModel) {
        firstCompatibleModel = id;
      }
    }
  });
  
  if (!keepSelected && firstCompatibleModel) {
    els.freebeatModelSelect.value = firstCompatibleModel;
  }
  
  updateDurationOptionsAndCost();
  handleVideoModelChange(els.freebeatModelSelect.value);
}

// Dynamic Duration, Resolution and Credit Cost Auto-detection
function updateDurationOptionsAndCost() {
  const modelId = els.freebeatModelSelect.value;
  const config = modelConfigs[modelId];
  if (!config) return;
  
  // 1. Populate Durations
  const currentDuration = parseInt(els.freebeatDuration.value, 10) || 5;
  els.freebeatDuration.innerHTML = '';
  
  let durations = [];
  if (config.allowedDurations) {
    durations = config.allowedDurations;
  } else {
    for (let d = config.minDuration; d <= config.maxDuration; d++) {
      durations.push(d);
    }
  }
  
  durations.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = `${d} Detik`;
    if (d === currentDuration) {
      opt.selected = true;
    }
    els.freebeatDuration.appendChild(opt);
  });
  
  const defaultDuration = config.defaultDuration || config.minDuration || 5;
  if (!durations.includes(currentDuration)) {
    els.freebeatDuration.value = defaultDuration;
  }
  
  // 2. Populate Resolutions
  const currentResolution = els.freebeatResolution.value || '720p';
  els.freebeatResolution.innerHTML = '';
  
  const resolutions = config.allowedResolutions || ['720p', '1080p'];
  resolutions.forEach(res => {
    const opt = document.createElement('option');
    opt.value = res;
    opt.textContent = res === '4k' ? '4K (Ultra HD)' : res;
    if (res === currentResolution) {
      opt.selected = true;
    }
    els.freebeatResolution.appendChild(opt);
  });
  
  const defaultResolution = config.defaultResolution || resolutions[0] || '720p';
  if (!resolutions.includes(currentResolution)) {
    els.freebeatResolution.value = defaultResolution;
  }
  
  updateEstimatedCostUI();
}

function updateEstimatedCostUI() {
  const modelId = els.freebeatModelSelect.value;
  const duration = parseInt(els.freebeatDuration.value, 10) || 5;
  const resolution = els.freebeatResolution.value || '720p';
  const cost = getEstimatedCreditCost(modelId, duration, resolution);
  
  const costWrapper = document.getElementById('freebeat-cost-info-wrapper');
  const costDisplay = document.getElementById('freebeat-estimated-cost');
  
  if (cost === null || cost === undefined) {
    if (costWrapper) costWrapper.style.display = 'none';
  } else {
    if (costWrapper) costWrapper.style.display = 'flex';
    if (costDisplay) costDisplay.textContent = `${cost} Credits`;
  }
}

function getEstimatedCreditCost(modelId, duration, resolution) {
  const config = modelConfigs[modelId];
  if (config && typeof config.getCost === 'function') {
    return config.getCost(parseInt(duration, 10) || 5, resolution || '720p');
  }
  return null;
}

function getModelDisplayName(modelId) {
  const config = modelConfigs[modelId];
  return config ? config.name : `Model ${modelId}`;
}

// Load history logs from Database
async function loadFreebeatHistory() {
  try {
    const response = await fetch('/api/history');
    if (response.ok) {
      state.freebeatHistory = await response.json();
      
      // Resume polling for any processing tasks in history
      const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
      if (activeKey) {
        state.freebeatHistory.forEach(item => {
          if (item.status === 'processing') {
            if (item.type === 'image') {
              startFreebeatImagePolling(item.id, activeKey);
            } else {
              const cost = getEstimatedCreditCost(item.modelId, item.duration, item.resolution);
              startFreebeatVideoPolling(item.id, activeKey, cost);
            }
          }
        });
      }
      
      renderFreebeatHistory();
    }
  } catch (err) {
    console.error('Error loading history:', err);
  }
}

function renderFreebeatHistory() {
  if (!els.historyGridContainer) return;
  els.historyGridContainer.innerHTML = '';
  
  if (state.freebeatHistory.length === 0) {
    els.historyGridContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); font-size: 14px; padding: 40px 0;"><i class="fa-solid fa-folder-open" style="font-size: 48px; margin-bottom: 12px; display: block;"></i> Belum ada riwayat pengerjaan video.</div>';
    return;
  }
  
  // Sort history: newest first
  const sorted = [...state.freebeatHistory].sort((a, b) => b.timestamp - a.timestamp);
  
  sorted.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    
    // Status Badge
    let statusBadge = '';
    if (item.status === 'success') {
      statusBadge = '<span style="color: var(--accent-green); background: rgba(16,185,129,0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">SUCCESS</span>';
    } else if (item.status === 'failed') {
      statusBadge = '<span style="color: var(--accent-red); background: rgba(239,68,68,0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;">FAILED</span>';
    } else {
      statusBadge = '<span style="color: var(--accent-gold); background: rgba(251,191,36,0.1); padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 4px;"></i>PROCESSING</span>';
    }
    
    // Model display name detection for both video and image models
    const displayNamesImage = {
      '80': 'Nano Banana 2',
      '64': 'Nano Banana Pro',
      '99': 'Wan V2.7 Image',
      '100': 'Wan V2.7 Pro Image',
      '108': 'GPT-Image 2'
    };
    const modelName = item.type === 'image' ? (displayNamesImage[item.modelId] || `Image Model ${item.modelId}`) : getModelDisplayName(item.modelId);
    
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Construct metadata tags
    let tagsHtml = '';
    tagsHtml += `<span class="meta-tag" style="text-transform: uppercase;"><i class="fa-solid ${item.type === 'image' ? 'fa-image' : 'fa-film'}" style="margin-right: 4px;"></i>${item.type || 'video'}</span>`;
    tagsHtml += `<span class="meta-tag">${modelName}</span>`;
    
    if (item.type !== 'image') {
      tagsHtml += `<span class="meta-tag">${item.duration} Detik</span>`;
      tagsHtml += `<span class="meta-tag">${item.resolution}</span>`;
      tagsHtml += `<span class="meta-tag">${item.aspectRatio}</span>`;
      if (item.generateAudio) {
        tagsHtml += `<span class="meta-tag"><i class="fa-solid fa-volume-high"></i> Audio</span>`;
      }
    } else {
      tagsHtml += `<span class="meta-tag">${item.resolution}</span>`;
    }
    
    // Add Credits tag
    tagsHtml += `<span class="meta-tag" style="border-color: var(--accent-gold); color: var(--accent-gold); font-weight: 600;"><i class="fa-solid fa-coins" style="margin-right: 4px;"></i>${item.credits || 0} Credits</span>`;

    let displayPrompt = item.prompt;
    if (item.type === 'image' && item.prompt.includes('\n\n=== VIDEO PROMPT ===\n\n')) {
      displayPrompt = item.prompt.split('\n\n=== VIDEO PROMPT ===\n\n')[0];
    }

    card.innerHTML = `
      <div class="history-card-header">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span class="history-card-title">${item.recipeTitle}</span>
          <span class="history-card-time">${dateStr}</span>
        </div>
        <div>${statusBadge}</div>
      </div>
      <div class="history-card-meta">
        ${tagsHtml}
      </div>
      <div class="history-card-prompt" title="${displayPrompt}">${displayPrompt}</div>
      
      ${item.status === 'success' ? (
        item.type === 'image' ? `
          <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; position: relative;">
            <img src="${item.videoUrl}" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
        ` : `
          <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; position: relative;">
            <video src="${item.videoUrl}" style="width: 100%; height: 100%; object-fit: contain;" controls preload="none"></video>
          </div>
        `
      ) : ''}
      
      ${item.status === 'failed' ? `
        <div style="padding: 10px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); color: var(--accent-red); font-size: 11px;">
          <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> ${item.errorMsg || 'Gagal generate ' + (item.type === 'image' ? 'gambar' : 'video') + '.'}
        </div>
      ` : ''}

      <div class="history-card-footer">
        <button class="btn btn-secondary btn-regen" style="margin-top: 0; padding: 6px 12px; font-size: 11px; width: auto;" type="button">
          <i class="fa-solid fa-rotate-right"></i> Gunakan Prompt
        </button>
        
        <div style="display: flex; gap: 8px;">
          ${item.status === 'success' ? `
            <button class="btn btn-secondary btn-download-hist" style="margin-top: 0; padding: 6px 12px; font-size: 11px; width: auto;" type="button">
              <i class="fa-solid fa-download"></i> Unduh
            </button>
            ${item.type === 'image' ? `
              <button class="btn btn-primary btn-use-img" style="margin-top: 0; padding: 6px 12px; font-size: 11px; width: auto;" type="button">
                <i class="fa-solid fa-clapperboard"></i> Pakai Gambar ini
              </button>
            ` : `
              <button class="btn btn-primary btn-play" style="margin-top: 0; padding: 6px 12px; font-size: 11px; width: auto;" type="button">
                <i class="fa-solid fa-play"></i> Putar di Player Utama
              </button>
            `}
          ` : ''}
        </div>
      </div>
    `;
    
    // Wire listeners
    card.querySelector('.btn-regen').addEventListener('click', () => {
      handleRegenerateFromHistory(item);
    });
    
    if (item.status === 'success') {
      card.querySelector('.btn-download-hist').addEventListener('click', () => {
        const ext = item.type === 'image' ? 'png' : 'mp4';
        const safeTitle = (item.recipeTitle || 'file').toLowerCase().replace(/[^a-z0-9]+/g, '_');
        downloadFileFromUrl(item.videoUrl, `${item.type}_${safeTitle}.${ext}`);
      });
      
      if (item.type === 'image') {
        card.querySelector('.btn-use-img').addEventListener('click', () => {
          state.combinedImage = item.videoUrl;
          els.combinedStoryboardImage.src = item.videoUrl;
          els.combinedStoryboardImage.style.display = 'block';
          els.combinedImagePlaceholder.style.display = 'none';
          els.storyboardImagesContainer.style.display = 'block';
          els.btnDownloadCombined.disabled = false;
          els.btnExportStoryboard.disabled = false;
          showToast('Gambar dimuat ke Editor Storyboard!', 'success');
          switchTab('tab-generator');
        });
      } else {
        card.querySelector('.btn-play').addEventListener('click', () => {
          showFreebeatVideoPlayer(item.recipeTitle, item.videoUrl);
          switchTab('tab-generator');
        });
      }
    }
    
    els.historyGridContainer.appendChild(card);
  });
}

function showFreebeatVideoPlayer(recipeTitle, videoUrl) {
  els.freebeatVideoStatusContainer.style.display = 'block';
  els.freebeatVideoLoader.style.display = 'none';
  els.freebeatVideoErrorWrapper.style.display = 'none';
  els.freebeatVideoPlayerWrapper.style.display = 'flex';
  
  els.freebeatGeneratedVideo.src = videoUrl;
  
  els.freebeatVideoStatusContainer.scrollIntoView({ behavior: 'smooth' });
  showToast(`Memutar video: ${recipeTitle}`, 'info');
}

function handleRegenerateFromHistory(item) {
  // 1. Restore the Recipe/Concept Title
  state.storyboardTitle = item.recipeTitle || 'Recipe Storyboard';
  if (els.storyboardDisplayTitle) {
    els.storyboardDisplayTitle.textContent = state.storyboardTitle;
  }
  if (els.recipeConcept) {
    els.recipeConcept.value = state.storyboardTitle;
  }

  // 2. Hide Empty State and Show Preview Wrapper / Clear Button
  if (els.storyboardEmptyState) {
    els.storyboardEmptyState.style.display = 'none';
  }
  if (els.storyboardPreviewWrapper) {
    els.storyboardPreviewWrapper.style.display = 'flex';
  }
  if (els.btnClearStoryboard) {
    els.btnClearStoryboard.style.display = 'flex';
  }

  if (item.type === 'image') {
    // 3. Switch Storyboard Mode to 'grid'
    if (els.storyboardModeSelect) {
      els.storyboardModeSelect.value = 'grid';
      state.storyboardMode = 'grid';
      handleStoryboardModeChange();
    }

    // 4. Restore Image Generator Settings
    els.imageModelSelect.value = item.modelId || '108';
    state.imageModel = item.modelId || '108';
    els.imageSizeSelect.value = item.resolution || '1024x1024';
    state.imageSize = item.resolution || '1024x1024';
    
    let gridPrompt = item.prompt;
    let videoPrompt = '';
    if (item.prompt.includes('\n\n=== VIDEO PROMPT ===\n\n')) {
      const parts = item.prompt.split('\n\n=== VIDEO PROMPT ===\n\n');
      gridPrompt = parts[0];
      videoPrompt = parts[1];
    }
    els.masterGridPrompt.value = gridPrompt;
    els.masterSeedancePrompt.value = videoPrompt;
    state.masterSeedancePrompt = videoPrompt;
    const modelIdVal = els.freebeatModelSelect.value;
    if (modelIdVal) {
      state.videoPrompts[modelIdVal] = videoPrompt;
    }
    
    // 5. Restore the generated image in viewport if success
    if (item.status === 'success' && item.videoUrl) {
      state.combinedImage = item.videoUrl;
      els.combinedStoryboardImage.src = item.videoUrl;
      els.combinedStoryboardImage.style.display = 'block';
      els.combinedImagePlaceholder.style.display = 'none';
      els.combinedImageLoader.style.display = 'none';
      els.storyboardImagesContainer.style.display = 'block';
      els.btnDownloadCombined.disabled = false;
      els.btnExportStoryboard.disabled = false;
    } else {
      // Clear viewport if not successful
      state.combinedImage = '';
      els.combinedStoryboardImage.src = '';
      els.combinedStoryboardImage.style.display = 'none';
      els.combinedImagePlaceholder.style.display = 'flex';
      els.combinedImageLoader.style.display = 'none';
      els.storyboardImagesContainer.style.display = 'none';
      els.btnDownloadCombined.disabled = true;
      els.btnExportStoryboard.disabled = true;
    }

    showToast(`Mengekspor setelan dari riwayat gambar resep "${item.recipeTitle}"...`, 'info');
    switchTab('tab-generator');
    return;
  }
  
  // For Video:
  const modelId = item.modelId;
  const config = modelConfigs[modelId];
  if (config && config.supportedModes) {
    if (!config.supportedModes.includes(state.videoGenerationType)) {
      const targetMode = config.supportedModes[0] || 1;
      els.freebeatGenerationType.value = targetMode;
      handleSelectVideoMode();
    }
  }
  
  els.freebeatModelSelect.value = item.modelId;
  updateDurationOptionsAndCost();
  
  els.freebeatDuration.value = item.duration;
  els.freebeatAspectRatio.value = item.aspectRatio;
  els.freebeatResolution.value = item.resolution;
  els.freebeatGenerateAudio.checked = item.generateAudio;
  els.masterSeedancePrompt.value = item.prompt;
  
  // Restore the generated video in player if success
  if (item.status === 'success' && item.videoUrl) {
    showFreebeatVideoPlayer(item.recipeTitle, item.videoUrl);
  } else {
    // Clear video player if not successful
    els.freebeatVideoStatusContainer.style.display = 'none';
    els.freebeatGeneratedVideo.src = '';
  }

  showToast(`Mengekspor setelan dari riwayat resep "${item.recipeTitle}"...`, 'info');
  switchTab('tab-generator');
}

async function clearFreebeatHistory() {
  if (!confirm('Apakah Anda yakin ingin menghapus seluruh riwayat generate video? Tindakan ini tidak dapat dibatalkan.')) {
    return;
  }
  
  try {
    const response = await fetch('/api/history', { method: 'DELETE' });
    const data = await response.json();
    if (response.ok && data.success) {
      // Clear all local polling intervals
      Object.keys(state.freebeatVideoIntervals).forEach(id => {
        clearInterval(state.freebeatVideoIntervals[id]);
      });
      state.freebeatVideoIntervals = {};
      
      showToast('Seluruh riwayat berhasil dihapus.', 'success');
      loadFreebeatHistory();
    } else {
      showToast(data.error || 'Gagal menghapus riwayat.', 'error');
    }
  } catch (error) {
    console.error('Clear history error:', error);
    showToast('Gagal terhubung ke server.', 'error');
  }
}

// Keep storyboard grid crop instructions and negative instructions in the prompt for all models to prevent the grid reference from appearing in the generated videos
function cleanVideoPromptForFreebeat(promptText) {
  return (promptText || '').trim();
}

async function handleGenerateFreebeatVideo() {
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (!activeKey) {
    showToast('Silakan pilih atau tambahkan API Key Freebeat terlebih dahulu!', 'error');
    return;
  }
  
  const prompt = els.masterSeedancePrompt.value.trim();
  if (!prompt) {
    showToast('Teks prompt Seedance video masih kosong!', 'error');
    return;
  }
  
  const modelId = els.freebeatModelSelect.value;
  const duration = parseInt(els.freebeatDuration.value, 10) || 5;
  const resolution = els.freebeatResolution.value || '720p';
  const aspect_ratio = els.freebeatAspectRatio.value || '9:16';
  const generate_audio = els.freebeatGenerateAudio.checked;
  const audioValue = generate_audio ? 1 : 0;
  const genType = state.videoGenerationType;
  
  const estimatedCost = getEstimatedCreditCost(modelId, duration, resolution);
  if (estimatedCost !== null && activeKey.balance !== null && activeKey.balance !== undefined && activeKey.balance < estimatedCost) {
    showToast(`Balance tidak mencukupi! Estimasi biaya: ${estimatedCost} credits, Balance Anda: ${activeKey.balance} credits.`, 'error');
    return;
  }
  
  // Show progress loader
  els.freebeatVideoStatusContainer.style.display = 'block';
  els.freebeatVideoLoader.style.display = 'flex';
  els.freebeatVideoPlayerWrapper.style.display = 'none';
  els.freebeatVideoErrorWrapper.style.display = 'none';
  els.btnGenerateFreebeatVideo.disabled = true;
  els.btnGenerateFreebeatVideo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungi Video Studio...';
  
  els.freebeatVideoLoaderText.textContent = 'Mempersiapkan render video...';

  try {
    const itemData = {
      modelId: String(modelId),
      generationType: genType,
      prompt: cleanVideoPromptForFreebeat(prompt).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
      duration: duration,
      resolution: resolution,
      aspectRatio: aspect_ratio,
      audio: audioValue,
      generateAudio: audioValue,
      watermark: false,
      watermarkValue: 0
    };

    // Handle reference assets uploads and payload parameters based on video mode
    if (genType === 2) {
      // Image-to-Video
      const startRef = state.vStartFile || state.vStartImage;
      const endRef = state.vEndFile || state.vEndImage;
      if (!startRef && !endRef) {
        throw new Error('Minimal satu gambar referensi (Gambar Awal atau Gambar Akhir) wajib ditentukan untuk mode Image-to-Video.');
      }
      if (startRef && startRef === state.combinedImage) {
        showToast('Peringatan: Anda menggunakan Gambar Storyboard Gabungan (Grid) sebagai Gambar Awal. Video kemungkinan akan menampilkan grid. Gunakan mode Text-to-Video (Tanpa Gambar Awal) atau potong per frame untuk hasil bersih.', 'warning');
      }

      let startUrl = '';
      let endUrl = '';

      if (startRef && endRef) {
        // Both images provided
        if (state.vStartFile) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Awal ke Freebeat...';
          startUrl = await uploadFileToFreebeat(state.vStartFile, 'agent/character');
        } else if (state.vStartImage.startsWith('data:image/')) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Awal ke Freebeat...';
          const blob = dataURLtoBlob(state.vStartImage);
          const file = new File([blob], 'start_frame.png', { type: blob.type });
          startUrl = await uploadFileToFreebeat(file, 'agent/character');
        } else {
          startUrl = state.vStartImage;
        }

        if (state.vEndFile) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Akhir ke Freebeat...';
          endUrl = await uploadFileToFreebeat(state.vEndFile, 'agent/character');
        } else if (state.vEndImage.startsWith('data:image/')) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Akhir ke Freebeat...';
          const blob = dataURLtoBlob(state.vEndImage);
          const file = new File([blob], 'end_frame.png', { type: blob.type });
          endUrl = await uploadFileToFreebeat(file, 'agent/character');
        } else {
          endUrl = state.vEndImage;
        }
      } else if (startRef) {
        // Only start image provided (duplicate to end image)
        if (state.vStartFile) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Awal ke Freebeat...';
          startUrl = await uploadFileToFreebeat(state.vStartFile, 'agent/character');
        } else if (state.vStartImage.startsWith('data:image/')) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Awal ke Freebeat...';
          const blob = dataURLtoBlob(state.vStartImage);
          const file = new File([blob], 'start_frame.png', { type: blob.type });
          startUrl = await uploadFileToFreebeat(file, 'agent/character');
        } else {
          startUrl = state.vStartImage;
        }
        endUrl = startUrl;
      } else {
        // Only end image provided (duplicate to start image)
        if (state.vEndFile) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Akhir ke Freebeat...';
          endUrl = await uploadFileToFreebeat(state.vEndFile, 'agent/character');
        } else if (state.vEndImage.startsWith('data:image/')) {
          els.freebeatVideoLoaderText.textContent = 'Mengunggah Gambar Akhir ke Freebeat...';
          const blob = dataURLtoBlob(state.vEndImage);
          const file = new File([blob], 'end_frame.png', { type: blob.type });
          endUrl = await uploadFileToFreebeat(file, 'agent/character');
        } else {
          endUrl = state.vEndImage;
        }
        startUrl = endUrl;
      }

      itemData.images = [startUrl, endUrl];
    } else if (genType === 3) {
      // Video-to-Video
      let videoUrl = '';
      if (state.vRefFile) {
        els.freebeatVideoLoaderText.textContent = 'Mengunggah Video Referensi ke Freebeat...';
        videoUrl = await uploadFileToFreebeat(state.vRefFile, 'agent/video');
      } else {
        videoUrl = els.freebeatVRefUrl.value.trim();
      }

      if (!videoUrl) {
        throw new Error('Video referensi wajib diunggah atau berupa URL untuk mode Video-to-Video.');
      }

      itemData.video = videoUrl;
      itemData.videos = [videoUrl];
    }

    els.freebeatVideoLoaderText.textContent = 'Memulai antrean render Video Studio...';

    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/createVideoBatch',
        'Authorization': activeKey.id, // Pass key ID, resolved transparently by the server!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: [itemData] })
    });
    
    if (!response.ok) {
      throw new Error(`Koneksi API gagal. HTTP status: ${response.status}`);
    }
    
    const text = await response.text();
    const data = JSON.parse(sanitizeJsonString(text));
    if (data.code !== 0) {
      throw new Error(data.msg || 'Terjadi kesalahan dari API Freebeat');
    }
    
    const batchData = data.data;
    const batchId = batchData.batchId;
    const item = batchData.items[0];
    
    if (item && !item.accepted) {
      throw new Error(item.message || 'Render video ditolak oleh server Freebeat.');
    }
    
    state.latestVideoBatchId = batchId;
    els.freebeatVideoLoaderText.textContent = 'Render video diterima! Menunggu antrean rendering...';
    showToast('Render video berhasil dibuat! Memulai polling status...', 'success');
    
    // Create new history item in DB
    const historyItem = {
      id: batchId,
      recipeTitle: state.storyboardTitle,
      prompt: prompt,
      modelId: modelId,
      duration: duration,
      resolution: resolution,
      aspectRatio: aspect_ratio,
      generateAudio: generate_audio,
      timestamp: Date.now(),
      status: 'processing',
      videoUrl: '',
      errorMsg: ''
    };
    
    const saveResponse = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyItem)
    });
    
    if (saveResponse.ok) {
      await loadFreebeatHistory();
    }
    
    // Re-enable generate button immediately so user can queue another video
    els.btnGenerateFreebeatVideo.disabled = false;
    els.btnGenerateFreebeatVideo.innerHTML = '<i class="fa-solid fa-video"></i> Mulai Generate Video';
    
    // Start Polling
    startFreebeatVideoPolling(batchId, activeKey, estimatedCost);
    
  } catch (err) {
    console.error('Error generating freebeat video:', err);
    showFreebeatVideoError(err.message);
  }
}

function startFreebeatVideoPolling(batchId, activeKey, estimatedCost) {
  // Clear any existing polling for this specific batch ID
  if (state.freebeatVideoIntervals[batchId]) {
    clearInterval(state.freebeatVideoIntervals[batchId]);
  }
  
  // Poll every 8 seconds
  state.freebeatVideoIntervals[batchId] = setInterval(async () => {
    try {
      const response = await fetch('/proxy', {
        method: 'POST',
        headers: {
          'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/queryBatch',
          'Authorization': activeKey.id, // Using Key ID resolved by server
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchId: batchId })
      });
      
      if (!response.ok) return; // Silent retry
      
      const data = await response.json();
      if (data.code !== 0) return; // Silent retry
      
      const batchData = data.data;
      const item = batchData.items[0];
      if (!item) return;
      
      const status = String(item.status).toLowerCase();
      
      // Check status matching
      const isSuccess = (status === 'success' || status === 'completed' || status === 'finished');
      const isFailed = (status === 'failed' || status === 'rejected' || status === 'error');
      
      if (isSuccess || isFailed) {
        clearInterval(state.freebeatVideoIntervals[batchId]);
        delete state.freebeatVideoIntervals[batchId];
        
        let newStatus = isSuccess ? 'success' : 'failed';
        let videoUrl = isSuccess ? (item.videoUrl || item.imageUrl || '') : '';
        let errorMsg = isFailed ? (item.errorMessage || 'Proses render video di server Freebeat gagal.') : '';
        
        // Update history item in Database
        const historyItem = state.freebeatHistory.find(h => h.id === batchId);
        const usedCredits = isSuccess ? (item.usedCredits !== undefined ? item.usedCredits : (item.credits !== undefined ? item.credits : (estimatedCost || 0))) : 0;
        if (historyItem) {
          historyItem.status = newStatus;
          historyItem.videoUrl = videoUrl;
          historyItem.errorMsg = errorMsg;
          historyItem.credits = usedCredits;
          
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyItem)
          });
        }
        
        if (isSuccess) {
          // Track usage and save to DB
          const newUsed = (activeKey.used_credits || 0) + usedCredits;
          let newBalance = activeKey.balance;
          if (activeKey.balance !== null && activeKey.balance !== undefined) {
            newBalance = Math.max(0, activeKey.balance - usedCredits);
          }
          
          await fetch('/api/freebeat-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeKey.id,
              label: activeKey.label,
              key: activeKey.key,
              usedCredits: newUsed,
              balance: newBalance
            })
          });
          
          await loadFreebeatKeys();
          await loadFreebeatHistory();
          await refreshSessionUserCredits();
          
          if (batchId === state.latestVideoBatchId) {
            showFreebeatVideoSuccess(videoUrl);
          } else {
            showToast('Video di latar belakang berhasil dibuat!', 'success');
          }
        } else {
          await loadFreebeatHistory();
          if (batchId === state.latestVideoBatchId) {
            showFreebeatVideoError(errorMsg);
          } else {
            showToast(`Video di latar belakang gagal: ${errorMsg}`, 'error');
          }
        }
      } else {
        // Update loading status text only if this is the latest video
        if (batchId === state.latestVideoBatchId) {
          els.freebeatVideoLoaderText.textContent = `Rendering video... Status: ${status.toUpperCase()}`;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 8000);
}

function showFreebeatVideoSuccess(videoUrl) {
  els.freebeatVideoLoader.style.display = 'none';
  els.freebeatVideoPlayerWrapper.style.display = 'flex';
  els.freebeatVideoErrorWrapper.style.display = 'none';
  
  els.freebeatGeneratedVideo.src = videoUrl;
  
  els.btnGenerateFreebeatVideo.disabled = false;
  els.btnGenerateFreebeatVideo.innerHTML = '<i class="fa-solid fa-video"></i> Mulai Generate Video';
  showToast('Video berhasil dibuat!', 'success');
}

function showFreebeatVideoError(errorMsg) {
  els.freebeatVideoLoader.style.display = 'none';
  els.freebeatVideoPlayerWrapper.style.display = 'none';
  els.freebeatVideoErrorWrapper.style.display = 'block';
  
  els.freebeatVideoErrorMsg.textContent = errorMsg || 'Kesalahan tidak diketahui.';
  
  els.btnGenerateFreebeatVideo.disabled = false;
  els.btnGenerateFreebeatVideo.innerHTML = '<i class="fa-solid fa-video"></i> Mulai Generate Video';
  showToast('Proses render video gagal.', 'error');
}

function downloadFreebeatVideo() {
  const url = els.freebeatGeneratedVideo.src;
  if (!url) return;
  const safeTitle = (state.storyboardTitle || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  downloadFileFromUrl(url, `video_${safeTitle}.mp4`);
}

async function downloadFileFromUrl(url, filename) {
  if (!url) return;
  showToast('Mempersiapkan unduhan file...', 'info');
  try {
    let response;
    try {
      response = await fetch(url);
    } catch (corsErr) {
      // Fallback to proxy
      response = await fetch('/proxy', {
        headers: {
          'x-target-url': url
        }
      });
    }
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    showToast('File berhasil diunduh!', 'success');
  } catch (error) {
    console.error('Download failed:', error);
    window.open(url, '_blank');
    showToast('Gagal download otomatis, membuka di tab baru.', 'warning');
  }
}

function handleVideoModelChange(modelId) {
  if (!modelId) return;
  
  // Update badge in prompt editor
  if (els.videoPromptModelBadge) {
    const displayName = getModelDisplayName(modelId);
    els.videoPromptModelBadge.textContent = displayName;
  }
  
  // Load prompt for this model from state
  if (state.videoPrompts[modelId] !== undefined) {
    els.masterSeedancePrompt.value = state.videoPrompts[modelId];
    state.masterSeedancePrompt = state.videoPrompts[modelId];
  } else {
    // If not defined, copy from the current textarea value to initialize it
    state.videoPrompts[modelId] = els.masterSeedancePrompt.value;
  }
}

function handleStoryboardModeChange() {
  const mode = els.storyboardModeSelect.value;
  state.storyboardMode = mode;
  
  if (mode === 'grid') {
    els.gridModeContent.style.display = 'flex';
    els.perFrameModeContent.style.display = 'none';
    
    // Update display title and meta
    els.storyboardDisplayTitle.textContent = state.storyboardTitle || 'Indomie Nyemek Viral';
    els.storyboardDisplayMeta.textContent = `Infografis Gabungan • ${state.sceneCount} Langkah`;
  } else {
    els.gridModeContent.style.display = 'none';
    els.perFrameModeContent.style.display = 'flex';
    
    // If state.scenes is empty but we have an active template, load the scenes for that template
    if ((!state.scenes || state.scenes.length === 0) && els.templateSelect.value) {
      state.scenes = getScenesForTemplate(els.templateSelect.value);
    }
    
    // Render per frame scene cards from state.scenes
    renderPerFrameScenes();
    if (state.scenes && state.scenes.length > 0) {
      els.storyboardDisplayMeta.textContent = `Per Frame • ${state.scenes.length} Langkah`;
    }
  }
}

// Helper to pre-populate storyboard template scenes for per-frame mode
function getScenesForTemplate(templateId) {
  const tpl = templates[templateId];
  if (!tpl) return [];
  
  return tpl.scenes.map((scene, idx) => ({
    scene_number: idx + 1,
    title: scene.title || `Scene ${idx + 1}`,
    image_prompt: scene.image_prompt || '',
    video_prompt: scene.video_prompt || '',
    imageUrl: '',
    isGenerating: false,
    batchId: ''
  }));
}

// Render individual scene cards (Per-Frame Storyboard)
function renderPerFrameScenes() {
  if (!els.perFrameScenesList) return;
  els.perFrameScenesList.innerHTML = '';
  
  if (!state.scenes || state.scenes.length === 0) {
    els.perFrameScenesList.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 20px 0;">Belum ada scene. Tekan "Buat Storyboard AI" untuk menjana scene.</div>';
    return;
  }
  
  state.scenes.forEach(scene => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    
    // Status and spinner on scene image generation
    let imgHtml = '';
    if (scene.imageUrl) {
      imgHtml = `<img class="scene-card-img" src="${scene.imageUrl}" alt="${scene.title}">`;
    } else if (scene.isGenerating) {
      imgHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
          <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
          <span style="font-size: 11px; color: var(--text-muted);">Rendering...</span>
        </div>
      `;
    } else {
      imgHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted);">
          <i class="fa-solid fa-image" style="font-size: 32px;"></i>
          <span style="font-size: 11px;">Belum ada gambar</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="scene-card-header">
        <span class="scene-card-title">SCENE ${scene.scene_number}: ${scene.title}</span>
        <span class="scene-card-badge">Scene Frame</span>
      </div>
      <div class="scene-card-body">
        <div style="display: flex; flex-direction: column;">
          <div class="scene-card-image-box">
            ${imgHtml}
          </div>
          <div class="scene-card-image-actions">
            <button class="btn btn-secondary btn-scene-gen" style="margin-top: 0; padding: 6px 12px; font-size: 11px;" type="button" ${scene.isGenerating ? 'disabled' : ''}>
              <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Gambar
            </button>
            <button class="btn btn-secondary btn-scene-upload" style="margin-top: 0; padding: 6px 12px; font-size: 11px;" type="button">
              <i class="fa-solid fa-upload"></i> Upload PNG
            </button>
            <button class="btn btn-secondary btn-scene-download" style="margin-top: 0; padding: 6px 12px; font-size: 11px;" type="button" ${!scene.imageUrl ? 'disabled' : ''}>
              <i class="fa-solid fa-download"></i> Unduh Gambar
            </button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <button class="btn btn-secondary btn-scene-use-start" style="margin-top: 0; padding: 6px 4px; font-size: 10px;" type="button" ${!scene.imageUrl ? 'disabled' : ''} title="Pakai sebagai Gambar Awal video">
                <i class="fa-solid fa-arrow-left"></i> Awal
              </button>
              <button class="btn btn-secondary btn-scene-use-end" style="margin-top: 0; padding: 6px 4px; font-size: 10px;" type="button" ${!scene.imageUrl ? 'disabled' : ''} title="Pakai sebagai Gambar Akhir video">
                Akhir <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
            <input type="file" class="scene-file-input" style="display: none;" accept="image/*">
          </div>
        </div>
        
        <div class="scene-card-prompts">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Prompt Gambar (Image Prompt)</label>
            <div class="input-wrapper">
              <textarea class="scene-img-prompt" style="min-height: 80px; font-size: 12px; font-family: monospace; padding-left: 10px;">${scene.image_prompt || ''}</textarea>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; margin-bottom: 4px;">Prompt Gerakan Video (Video Prompt)</label>
            <div class="input-wrapper" style="align-items: stretch; gap: 8px;">
              <textarea class="scene-vid-prompt" style="min-height: 80px; font-size: 12px; font-family: monospace; padding-left: 10px; flex: 1;">${scene.video_prompt || ''}</textarea>
              <button class="btn btn-secondary btn-scene-copy-vid" style="margin-top: 0; width: 40px; padding: 0;" type="button" title="Salin Prompt Video ke Generator">
                <i class="fa-solid fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Wire up events for this scene card
    const txtImgPrompt = card.querySelector('.scene-img-prompt');
    const txtVidPrompt = card.querySelector('.scene-vid-prompt');
    
    txtImgPrompt.addEventListener('input', () => {
      scene.image_prompt = txtImgPrompt.value;
    });
    txtVidPrompt.addEventListener('input', () => {
      scene.video_prompt = txtVidPrompt.value;
    });
    
    card.querySelector('.btn-scene-copy-vid').addEventListener('click', () => {
      els.masterSeedancePrompt.value = scene.video_prompt;
      state.masterSeedancePrompt = scene.video_prompt;
      // Sync it to model specific prompt
      const modelId = els.freebeatModelSelect.value;
      if (modelId) {
        state.videoPrompts[modelId] = scene.video_prompt;
      }
      showToast(`Prompt video Scene ${scene.scene_number} disalin ke generator!`, 'success');
    });
    
    card.querySelector('.btn-scene-gen').addEventListener('click', () => {
      generateIndividualSceneImage(scene);
    });
    
    const fileInput = card.querySelector('.scene-file-input');
    card.querySelector('.btn-scene-upload').addEventListener('click', () => {
      fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        scene.imageUrl = evt.target.result;
        renderPerFrameScenes();
        showToast(`Gambar Scene ${scene.scene_number} berhasil diupload!`, 'success');
      };
      reader.readAsDataURL(file);
    });
    
    card.querySelector('.btn-scene-download').addEventListener('click', () => {
      if (!scene.imageUrl) return;
      const safeTitle = (state.storyboardTitle || 'storyboard').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadFileFromUrl(scene.imageUrl, `scene_${scene.scene_number}_${safeTitle}.png`);
    });
    
    card.querySelector('.btn-scene-use-start').addEventListener('click', () => {
      state.vStartFile = null;
      state.vStartImage = scene.imageUrl;
      els.vStartPreviewImg.src = scene.imageUrl;
      els.vStartPreviewContainer.style.display = 'flex';
      els.btnUploadVStart.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Awal';
      showToast(`Menggunakan Gambar Scene ${scene.scene_number} sebagai Gambar Awal!`, 'success');
    });
    
    card.querySelector('.btn-scene-use-end').addEventListener('click', () => {
      state.vEndFile = null;
      state.vEndImage = scene.imageUrl;
      els.vEndPreviewImg.src = scene.imageUrl;
      els.vEndPreviewContainer.style.display = 'flex';
      els.btnUploadVEnd.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Akhir';
      showToast(`Menggunakan Gambar Scene ${scene.scene_number} sebagai Gambar Akhir!`, 'success');
    });
    
    els.perFrameScenesList.appendChild(card);
  });
}

// Generate individual scene image
async function generateIndividualSceneImage(scene) {
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (!activeKey) {
    showToast('Silakan pilih atau tambahkan API Key Freebeat terlebih dahulu!', 'error');
    return;
  }
  
  if (!scene.image_prompt) {
    showToast(`Prompt gambar Scene ${scene.scene_number} kosong!`, 'error');
    return;
  }
  
  scene.isGenerating = true;
  renderPerFrameScenes();
  showToast(`Mulai rendering gambar Scene ${scene.scene_number}...`, 'info');
  
  let productUrl = '';
  let characterUrl = '';
  if (state.productImage || state.characterImage) {
    const urls = await getUploadedReferenceUrls();
    productUrl = urls.productUrl;
    characterUrl = urls.characterUrl;
  }

  const itemData = {
    businessType: 9,
    modelId: String(state.imageModel),
    generationType: 6,
    prompt: (scene.image_prompt || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
    size: state.imageSize || "1024x1024",
    resolution: state.imageSize || "1024x1024",
    quality: "medium",
    count: 1
  };

  const refImages = [];
  if (productUrl) refImages.push(productUrl);
  if (characterUrl) refImages.push(characterUrl);
  if (refImages.length > 0) {
    itemData.images = refImages;
  }

  const requestBody = {
    items: [itemData]
  };
  
  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/createImageBatch',
        'Authorization': activeKey.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
    
    const text = await response.text();
    const data = JSON.parse(sanitizeJsonString(text));
    if (data.code !== 0) throw new Error(data.msg || 'Error dari API Freebeat');
    
    const batchId = data.data.batchId;
    scene.batchId = batchId;
    
    startIndividualSceneImagePolling(scene, activeKey);
  } catch (error) {
    console.error('Individual scene generation error:', error);
    showToast(`Gagal: ${error.message}`, 'error');
    scene.isGenerating = false;
    renderPerFrameScenes();
  }
}

// Poll status of individual scene image generation
function startIndividualSceneImagePolling(scene, activeKey) {
  const batchId = scene.batchId;
  let intervalId = setInterval(async () => {
    try {
      const response = await fetch('/proxy', {
        method: 'POST',
        headers: {
          'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/queryBatch',
          'Authorization': activeKey.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchId: batchId })
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.code !== 0) return;
      
      const item = data.data.items?.[0];
      if (!item) return;
      
      const status = String(item.status).toLowerCase();
      const isSuccess = (status === 'success' || status === 'completed' || status === 'finished');
      const isFailed = (status === 'failed' || status === 'rejected' || status === 'error');
      
      if (isSuccess || isFailed) {
        clearInterval(intervalId);
        scene.isGenerating = false;
        
        if (isSuccess) {
          scene.imageUrl = item.imageUrl;
          showToast(`Gambar Scene ${scene.scene_number} berhasil dibuat!`, 'success');
          
          // Log to DB history
          const historyItem = {
            id: batchId,
            recipeTitle: `${state.storyboardTitle} - Scene ${scene.scene_number}`,
            prompt: scene.image_prompt,
            modelId: String(state.imageModel),
            duration: 0,
            resolution: state.imageSize || '1024x1024',
            aspectRatio: '1:1',
            generateAudio: false,
            timestamp: Date.now(),
            status: 'success',
            videoUrl: item.imageUrl,
            errorMsg: '',
            credits: item.usedCredits !== undefined ? item.usedCredits : (item.credits !== undefined ? item.credits : 0),
            type: 'image'
          };
          
          fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyItem)
          }).then(res => {
            if (res.ok) {
              loadFreebeatHistory();
              refreshSessionUserCredits();
            }
          });
        } else {
          showToast(`Gagal: ${item.errorMessage || 'Server render failed'}`, 'error');
        }
        renderPerFrameScenes();
      }
    } catch (e) {
      console.error('Scene polling error:', e);
    }
  }, 5000);
}

// Start application
window.onload = init;
