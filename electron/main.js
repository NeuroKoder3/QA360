import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get user data path for storing application data
const userDataPath = app.getPath('userData');
const dataDir = join(userDataPath, 'data');
const dataFile = join(dataDir, 'store.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

// Initialize data store with empty collections
async function initializeStore() {
  await ensureDataDir();
  
  if (!existsSync(dataFile)) {
    const initialData = {
      QAEvaluation: [],
      Incident: [],
      Audit: [],
      Team: [],
      Coaching: [],
      QAScorecard: [],
      AlertRule: [],
      Notification: [],
      ReportTemplate: [],
      ReportSchedule: [],
      User: []
    };
    await writeFile(dataFile, JSON.stringify(initialData, null, 2));
  }
}

// Read data store
async function readStore() {
  await ensureDataDir();
  try {
    const data = await readFile(dataFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    await initializeStore();
    return readStore();
  }
}

// Write data store
async function writeStore(data) {
  await ensureDataDir();
  await writeFile(dataFile, JSON.stringify(data, null, 2));
}

// Create main window
function createWindow() {
  const windowIcon = process.platform === 'win32'
    ? join(__dirname, '../assets/icon.ico')
    : join(__dirname, '../assets/icon.png');

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs')
    },
    icon: windowIcon
  });

  // Load the app - check if dev server is running, otherwise use built files
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Try to load from dev server, fallback to built files if server not running
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // If dev server not available, try built files
      const distPath = join(__dirname, '../dist/index.html');
      if (existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      } else {
        console.error('Neither dev server nor built files are available');
      }
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }
}

// Initialize data store when app is ready
app.whenReady().then(async () => {
  await initializeStore();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC for data operations

ipcMain.handle('data:list', async (event, entityType, sortBy = '-created_date', limit = 1000) => {
  const store = await readStore();
  let items = store[entityType] || [];
  
  // Sort items
  if (sortBy.startsWith('-')) {
    const field = sortBy.substring(1);
    items = items.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      return new Date(bVal) - new Date(aVal);
    });
  } else {
    const field = sortBy;
    items = items.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      return new Date(aVal) - new Date(bVal);
    });
  }
  
  return items.slice(0, limit);
});

ipcMain.handle('data:filter', async (event, entityType, filters, sortBy = '-created_date', limit = 1000) => {
  const store = await readStore();
  let items = store[entityType] || [];
  
  // Apply filters
  items = items.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key] === value;
    });
  });
  
  // Sort items
  if (sortBy.startsWith('-')) {
    const field = sortBy.substring(1);
    items = items.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      return new Date(bVal) - new Date(aVal);
    });
  } else {
    const field = sortBy;
    items = items.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      return new Date(aVal) - new Date(bVal);
    });
  }
  
  return items.slice(0, limit);
});

ipcMain.handle('data:create', async (event, entityType, data) => {
  const store = await readStore();
  const id = `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newItem = {
    id,
    ...data,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  };
  
  if (!store[entityType]) {
    store[entityType] = [];
  }
  store[entityType].push(newItem);
  await writeStore(store);
  
  return newItem;
});

ipcMain.handle('data:update', async (event, entityType, id, data) => {
  const store = await readStore();
  if (!store[entityType]) {
    throw new Error(`Entity type ${entityType} not found`);
  }
  
  const index = store[entityType].findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Item with id ${id} not found`);
  }
  
  store[entityType][index] = {
    ...store[entityType][index],
    ...data,
    updated_date: new Date().toISOString()
  };
  
  await writeStore(store);
  return store[entityType][index];
});

ipcMain.handle('data:delete', async (event, entityType, id) => {
  const store = await readStore();
  if (!store[entityType]) {
    throw new Error(`Entity type ${entityType} not found`);
  }
  
  const index = store[entityType].findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Item with id ${id} not found`);
  }
  
  store[entityType].splice(index, 1);
  await writeStore(store);
  return true;
});

// Handle file operations
ipcMain.handle('file:upload', async (event, fileData, fileName) => {
  const uploadsDir = join(dataDir, 'uploads');
  await ensureDataDir();
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
  
  const filePath = join(uploadsDir, `${Date.now()}_${fileName}`);
  // Convert Uint8Array to Buffer if needed
  const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
  await writeFile(filePath, buffer);
  
  return {
    file_url: `file://${filePath}`,
    file_path: filePath
  };
});

// Handle LLM integration (placeholder - returns mock data for offline use)
ipcMain.handle('llm:invoke', async (event, prompt, context) => {
  // For offline mode, return a simple response
  // In production, you might want to integrate with a local LLM
  return {
    response: `AI Analysis: Based on the provided context, this is a mock response for offline mode. To enable actual AI features, configure a local LLM service.`,
    model: 'offline-mode'
  };
});