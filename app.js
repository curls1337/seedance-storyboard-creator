/* app.js - Seedance Storyboard and AI Prompt Generator Logic (Single-Prompt Mode) */

// Application State
const state = {
  storyboardTitle: 'Indomie Nyemek Viral',
  masterGridPrompt: '',
  masterSeedancePrompt: '',
  combinedImage: '',
  baseUrl: 'http://143.198.218.129:8045/v1',
  apiKey: 'dsuaufsakjfsa',
  textModel: 'gpt-4o-mini',
  imageModel: 'gemini-3.1-flash-image',
  sceneCount: 11,
  isConnected: false,
  productImage: '',
  
  // Freebeat Keys State
  freebeatKeys: [], // [{ id: 'uuid', label: 'My Key', key: 'sk-...', balance: 1000 }]
  activeFreebeatKeyId: '',
  freebeatVideoTaskId: null,
  freebeatVideoPollingInterval: null,
  
  // History and Multiple Polling State
  freebeatHistory: [], // [{ id: 'batchId', recipeTitle: '...', prompt: '...', modelId: '...', duration: 5, resolution: '720p', aspectRatio: '9:16', generateAudio: false, timestamp: 1234567, status: 'success'/'failed'/'processing', videoUrl: '...', errorMsg: '...' }]
  freebeatVideoIntervals: {} // { batchId: intervalId }
};

