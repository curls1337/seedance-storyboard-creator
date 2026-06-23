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
  freebeatImageIntervals: {} // { batchId: intervalId }
};

// Freebeat Video Studio Model Configurations (Duration, Resolution & Cost Mapping)
const modelConfigs = {
  '94': {
    name: 'Pixverse V6',
    minDuration: 5,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: (d, res) => res === '1080p' ? 495 : 345
  },
  '103': {
    name: 'Pixverse C1',
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
    minDuration: 2,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: null
  },
  '102': {
    name: 'SeedDance 2.0',
    minDuration: 4,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p'],
    defaultResolution: '720p',
    getCost: null
  },
  '101': {
    name: 'SeedDance 2.0 Fast',
    minDuration: 4,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p'],
    defaultResolution: '720p',
    getCost: null
  },
  '112': {
    name: 'Kling V3 4K',
    minDuration: 3,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['4k'],
    defaultResolution: '4k',
    getCost: null
  },
  '56': {
    name: 'Sora 2 Pro',
    allowedDurations: [4, 8, 12],
    defaultDuration: 4,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: null
  },
  '111': {
    name: 'HappyHorse',
    minDuration: 3,
    maxDuration: 15,
    defaultDuration: 5,
    allowedResolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    getCost: null
  }
};

// Built-in Templates Data
const templates = {
  'indomie-nyemek': {
    title: 'INDOMIE NYEMEK VIRAL',
    master_grid_prompt: 'Create a vertical storyboard grid image exactly like a cooking video recipe infographic. The image should contain a grid layout of 11 sequential vertical panels (organized in rows, 4 columns per row). Each panel must depict a step of cooking "INDOMIE NYEMEK VIRAL": 1. Finished dish (Hero shot), 2. Raw ingredients, 3. Slicing garlic and chilis, 4. Sautéing chilis and garlic in oil, 5. Pouring water, 6. Adding noodles, 7. Adding raw egg, 8. Adding Indomie seasoning, 9. Stirring noodles (nyemek texture), 10. Sprinkling green onions, 11. Lifting noodles with chopsticks. On the top-left of each panel, overlay the yellow bold text "SCENE X" (where X is 1 to 11). On the top-right, overlay white text of timestamps like "0-1s", "1-2s", "2-3s", etc. Directly below each panel image, draw a solid black footer containing a bold yellow/gold title in Indonesian (e.g., "INDOMIE NYEMEK VIRAL", "BAHAN-BAHAN", "IRIS BAWANG & CABAI") and a short description in white text in Indonesian. Separate all panels with a clean thin white border line. The background of the entire image is dark. High-quality professional food photography style.',
    master_seedance_prompt: 'IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the food and action in clean full screen. At the very beginning (0-1s), start directly with a clean, full-screen cinematic shot of the finished Indomie Nyemek, showing steam rising and the runny yolk of the egg, with absolutely no text or borders visible.\n- Scene 2 (1-2s): Smoothly transition to show the raw ingredients (noodle packet, chilis, egg, garlic) arranged on a rustic wooden table, camera slowly zooming out.\n- Scene 3 (2-3s): Slicing garlic and red chilis on a wooden cutting board with a kitchen knife.\n- Scene 4 (3-4s): Sautéing sliced chilis and garlic in hot cooking oil in a pan, sizzling with light steam.\n- Scene 5 (4-6s): Pouring water into the frying pan, causing dramatic steam and bubbles.\n- Scene 6 (6-7s): Placing a noodle block into the boiling spicy broth.\n- Scene 7 (7-9s): Cracking a raw egg into the boiling noodles, with the yolk intact.\n- Scene 8 (9-10s): Pouring seasoning powder and chili oil from the sachet onto the noodles.\n- Scene 9 (10-12s): Stirring the noodles with a wooden spoon as the sauce thickens into a rich "nyemek" texture.\n- Scene 10 (12-14s): Sprinkling fresh green onions on top of the cooked noodles, steam rising.\n- Scene 11 (14-15s): Lifting a mouthful of noodles with chopsticks, capturing the glossy sauce dripping in slow motion.'
  },
  'nasi-goreng': {
    title: 'NASI GORENG SPESIAL',
    master_grid_prompt: 'Create a vertical storyboard grid image exactly like a cooking video recipe infographic. The image should contain a grid layout of 7 sequential vertical panels (organized in rows, 3 columns per row). Each panel must depict a step of cooking Indonesian "NASI GORENG SPESIAL": 1. Nasi Goreng Spesial served on a plate with egg, cucumber, crackers, 2. Raw shallots, garlic, chilis on mortar and pestle, 3. Sautéing ground spices paste in oil in a wok, 4. Scrambling an egg inside the wok with sizzling spices, 5. Adding white rice, 6. Drizzling sweet soy sauce (kecap manis), 7. Sprinkling fried shallots on the finished dish. On the top-left of each panel, overlay the yellow bold text "SCENE X" (where X is 1 to 7). On the top-right, overlay white text of timestamps like "0-2s", "2-4s", etc. Directly below each panel, draw a solid black footer containing a bold yellow title and short Indonesian description. Separate all panels with a clean thin white border line. High-quality professional food photography style, dark theme.',
    master_seedance_prompt: 'IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the food and action in clean full screen. At the very beginning (0-2s), start directly with a clean, full-screen cinematic shot of a hot plate of Nasi Goreng Spesial on a rustic table, showing steam rising from the egg yolk, with absolutely no text or borders visible.\n- Scene 2 (2-4s): Smoothly transition to show the fresh shallots, garlic, and chilis arranged on a stone mortar and pestle.\n- Scene 3 (4-6s): Sautéing the ground spice paste in hot oil in a wok, with spatula stirring the paste.\n- Scene 4 (6-8s): Cracking and scrambling an egg into the sizzling spices.\n- Scene 5 (8-10s): Adding cold white rice into the wok, showing steam rising.\n- Scene 6 (10-12s): Drizzling sweet soy sauce (kecap manis) over the rice and stirring.\n- Scene 7 (12-15s): Plating the Nasi Goreng and sprinkling crispy fried shallots on top, with steam rising.'
  },
  'sate-madura': {
    title: 'SATE AYAM MADURA',
    master_grid_prompt: 'Create a vertical storyboard grid image exactly like a cooking video recipe infographic. The image should contain a grid layout of 6 sequential vertical panels (organized in rows, 3 columns per row). Each panel must depict a step of cooking "SATE AYAM MADURA": 1. Plated chicken satay with peanut sauce and soy sauce, 2. Dicing raw chicken breast, 3. Skewering chicken onto bamboo skewers, 4. Grilling satay on hot charcoal grill with smoke, 5. Making peanut sauce in a mortar, 6. Serving with rice cakes (lontong) and sweet soy sauce. On the top-left of each panel, overlay the yellow bold text "SCENE X" (where X is 1 to 6). On the top-right, overlay white text of timestamps like "0-2s", "2-4s", etc. Directly below each panel, draw a solid black footer containing a bold yellow/gold title in Indonesian (e.g., "SATE AYAM MADURA", "POTONG AYAM", "TUSUK SATE") and a short description in white text in Indonesian. Separate all panels with a clean thin white border line. The background of the entire image is dark. High-quality professional food photography style.',
    master_seedance_prompt: 'IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the food and action in clean full screen. At the very beginning (0-2s), start directly with a clean, full-screen cinematic shot of grilled chicken satay on a plate, peanut sauce and sweet soy sauce drizzled over it, steam rising, with absolutely no text or borders visible.\n- Scene 2 (2-4s): Close-up of dicing raw chicken breast on a wooden board.\n- Scene 3 (4-6s): Hands skewering chicken meat onto bamboo skewers.\n- Scene 4 (6-8s): Grilling chicken satay on a hot charcoal grill, smoke rising and flames flickering.\n- Scene 5 (8-10s): Grinding peanuts, garlic, and spices in a stone mortar to make peanut sauce.\n- Scene 6 (10-12s): Serving the chicken satay with rice cakes (lontong), drizzling sweet soy sauce and sprinkling fried shallots.'
  },
  'kopi-susu': {
    title: 'ES KOPI SUSU GULA AREN',
    master_grid_prompt: 'Create a vertical storyboard grid image exactly like a beverage video recipe infographic. The image should contain a grid layout of 5 sequential vertical panels (organized in rows, 3 columns per row). Each panel must depict a step of making "ES KOPI SUSU GULA AREN": 1. Finished iced coffee in a tall glass with beautiful layers, 2. Pouring liquid palm sugar (gula aren) into the glass, 3. Adding ice cubes, 4. Pouring fresh milk over the ice, 5. Pouring a double shot of espresso on top. On the top-left of each panel, overlay the yellow bold text "SCENE X" (where X is 1 to 5). On the top-right, overlay white text of timestamps like "0-2s", "2-4s", etc. Directly below each panel, draw a solid black footer containing a bold yellow/gold title in Indonesian (e.g., "ES KOPI SUSU GULA AREN", "TUANG GULA AREN", "MASUKKAN ES BATU") and a short description in white text in Indonesian. Separate all panels with a clean thin white border line. The background of the entire image is dark. High-quality professional food and beverage photography style.',
    master_seedance_prompt: 'IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the beverage and action in clean full screen. At the very beginning (0-2s), start directly with a clean, full-screen cinematic shot of the finished layered Iced Coffee Milk with Palm Sugar in a tall glass on a dark table, condensation on the glass, with absolutely no text or borders visible.\n- Scene 2 (2-4s): Pouring thick liquid palm sugar (gula aren) at the bottom of the glass.\n- Scene 3 (4-6s): Dropping fresh ice cubes into the glass, splashes of palm sugar.\n- Scene 4 (6-8s): Pouring cold fresh white milk over the ice cubes, creating layers.\n- Scene 5 (8-10s): Pouring hot dark espresso shot on top of the milk layer, showing espresso mixing slowly with the milk.'
  }
};

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
  btnQuickLoadNyemek: document.getElementById('btn-quick-load-nyemek'),
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
  btnUseStoryboardStart: document.getElementById('btn-use-storyboard-start'),
  freebeatVStartInput: document.getElementById('freebeat-v-start-input'),
  vStartPreviewContainer: document.getElementById('v-start-preview-container'),
  vStartPreviewImg: document.getElementById('v-start-preview-img'),

  btnUploadVEnd: document.getElementById('btn-upload-v-end'),
  btnUseStoryboardEnd: document.getElementById('btn-use-storyboard-end'),
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
  btnClearHistoryTab: document.getElementById('btn-clear-history-tab')
};

