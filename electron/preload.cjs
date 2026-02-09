const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Data operations
  dataList: (entityType, sortBy, limit) =>
    ipcRenderer.invoke('data:list', entityType, sortBy, limit),

  dataFilter: (entityType, filters, sortBy, limit) =>
    ipcRenderer.invoke('data:filter', entityType, filters, sortBy, limit),

  dataCreate: (entityType, data) =>
    ipcRenderer.invoke('data:create', entityType, data),

  dataUpdate: (entityType, id, data) =>
    ipcRenderer.invoke('data:update', entityType, id, data),

  dataDelete: (entityType, id) =>
    ipcRenderer.invoke('data:delete', entityType, id),

  // File operations
  fileUpload: (fileBuffer, fileName) =>
    ipcRenderer.invoke('file:upload', fileBuffer, fileName),

  // LLM operations
  llmInvoke: (prompt, context) =>
    ipcRenderer.invoke('llm:invoke', prompt, context),
});