// Freebeat Video Studio Model Configurations (Duration & Cost Mapping)
const modelConfigs = {
  '94': {
    name: 'Pixverse V6',
    allowedDurations: [5, 10],
    defaultDuration: 5,
    getCost: (d, res) => (res === '1080p' || d > 5) ? 495 : 345
  },
  '103': {
    name: 'Pixverse C1',
    minDuration: 7,
    maxDuration: 19,
    defaultDuration: 10,
    getCost: (d) => d
  },
  '104': {
    name: 'Wan V2.7',
    minDuration: 2,
    maxDuration: 15,
    defaultDuration: 5,
    getCost: (d) => d
  },
  '102': {
    name: 'SeedDance 2.0',
    minDuration: 4,
    maxDuration: 15,
    defaultDuration: 5,
    getCost: (d) => d
  },
  '101': {
    name: 'SeedDance 2.0 Fast',
    minDuration: 4,
    maxDuration: 15,
    defaultDuration: 5,
    getCost: (d) => d
  },
  '112': {
    name: 'Kling V3 4K',
    minDuration: 3,
    maxDuration: 15,
    defaultDuration: 5,
    getCost: (d) => d
  },
  '56': {
    name: 'Sora 2 Pro',
    minDuration: 4,
    maxDuration: 12,
    defaultDuration: 5,
    getCost: (d) => d
  },
  '111': {
    name: 'HappyHorse',
    minDuration: 3,
    maxDuration: 15,
    defaultDuration: 5,
    getCost: (d) => d
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
  apiBaseUrl: document.getElementById('api-base-url'),
  apiKey: document.getElementById('api-key'),
  btnTestConnection: document.getElementById('btn-test-connection'),
  apiStatusDot: document.getElementById('api-status-dot'),
  apiStatusText: document.getElementById('api-status-text'),
  
  templateSelect: document.getElementById('template-select'),
  
  recipeConcept: document.getElementById('recipe-concept'),
  textModelSelect: document.getElementById('text-model-select'),
  imageModelSelect: document.getElementById('image-model-select'),
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
  combinedStoryboardImage: document.getElementById('combined-storyboard-image'),
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
  
  // Toast Notification
  toastNotification: document.getElementById('toast-notification'),
  toastMessage: document.getElementById('toast-message'),

  // Freebeat Configuration Elements
  freebeatKeySelect: document.getElementById('freebeat-key-select'),
  freebeatActiveBalanceWrapper: document.getElementById('freebeat-active-balance-wrapper'),
  freebeatActiveBalanceDisplay: document.getElementById('freebeat-active-balance-display'),
  btnManageFreebeatKeys: document.getElementById('btn-manage-freebeat-keys'),
  
  // Freebeat Keys Modal Elements
  freebeatKeysModal: document.getElementById('freebeat-keys-modal'),
  btnCloseFreebeatModal: document.getElementById('btn-close-freebeat-modal'),
  freebeatKeysListContainer: document.getElementById('freebeat-keys-list-container'),
  newFreebeatKeyLabel: document.getElementById('new-freebeat-key-label'),
  newFreebeatKeyVal: document.getElementById('new-freebeat-key-val'),
  btnAddFreebeatKey: document.getElementById('btn-add-freebeat-key'),

  // Freebeat Video Generator Elements
  freebeatModelSelect: document.getElementById('freebeat-model-select'),
  freebeatAspectRatio: document.getElementById('freebeat-aspect-ratio'),
  freebeatDuration: document.getElementById('freebeat-duration'),
  freebeatResolution: document.getElementById('freebeat-resolution'),
  freebeatGenerateAudio: document.getElementById('freebeat-generate-audio'),
  btnGenerateFreebeatVideo: document.getElementById('btn-generate-freebeat-video'),

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
  
  // Freebeat Video History Elements
  freebeatHistoryList: document.getElementById('freebeat-history-list'),
  btnClearFreebeatHistory: document.getElementById('btn-clear-freebeat-history'),
  btnRefreshFreebeatBalance: document.getElementById('btn-refresh-freebeat-balance')
};

// Initialization
function init() {
  setupEventListeners();
  syncStateFromInputs();
  checkApiConnectionQuietly();
  
  // Load Freebeat Keys
  loadFreebeatKeys();
  // Load Freebeat History
  loadFreebeatHistory();
  
  // Initialize duration options and cost display based on selected model
  updateDurationOptionsAndCost();
}

// Sync Form Inputs to State
function syncStateFromInputs() {
  state.baseUrl = els.apiBaseUrl.value.trim();
  state.apiKey = els.apiKey.value.trim();
  state.textModel = els.textModelSelect.value;
  state.imageModel = els.imageModelSelect.value;
  state.sceneCount = parseInt(els.sceneCount.value, 10);
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
  // Inputs sync
  els.apiBaseUrl.addEventListener('change', () => { state.baseUrl = els.apiBaseUrl.value.trim(); checkApiConnectionQuietly(); });
  els.apiKey.addEventListener('change', () => { state.apiKey = els.apiKey.value.trim(); checkApiConnectionQuietly(); });
  els.textModelSelect.addEventListener('change', () => state.textModel = els.textModelSelect.value);
  els.imageModelSelect.addEventListener('change', () => state.imageModel = els.imageModelSelect.value);
  
  els.sceneCount.addEventListener('input', () => {
    els.sceneCountVal.textContent = els.sceneCount.value;
    state.sceneCount = parseInt(els.sceneCount.value, 10);
  });

  // Action Buttons
  els.btnTestConnection.addEventListener('click', testApiConnection);
  els.btnGenerateStoryboard.addEventListener('click', generateStoryboardWithAI);
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

  // Product image events
  els.btnUploadProduct.addEventListener('click', () => els.productImageInput.click());
  els.productImageInput.addEventListener('change', handleProductImageUpload);
  els.btnClearProduct.addEventListener('click', clearProductImage);

  // Template select
  els.templateSelect.addEventListener('change', () => {
    const val = els.templateSelect.value;
    if (val) loadTemplate(val);
  });

  // Freebeat keys manager events
  els.btnManageFreebeatKeys.addEventListener('click', openFreebeatKeysModal);
  els.btnCloseFreebeatModal.addEventListener('click', closeFreebeatKeysModal);
  els.btnAddFreebeatKey.addEventListener('click', handleAddFreebeatKey);
  els.freebeatKeySelect.addEventListener('change', handleSelectFreebeatKey);
  els.btnGenerateFreebeatVideo.addEventListener('click', handleGenerateFreebeatVideo);
  els.btnDownloadFreebeatVideo.addEventListener('click', downloadFreebeatVideo);
  els.btnClearFreebeatHistory.addEventListener('click', clearFreebeatHistory);
  els.btnRefreshFreebeatBalance.addEventListener('click', autoDetectFreebeatBalance);
  
  // Dynamic duration and cost calculation listeners
  els.freebeatModelSelect.addEventListener('change', updateDurationOptionsAndCost);
  els.freebeatDuration.addEventListener('change', updateEstimatedCostUI);
  els.freebeatResolution.addEventListener('change', updateEstimatedCostUI);
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
  if (!state.baseUrl || !state.apiKey) {
    if (showToasts) showToast('Password dan Base URL harus diisi!', 'error');
    return false;
  }
  
  try {
    const response = await fetch('/proxy', {
      method: 'GET',
      headers: {
        'x-target-url': `${state.baseUrl}/models`,
        'Authorization': `Bearer ${state.apiKey}`
      }
    });
    
    if (response.ok) {
      if (showToasts) showToast('Koneksi berhasil! Password valid.', 'success');
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
  state.isConnected = connected;
  if (connected) {
    els.apiStatusDot.className = 'status-dot connected';
    els.apiStatusText.textContent = 'Connected';
    els.btnGenerateStoryboard.disabled = false;
  } else {
    els.apiStatusDot.className = 'status-dot';
    els.apiStatusText.textContent = 'Disconnected';
  }
}

// Load built-in templates
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
  els.storyboardDisplayTitle.textContent = state.storyboardTitle;
  els.storyboardDisplayMeta.textContent = `Infografis Gabungan • ${defaultCount} Langkah`;
  
  // Reset select option
  els.templateSelect.value = templateId;
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

// API Generation: Create Storyboard Steps with LLM (gpt-4o-mini / gemini)
async function generateStoryboardWithAI() {
  const concept = els.recipeConcept.value.trim();
  if (!concept) {
    showToast('Harap masukkan konsep resep/video terlebih dahulu!', 'error');
    return;
  }
  
  if (!state.isConnected) {
    const ok = await verifyConnection(true);
    if (!ok) return;
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

    if (state.productImage) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `Create a single-prompt storyboard with ${state.sceneCount} steps for: "${concept}". Analyze the product reference image and make sure the generated prompt explicitly describes this specific product, its packaging, and branding details.` },
          { type: 'image_url', image_url: { url: state.productImage } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Create a single-prompt storyboard with ${state.sceneCount} steps for: "${concept}"`
      });
    }

    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'x-target-url': `${state.baseUrl}/chat/completions`,
        'Authorization': `Bearer ${state.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: state.textModel,
        response_format: { type: "json_object" },
        messages: messages
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned error code: ${response.status}`);
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
  const prompt = els.masterGridPrompt.value.trim();
  if (!prompt) {
    showToast('Master grid prompt kosong! Harap muat template atau buat dengan AI.', 'error');
    return;
  }
  
  if (!state.isConnected) {
    const ok = await verifyConnection(true);
    if (!ok) return;
  }
  
  els.btnGenerateCombinedImage.disabled = true;
  els.btnGenerateCombinedImage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Grid...';
  
  // Show image loading overlay
  els.combinedImagePlaceholder.style.display = 'none';
  els.combinedStoryboardImage.style.display = 'none';
  els.combinedImageLoader.style.display = 'flex';
  els.combinedLoaderText.textContent = 'Generating Storyboard Grid Image (1 Prompt)...';
  
  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'x-target-url': `${state.baseUrl}/chat/completions`,
        'Authorization': `Bearer ${state.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: state.imageModel,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Proxy error code: ${response.status}`);
    }
    
    const data = await response.json();
    const markdownContent = data.choices[0].message.content;
    
    const base64Match = markdownContent.match(/!\[.*?\]\((data:image\/[a-zA-Z]+;base64,.*?)\)/);
    if (base64Match) {
      state.combinedImage = base64Match[1];
      
      // Update image UI
      els.combinedStoryboardImage.src = state.combinedImage;
      els.combinedStoryboardImage.style.display = 'block';
      els.combinedImagePlaceholder.style.display = 'none';
      
      els.btnDownloadCombined.disabled = false;
      els.btnExportStoryboard.disabled = false;
      showToast('Gambar infografis storyboard berhasil dibuat!', 'success');
    } else {
      throw new Error('Gagal mengekstrak data base64 gambar dari response API.');
    }
  } catch (error) {
    console.error('Combined image generation error:', error);
    showToast(`Gagal: ${error.message}`, 'error');
    
    // Restore empty placeholder
    els.combinedImagePlaceholder.style.display = 'flex';
    els.combinedStoryboardImage.style.display = 'none';
    els.btnDownloadCombined.disabled = true;
    els.btnExportStoryboard.disabled = true;
  } finally {
    els.combinedImageLoader.style.display = 'none';
    els.btnGenerateCombinedImage.disabled = false;
    els.btnGenerateCombinedImage.innerHTML = '<i class="fa-solid fa-image"></i> Generate Gambar Storyboard (1 Prompt)';
  }
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
function triggerCombinedUpload() {
  els.combinedFileInput.click();
}

function handleCombinedFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    state.combinedImage = e.target.result;
    
    els.combinedStoryboardImage.src = state.combinedImage;
    els.combinedStoryboardImage.style.display = 'block';
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
  
  if (!state.isConnected) {
    const ok = await verifyConnection(true);
    if (!ok) return;
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

// Freebeat Key Management functions
function loadFreebeatKeys() {
  try {
    const savedKeys = localStorage.getItem('freebeat_keys');
    const savedActiveId = localStorage.getItem('active_freebeat_key_id');
    
    if (savedKeys) {
      state.freebeatKeys = JSON.parse(savedKeys);
    } else {
      state.freebeatKeys = [];
    }
    
    if (savedActiveId) {
      state.activeFreebeatKeyId = savedActiveId;
    } else if (state.freebeatKeys.length > 0) {
      state.activeFreebeatKeyId = state.freebeatKeys[0].id;
    } else {
      state.activeFreebeatKeyId = '';
    }
    
    renderFreebeatKeySelect();
    renderFreebeatKeysList();
  } catch (err) {
    console.error('Error loading Freebeat keys:', err);
    state.freebeatKeys = [];
    state.activeFreebeatKeyId = '';
  }
}

function saveFreebeatKeys() {
  localStorage.setItem('freebeat_keys', JSON.stringify(state.freebeatKeys));
  localStorage.setItem('active_freebeat_key_id', state.activeFreebeatKeyId);
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
    
    // Mask key string for presentation
    const masked = key.key.length > 12 
      ? `${key.key.substring(0, 6)}...${key.key.substring(key.key.length - 4)}` 
      : '***';
    const used = key.usedCredits || 0;
    opt.textContent = `${key.label} (${masked}) • Terpakai: ${used} Cr`;
    els.freebeatKeySelect.appendChild(opt);
  });
  
  // Show/Hide active balance display
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (activeKey) {
    const used = activeKey.usedCredits || 0;
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

function renderFreebeatKeysList() {
  els.freebeatKeysListContainer.innerHTML = '';
  
  if (state.freebeatKeys.length === 0) {
    els.freebeatKeysListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 16px 0;">Belum ada API Key. Tambahkan di bawah.</div>';
    return;
  }
  
  state.freebeatKeys.forEach(key => {
    const item = document.createElement('div');
    item.className = 'freebeat-key-item';
    
    const masked = key.key.length > 15 
      ? `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 6)}` 
      : '***';
    
    const isActive = (key.id === state.activeFreebeatKeyId);
    const activeBadge = isActive ? '<span class="freebeat-key-active-badge">Aktif</span>' : '';
    const used = key.usedCredits || 0;
    const hasBalance = (key.balance !== undefined && key.balance !== null);
    const balanceSpan = hasBalance ? `<span><i class="fa-solid fa-wallet" style="color: var(--text-muted); margin-right: 4px;"></i>Sisa: <strong>${key.balance}</strong> Credits</span>` : '';
    
    item.innerHTML = `
      <div class="freebeat-key-info">
        <div class="freebeat-key-label-row">
          <span class="freebeat-key-label">${key.label}</span>
          ${activeBadge}
        </div>
        <span class="freebeat-key-masked">${masked}</span>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; gap: 12px;">
          <span><i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-gold); margin-right: 4px;"></i>Terpakai: <strong>${used}</strong> Credits</span>
          ${balanceSpan}
        </div>
      </div>
      <div class="freebeat-key-actions">
        <button class="btn-delete-key" data-id="${key.id}" title="Hapus API Key"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    
    item.querySelector('.btn-delete-key').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const keyId = btn.getAttribute('data-id');
      handleDeleteFreebeatKey(keyId);
    });
    
    els.freebeatKeysListContainer.appendChild(item);
  });
}