// Initialization
function init() {
  setupEventListeners();
  setupTabNavigation();
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
  
  // Load default Indomie Nyemek Template
  loadTemplate('indomie-nyemek');
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

  els.btnGenerateStoryboard.addEventListener('click', generateStoryboardWithAI);
  els.btnClearStoryboard.addEventListener('click', clearStoryboard);
  els.btnOneClickFlow.addEventListener('click', runOneClickFlow);
  els.btnQuickLoadNyemek.addEventListener('click', () => loadTemplate('indomie-nyemek'));
  
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
  els.btnUseStoryboardStart.addEventListener('click', handleUseStoryboardStart);

  els.btnUploadVEnd.addEventListener('click', () => els.freebeatVEndInput.click());
  els.freebeatVEndInput.addEventListener('change', handleVEndImageUpload);
  els.btnUseStoryboardEnd.addEventListener('click', handleUseStoryboardEnd);

  // V2V event listeners
  els.btnUploadVRef.addEventListener('click', () => els.freebeatVRefInput.click());
  els.freebeatVRefInput.addEventListener('change', handleVRefVideoUpload);
  
  // Dynamic duration and cost calculation listeners
  els.freebeatModelSelect.addEventListener('change', updateDurationOptionsAndCost);
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
  
  state.storyboardTitle = tpl.title;
  state.masterGridPrompt = tpl.master_grid_prompt;
  state.masterSeedancePrompt = tpl.master_seedance_prompt;
  
  // Reset image
  state.combinedImage = '';
  els.combinedStoryboardImage.src = '';
  els.combinedStoryboardImage.style.display = 'none';
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
  els.freebeatI2vInputs.style.display = 'none';
  els.freebeatV2vInputs.style.display = 'none';
  els.vStartPreviewContainer.style.display = 'none';
  els.vEndPreviewContainer.style.display = 'none';
  els.vRefPreviewContainer.style.display = 'none';
  els.freebeatVRefUrl.value = '';
  
  // Set prompts editor values
  els.masterGridPrompt.value = state.masterGridPrompt;
  els.masterSeedancePrompt.value = state.masterSeedancePrompt;
  
  // Adjust scenes count in slider if preset has standard scenes
  let defaultCount = 11;
  if (templateId === 'nasi-goreng') defaultCount = 7;
  else if (templateId === 'sate-madura') defaultCount = 6;
  else if (templateId === 'kopi-susu') defaultCount = 5;
  
  state.sceneCount = defaultCount;
  els.sceneCount.value = defaultCount;
  els.sceneCountVal.textContent = defaultCount;
  
  showToast(`Template "${tpl.title}" berhasil dimuat!`, 'success');
  
  // Show UI elements
  els.storyboardEmptyState.style.display = 'none';
  els.storyboardPreviewWrapper.style.display = 'flex';
  els.btnClearStoryboard.style.display = 'flex';
  els.storyboardDisplayTitle.textContent = state.storyboardTitle;
  els.storyboardDisplayMeta.textContent = `Infografis Gabungan • ${defaultCount} Langkah`;
  
  // Reset select option
  els.templateSelect.value = templateId;
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
  
  els.combinedImagePlaceholder.style.display = 'flex';
  els.btnDownloadCombined.disabled = true;
  els.btnExportStoryboard.disabled = true;
  
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

// API Generation: Create Storyboard Steps with LLM (via secure endpoint)
async function generateStoryboardWithAI() {
  const concept = els.recipeConcept.value.trim();
  if (!concept) {
    showToast('Harap masukkan konsep resep/video terlebih dahulu!', 'error');
    return;
  }
  
  els.btnGenerateStoryboard.disabled = true;
  els.btnGenerateStoryboard.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan AI...';
  
  const systemPrompt = `You are an expert storyboard planner for AI video generation on platforms like Seedance.
Your task is to take a cooking recipe or video concept and design:
1. A master grid prompt ("master_grid_prompt") in English that will generate a single vertical storyboard grid image consisting of ${state.sceneCount} sequential vertical panels. The image should be formatted exactly like a cooking video recipe infographic. Each panel must depict a step. Instruct the image generator to draw "SCENE X" (yellow bold text) on the top-left of each panel, timestamps (white text) on the top-right, and a solid black footer directly below each panel containing a bold yellow/gold title in Indonesian and a short description in white text in Indonesian. Separate all panels with a clean thin white border line. Use a dark background and professional food photography style.
2. A single master Seedance prompt ("master_seedance_prompt") in English. This is a unified prompt that will be sent to Seedance along with the uploaded grid image to animate the storyboard. It must describe the chronological animation, camera movement, and visual details for each of the ${state.sceneCount} panels sequentially, referencing the timestamps.
CRITICAL: You MUST begin the "master_seedance_prompt" with a strong instruction directing the video generator to completely ignore and crop out all grid lines, borders, black footers, text overlays, and labels from the input image, and to zoom in to show only the clean food/beverage and action in full screen. For example, begin with: "IMPORTANT: The input is a storyboard grid with borders, black footers, and text overlays. For the generated video, you MUST completely crop out all grid lines, borders, black footers, and text overlays. Zoom in to show only the food/beverage and action in clean full screen. At the very beginning (0-Xs), start directly with a clean, full-screen cinematic shot of [Scene 1 Description], with absolutely no text or borders visible." and then list the remaining scenes.

Respond ONLY with a JSON object in this format (no markdown blocks, just raw JSON, or wrap it inside clean markdown JSON):
{
  "title": "NAMA RESEP / KONSEP",
  "master_grid_prompt": "...",
  "master_seedance_prompt": "..."
}`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (state.productImage || state.characterImage) {
      const userContent = [
        { type: 'text', text: `Create a single-prompt storyboard with ${state.sceneCount} steps for: "${concept}".` }
      ];
      
      let instructions = '';
      if (state.productImage) {
        userContent.push({ type: 'image_url', image_url: { url: state.productImage } });
        instructions += ' Analyze the product reference image and make sure the generated prompts explicitly describe this specific product, its packaging, and branding details.';
      }
      if (state.characterImage) {
        userContent.push({ type: 'image_url', image_url: { url: state.characterImage } });
        instructions += ' Analyze the character reference image and make sure the generated prompts explicitly describe this specific character\'s appearance, face, clothing, and styling consistently across all scenes.';
      }
      
      userContent[0].text += instructions;
      
      messages.push({
        role: 'user',
        content: userContent
      });
    } else {
      messages.push({
        role: 'user',
        content: `Create a single-prompt storyboard with ${state.sceneCount} steps for: "${concept}"`
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
    
    const parsedData = JSON.parse(content);
    
    state.storyboardTitle = parsedData.title || 'Custom Recipe Storyboard';
    state.masterGridPrompt = parsedData.master_grid_prompt || '';
    state.masterSeedancePrompt = parsedData.master_seedance_prompt || '';
    
    // Set prompt input values
    els.masterGridPrompt.value = state.masterGridPrompt;
    els.masterSeedancePrompt.value = state.masterSeedancePrompt;
    
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
    
  } catch (error) {
    console.error('LLM generation error:', error);
    showToast(`Gagal membuat storyboard: ${error.message}`, 'error');
  } finally {
    els.btnGenerateStoryboard.disabled = false;
    els.btnGenerateStoryboard.innerHTML = '<i class="fa-solid fa-bolt"></i> Buat Storyboard AI';
  }
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
  
  const requestBody = {
    items: [
      {
        businessType: 9,
        modelId: String(state.imageModel),
        generationType: 6,
        prompt: prompt,
        size: state.imageSize || "1024x1024",
        resolution: state.imageSize || "1024x1024",
        quality: "medium",
        count: parseInt(state.imageCount, 10) || 1
      }
    ]
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
    
    const data = await response.json();
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
          const imgUrl1 = successes[0].imageUrl;
          if (!imgUrl1) {
            showToast('Gagal: Image URL 1 kosong dari response Freebeat.', 'error');
            els.combinedImagePlaceholder.style.display = 'flex';
            els.storyboardImagesContainer.style.display = 'none';
            return;
          }
          
          state.combinedImage = imgUrl1;
          els.combinedStoryboardImage.src = imgUrl1;
          
          if (items.length > 1) {
            const imgUrl2 = successes[1].imageUrl;
            if (imgUrl2) {
              state.combinedImage2 = imgUrl2;
              els.combinedStoryboardImage2.src = imgUrl2;
              els.lblStoryboardImg1.style.display = 'block';
              els.storyboardImg2Wrapper.style.display = 'block';
              els.storyboardImagesGrid.style.gridTemplateColumns = '1fr 1fr';
            }
          } else {
            state.combinedImage2 = '';
            els.combinedStoryboardImage2.src = '';
            els.lblStoryboardImg1.style.display = 'none';
            els.storyboardImg2Wrapper.style.display = 'none';
            els.storyboardImagesGrid.style.gridTemplateColumns = '1fr';
          }
          
          els.storyboardImagesContainer.style.display = 'block';
          els.combinedImagePlaceholder.style.display = 'none';
          
          els.btnDownloadCombined.disabled = false;
          els.btnExportStoryboard.disabled = false;
          showToast('Gambar infografis storyboard berhasil dibuat!', 'success');
        } else {
          const failedItem = items.find(item => {
            const status = String(item.status).toLowerCase();
            return (status === 'failed' || status === 'rejected' || status === 'error');
          });
          const errorMsg = failedItem?.errorMessage || 'Proses render gambar di server Freebeat gagal.';
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

function handleProductImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.productImage = e.target.result;
    els.productPreviewImg.src = state.productImage;
    els.productPreviewContainer.style.display = 'flex';
    els.btnClearProduct.style.display = 'block';
    els.btnUploadProduct.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Foto Produk';
    showToast('Gambar referensi produk berhasil diunggah!', 'success');
  };
  reader.readAsDataURL(file);
}

function clearProductImage() {
  state.productImage = '';
  els.productImageInput.value = '';
  els.productPreviewImg.src = '';
  els.productPreviewContainer.style.display = 'none';
  els.btnClearProduct.style.display = 'none';
  els.btnUploadProduct.innerHTML = '<i class="fa-solid fa-camera"></i> Upload Foto Produk';
  showToast('Gambar referensi produk dihapus.', 'info');
}

function handleCharacterImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.characterImage = e.target.result;
    els.characterPreviewImg.src = state.characterImage;
    els.characterPreviewContainer.style.display = 'flex';
    els.btnClearCharacter.style.display = 'block';
    els.btnUploadCharacter.innerHTML = '<i class="fa-solid fa-user-astronaut"></i> Ganti Foto Karakter';
    showToast('Gambar referensi karakter berhasil diunggah!', 'success');
  };
  reader.readAsDataURL(file);
}

function clearCharacterImage() {
  state.characterImage = '';
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

function handleUseStoryboardStart() {
  if (!state.combinedImage) {
    showToast('Gambar storyboard kosong! Silakan generate storyboard terlebih dahulu.', 'error');
    return;
  }
  state.vStartFile = null;
  state.vStartImage = state.combinedImage;
  
  els.vStartPreviewImg.src = state.combinedImage;
  els.vStartPreviewContainer.style.display = 'flex';
  els.btnUploadVStart.innerHTML = '<i class="fa-solid fa-camera"></i> Upload Gambar Awal';
  showToast('Menggunakan gambar storyboard sebagai Gambar Awal!', 'success');
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

function handleUseStoryboardEnd() {
  const targetImage = state.combinedImage2 || state.combinedImage;
  if (!targetImage) {
    showToast('Gambar storyboard kosong! Silakan generate storyboard terlebih dahulu.', 'error');
    return;
  }
  state.vEndFile = null;
  state.vEndImage = targetImage;
  
  els.vEndPreviewImg.src = targetImage;
  els.vEndPreviewContainer.style.display = 'flex';
  els.btnUploadVEnd.innerHTML = '<i class="fa-solid fa-camera"></i> Ganti Gambar Akhir';
  
  if (state.combinedImage2) {
    showToast('Menggunakan Gambar 2 Storyboard sebagai Gambar Akhir!', 'success');
  } else {
    showToast('Menggunakan Gambar 1 Storyboard sebagai Gambar Akhir!', 'success');
  }
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

  const data = await response.json();
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
            const cost = getEstimatedCreditCost(item.modelId, item.duration, item.resolution);
            startFreebeatVideoPolling(item.id, activeKey, cost);
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
    
    const modelName = getModelDisplayName(item.modelId);
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    card.innerHTML = `
      <div class="history-card-header">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span class="history-card-title">${item.recipeTitle}</span>
          <span class="history-card-time">${dateStr}</span>
        </div>
        <div>${statusBadge}</div>
      </div>
      <div class="history-card-meta">
        <span class="meta-tag">${modelName}</span>
        <span class="meta-tag">${item.duration} Detik</span>
        <span class="meta-tag">${item.resolution}</span>
        <span class="meta-tag">${item.aspectRatio}</span>
        ${item.generateAudio ? '<span class="meta-tag"><i class="fa-solid fa-volume-high"></i> Audio</span>' : ''}
      </div>
      <div class="history-card-prompt" title="${item.prompt}">${item.prompt}</div>
      
      ${item.status === 'success' ? `
        <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; position: relative;">
          <video src="${item.videoUrl}" style="width: 100%; height: 100%; object-fit: contain;" controls preload="none"></video>
        </div>
      ` : ''}
      
      ${item.status === 'failed' ? `
        <div style="padding: 10px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); color: var(--accent-red); font-size: 11px;">
          <i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> ${item.errorMsg || 'Gagal generate video.'}
        </div>
      ` : ''}

      <div class="history-card-footer">
        <button class="btn btn-secondary btn-regen" style="margin-top: 0; padding: 6px 12px; font-size: 11px; width: auto;" type="button">
          <i class="fa-solid fa-rotate-right"></i> Gunakan Prompt
        </button>
        
        <div style="display: flex; gap: 8px;">
          ${item.status === 'success' ? `
            <button class="btn btn-primary btn-play" style="margin-top: 0; padding: 6px 12px; font-size: 11px; width: auto;" type="button">
              <i class="fa-solid fa-play"></i> Putar di Player Utama
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    // Wire listeners
    card.querySelector('.btn-regen').addEventListener('click', () => {
      handleRegenerateFromHistory(item);
    });
    
    if (item.status === 'success') {
      card.querySelector('.btn-play').addEventListener('click', () => {
        showFreebeatVideoPlayer(item.recipeTitle, item.videoUrl);
        switchTab('tab-generator');
      });
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
  els.freebeatModelSelect.value = item.modelId;
  els.freebeatDuration.value = item.duration;
  els.freebeatAspectRatio.value = item.aspectRatio;
  els.freebeatResolution.value = item.resolution;
  els.freebeatGenerateAudio.checked = item.generateAudio;
  els.masterSeedancePrompt.value = item.prompt;
  
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
      prompt: prompt,
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
      if (!startRef || !endRef) {
        throw new Error('Gambar Awal dan Gambar Akhir wajib ditentukan untuk mode Image-to-Video.');
      }

      let startUrl = '';
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

      let endUrl = '';
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
    
    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(data.msg || 'Terjadi kesalahan dari API Freebeat');
    }
    
    const batchData = data.data;
    const batchId = batchData.batchId;
    const item = batchData.items[0];
    
    if (item && !item.accepted) {
      throw new Error(item.message || 'Render video ditolak oleh server Freebeat.');
    }
    
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
        let videoUrl = isSuccess ? item.videoUrl : '';
        let errorMsg = isFailed ? (item.errorMessage || 'Proses render video di server Freebeat gagal.') : '';
        
        // Update history item in Database
        const historyItem = state.freebeatHistory.find(h => h.id === batchId);
        if (historyItem) {
          historyItem.status = newStatus;
          historyItem.videoUrl = videoUrl;
          historyItem.errorMsg = errorMsg;
          
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyItem)
          });
        }
        
        if (isSuccess) {
          // Deduct credits and update key balance
          const usedCredits = item.usedCredits !== undefined ? item.usedCredits : (item.credits !== undefined ? item.credits : (estimatedCost || 0));
          
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
          showFreebeatVideoSuccess(videoUrl);
        } else {
          await loadFreebeatHistory();
          showFreebeatVideoError(errorMsg);
        }
      } else {
        // Update loading status text
        els.freebeatVideoLoaderText.textContent = `Rendering video... Status: ${status.toUpperCase()}`;
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
  
  const link = document.createElement('a');
  const safeTitle = state.storyboardTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  link.download = `video_${safeTitle}.mp4`;
  link.href = url;
  link.target = '_blank';
  link.click();
  showToast('Mengunduh video...', 'success');
}

// Start application
window.onload = init;