function handleAddFreebeatKey() {
  const label = els.newFreebeatKeyLabel.value.trim();
  const keyVal = els.newFreebeatKeyVal.value.trim();
  
  if (!label || !keyVal) {
    showToast('Semua field wajib diisi!', 'error');
    return;
  }
  
  const newId = 'fb_' + Date.now().toString();
  const newKey = {
    id: newId,
    label: label,
    key: keyVal,
    balance: null,
    usedCredits: 0
  };
  
  state.freebeatKeys.push(newKey);
  
  // Set as active if it's the first key
  if (state.freebeatKeys.length === 1) {
    state.activeFreebeatKeyId = newId;
  }
  
  // Reset fields
  els.newFreebeatKeyLabel.value = '';
  els.newFreebeatKeyVal.value = '';
  
  saveFreebeatKeys();
  renderFreebeatKeySelect();
  renderFreebeatKeysList();
  showToast('API Key Freebeat berhasil ditambahkan!', 'success');
  
  autoDetectFreebeatBalance();
}

function handleDeleteFreebeatKey(keyId) {
  state.freebeatKeys = state.freebeatKeys.filter(k => k.id !== keyId);
  
  if (state.activeFreebeatKeyId === keyId) {
    state.activeFreebeatKeyId = state.freebeatKeys.length > 0 ? state.freebeatKeys[0].id : '';
  }
  
  saveFreebeatKeys();
  renderFreebeatKeySelect();
  renderFreebeatKeysList();
  showToast('API Key berhasil dihapus.', 'info');
}

function handleEditKeyBalance(keyId, newBalance) {
  const key = state.freebeatKeys.find(k => k.id === keyId);
  if (key) {
    key.balance = newBalance;
    saveFreebeatKeys();
    renderFreebeatKeySelect();
    showToast(`Balance "${key.label}" diperbarui menjadi ${newBalance} credits.`, 'success');
  }
}

function handleSelectFreebeatKey() {
  state.activeFreebeatKeyId = els.freebeatKeySelect.value;
  saveFreebeatKeys();
  renderFreebeatKeySelect();
  renderFreebeatKeysList();
  showToast('API Key Aktif diganti.', 'info');
  
  autoDetectFreebeatBalance();
}

function openFreebeatKeysModal() {
  els.freebeatKeysModal.style.display = 'flex';
  // Trigger reflow
  els.freebeatKeysModal.offsetHeight;
  els.freebeatKeysModal.classList.add('active');
  renderFreebeatKeysList();
}

function closeFreebeatKeysModal() {
  els.freebeatKeysModal.classList.remove('active');
  setTimeout(() => {
    if (!els.freebeatKeysModal.classList.contains('active')) {
      els.freebeatKeysModal.style.display = 'none';
    }
  }, 250);
}

// Dynamic Duration and Credit Cost Auto-detection
function updateDurationOptionsAndCost() {
  const modelId = els.freebeatModelSelect.value;
  const config = modelConfigs[modelId];
  if (!config) return;
  
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
  
  updateEstimatedCostUI();
}

function updateEstimatedCostUI() {
  const modelId = els.freebeatModelSelect.value;
  const duration = parseInt(els.freebeatDuration.value, 10) || 5;
  const resolution = els.freebeatResolution.value || '720p';
  const cost = getEstimatedCreditCost(modelId, duration, resolution);
  
  const costDisplay = document.getElementById('freebeat-estimated-cost');
  if (costDisplay) {
    costDisplay.textContent = `${cost} Credits`;
  }
}

// Freebeat Video Studio API helpers
function getEstimatedCreditCost(modelId, duration, resolution) {
  const config = modelConfigs[modelId];
  if (config) {
    return config.getCost(parseInt(duration, 10) || 5, resolution || '720p');
  }
  return 10;
}

function getModelDisplayName(modelId) {
  const modelMap = {
    '94': 'Pixverse V6',
    '103': 'Pixverse C1',
    '104': 'Wan V2.7',
    '102': 'SeedDance 2.0',
    '101': 'SeedDance 2.0 Fast',
    '112': 'Kling V3 4K',
    '56': 'Sora 2 Pro',
    '111': 'HappyHorse'
  };
  return modelMap[modelId] || `Model ${modelId}`;
}

// Freebeat Video History functions
function loadFreebeatHistory() {
  try {
    const saved = localStorage.getItem('freebeat_history');
    if (saved) {
      state.freebeatHistory = JSON.parse(saved);
      
      // Resume polling for any unfinished tasks
      const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
      if (activeKey) {
        state.freebeatHistory.forEach(item => {
          if (item.status === 'processing') {
            const cost = getEstimatedCreditCost(item.modelId, item.duration, item.resolution);
            startFreebeatVideoPolling(item.id, activeKey, cost);
          }
        });
      }
    } else {
      state.freebeatHistory = [];
    }
    renderFreebeatHistory();
  } catch (err) {
    console.error('Error loading history:', err);
    state.freebeatHistory = [];
  }
}

function saveFreebeatHistory() {
  localStorage.setItem('freebeat_history', JSON.stringify(state.freebeatHistory));
}

function renderFreebeatHistory() {
  if (!els.freebeatHistoryList) return;
  els.freebeatHistoryList.innerHTML = '';
  
  if (state.freebeatHistory.length === 0) {
    els.freebeatHistoryList.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px 0;">Belum ada riwayat generate video.</div>';
    return;
  }
  
  // Sort history: newest first
  const sorted = [...state.freebeatHistory].sort((a, b) => b.timestamp - a.timestamp);
  
  sorted.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.gap = '8px';
    row.style.padding = '12px';
    row.style.background = 'var(--bg-darker)';
    row.style.border = '1px solid var(--border-color)';
    row.style.borderRadius = 'var(--radius-sm)';
    row.style.fontSize = '12px';
    row.style.marginBottom = '8px';
    
    // Status Badge
    let statusBadge = '';
    if (item.status === 'success') {
      statusBadge = '<span style="color: var(--accent-green); background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 10px;">SUCCESS</span>';
    } else if (item.status === 'failed') {
      statusBadge = '<span style="color: var(--accent-red); background: rgba(239,68,68,0.1); padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 10px;">FAILED</span>';
    } else {
      statusBadge = '<span style="color: var(--accent-gold); background: rgba(251,191,36,0.1); padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 10px;">PROCESSING</span>';
    }
    
    const modelName = getModelDisplayName(item.modelId);
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    
    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <strong style="color: var(--text-primary); font-size: 13px;">${item.recipeTitle}</strong>
          <span style="color: var(--text-muted); font-size: 11px;">${modelName} • ${item.duration}s • ${item.aspectRatio} • ${dateStr}</span>
        </div>
        <div>${statusBadge}</div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 4px;">
        <div style="display: flex; gap: 8px;">
          ${item.status === 'success' ? `
            <button class="btn-play-history" data-url="${item.videoUrl}" style="background: none; border: none; color: var(--accent-gold); cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 2px 6px; font-size: 11px; font-weight: 600;">
              <i class="fa-solid fa-play"></i> Putar Video
            </button>
          ` : ''}
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-regen-history" data-id="${item.id}" style="background: none; border: none; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 2px 6px; font-size: 11px;">
            <i class="fa-solid fa-rotate-right"></i> Regenerate
          </button>
          <button class="btn-delete-history" data-id="${item.id}" style="background: none; border: none; color: var(--accent-red); cursor: pointer; padding: 2px;" title="Hapus dari riwayat">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    if (item.status === 'success') {
      row.querySelector('.btn-play-history').addEventListener('click', (e) => {
        showFreebeatVideoPlayer(item.recipeTitle, e.currentTarget.getAttribute('data-url'));
      });
    }
    
    row.querySelector('.btn-regen-history').addEventListener('click', () => {
      handleRegenerateFromHistory(item);
    });
    
    row.querySelector('.btn-delete-history').addEventListener('click', () => {
      handleDeleteHistoryItem(item.id);
    });
    
    els.freebeatHistoryList.appendChild(row);
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
  
  // Trigger generation automatically
  handleGenerateFreebeatVideo();
}

function handleDeleteHistoryItem(id) {
  // Clear interval if polling is still active
  if (state.freebeatVideoIntervals[id]) {
    clearInterval(state.freebeatVideoIntervals[id]);
    delete state.freebeatVideoIntervals[id];
  }
  
  state.freebeatHistory = state.freebeatHistory.filter(item => item.id !== id);
  saveFreebeatHistory();
  renderFreebeatHistory();
  showToast('Item riwayat dihapus.', 'info');
}

function clearFreebeatHistory() {
  if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat generate video?')) {
    // Clear all polling intervals
    Object.keys(state.freebeatVideoIntervals).forEach(id => {
      clearInterval(state.freebeatVideoIntervals[id]);
    });
    state.freebeatVideoIntervals = {};
    
    state.freebeatHistory = [];
    saveFreebeatHistory();
    renderFreebeatHistory();
    showToast('Seluruh riwayat berhasil dibersihkan.', 'info');
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
  
  const estimatedCost = getEstimatedCreditCost(modelId, duration, resolution);
  if (activeKey.balance !== null && activeKey.balance !== undefined && activeKey.balance < estimatedCost) {
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
  
  els.freebeatVideoLoaderText.textContent = 'Memulai antrean render Video Studio...';
  
  // NOTE: Send watermark: false and watermark: 0 to completely disable watermark!
  const requestBody = {
    items: [
      {
        modelId: String(modelId),
        generationType: 1,
        prompt: prompt,
        duration: duration,
        resolution: resolution,
        aspectRatio: aspect_ratio,
        audio: audioValue,
        generateAudio: audioValue,
        watermark: false,
        watermarkValue: 0
      }
    ]
  };
  
  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/ai/cli/createVideoBatch',
        'Authorization': activeKey.key,
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
      throw new Error(item.message || 'Render video ditolak oleh server Freebeat.');
    }
    
    els.freebeatVideoLoaderText.textContent = 'Render video diterima! Menunggu antrean rendering...';
    showToast('Render video berhasil dibuat! Memulai polling status...', 'success');
    
    // Create new history item
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
    state.freebeatHistory.push(historyItem);
    saveFreebeatHistory();
    renderFreebeatHistory();
    
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
          'Authorization': activeKey.key,
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
      
      // Update history item status
      const historyItem = state.freebeatHistory.find(h => h.id === batchId);
      if (historyItem) {
        historyItem.status = (status === 'success' || status === 'completed' || status === 'finished') 
          ? 'success' 
          : ((status === 'failed' || status === 'rejected' || status === 'error') ? 'failed' : 'processing');
        saveFreebeatHistory();
        renderFreebeatHistory();
      }
      
      if (status === 'success' || status === 'completed' || status === 'finished') {
        clearInterval(state.freebeatVideoIntervals[batchId]);
        delete state.freebeatVideoIntervals[batchId];
        
        // Deduct actual credits or estimated cost
        const usedCredits = item.usedCredits !== undefined ? item.usedCredits : estimatedCost;
        
        // Track credit usage for this key
        activeKey.usedCredits = (activeKey.usedCredits || 0) + usedCredits;
        
        // Deduct balance conditionally if it was detected
        if (activeKey.balance !== null && activeKey.balance !== undefined) {
          activeKey.balance = Math.max(0, activeKey.balance - usedCredits);
        }
        
        saveFreebeatKeys();
        renderFreebeatKeySelect();
        renderFreebeatKeysList();
        
        // Update history item URL
        if (historyItem) {
          historyItem.videoUrl = item.videoUrl;
          saveFreebeatHistory();
          renderFreebeatHistory();
        }
        
        // Only update active main video player if this is the active generated video
        showFreebeatVideoSuccess(item.videoUrl);
      } else if (status === 'failed' || status === 'rejected' || status === 'error') {
        clearInterval(state.freebeatVideoIntervals[batchId]);
        delete state.freebeatVideoIntervals[batchId];
        
        const errorMsg = item.errorMessage || 'Proses render video di server Freebeat gagal.';
        if (historyItem) {
          historyItem.errorMsg = errorMsg;
          saveFreebeatHistory();
          renderFreebeatHistory();
        }
        
        showFreebeatVideoError(errorMsg);
      } else {
        // Update loading status
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

async function autoDetectFreebeatBalance() {
  const activeKey = state.freebeatKeys.find(k => k.id === state.activeFreebeatKeyId);
  if (!activeKey) {
    showToast('Silakan pilih atau tambahkan API Key Freebeat terlebih dahulu!', 'error');
    return;
  }
  
  const refreshBtn = els.btnRefreshFreebeatBalance;
  const icon = refreshBtn.querySelector('i');
  if (icon) {
    icon.classList.add('fa-spin');
  }
  refreshBtn.disabled = true;
  
  showToast('Menghubungi server Freebeat untuk menyinkronkan balance...', 'info');
  try {
    const response = await fetch('/proxy', {
      method: 'GET',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/credits',
        'Authorization': activeKey.key
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data.code === 200 || data.code === 0) {
            const credits = data.data.credits + (data.data.extra_credits || 0);
            activeKey.balance = credits;
            saveFreebeatKeys();
            renderFreebeatKeySelect();
            renderFreebeatKeysList();
            showToast(`Balance berhasil disinkronkan: ${credits} Credits!`, 'success');
            return;
          }
        } catch (e) {
          // Silent catch to fall back
        }
      }
    }
    
    // Probing user/info as well
    const infoResponse = await fetch('/proxy', {
      method: 'GET',
      headers: {
        'x-target-url': 'https://api.freebeatfit.com/v1/user/info',
        'Authorization': activeKey.key
      }
    });
    
    if (infoResponse.ok) {
      const text = await infoResponse.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data.code === 0 && data.data && data.data.credits !== undefined) {
            const credits = data.data.credits + (data.data.extra_credits || 0);
            activeKey.balance = credits;
            saveFreebeatKeys();
            renderFreebeatKeySelect();
            renderFreebeatKeysList();
            showToast(`Balance berhasil disinkronkan: ${credits} Credits!`, 'success');
            return;
          }
        } catch (e) {
          // Silent catch
        }
      }
    }
    
    showToast('Cek Balance: API Developer Freebeat tidak menyediakan info sisa balance. Menggunakan pelacakan manual.', 'warning');
  } catch (err) {
    console.error('Error auto detecting balance:', err);
    showToast('Gagal terhubung ke API Freebeat untuk cek balance.', 'error');
  } finally {
    if (icon) {
      icon.classList.remove('fa-spin');
    }
    refreshBtn.disabled = false;
  }
}

// Start application
window.onload = init;
