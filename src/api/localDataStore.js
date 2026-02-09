// Local data store API that replaces base44 SDK
// This provides the same interface for seamless replacement

class LocalDataStore {
  constructor() {
    this.electronAPI = window.electronAPI;
  }

  // Check if running in Electron
  isElectron() {
    return !!this.electronAPI;
  }

  // Entity operations
  entities = {
    QAEvaluation: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('QAEvaluation', sortBy, limit);
        }
        return this.getFromLocalStorage('QAEvaluation', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('QAEvaluation', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('QAEvaluation', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('QAEvaluation', data);
        }
        return this.saveToLocalStorage('QAEvaluation', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('QAEvaluation', id, data);
        }
        return this.updateInLocalStorage('QAEvaluation', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('QAEvaluation', id);
        }
        return this.deleteFromLocalStorage('QAEvaluation', id);
      }
    },
    Incident: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('Incident', sortBy, limit);
        }
        return this.getFromLocalStorage('Incident', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('Incident', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('Incident', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('Incident', data);
        }
        return this.saveToLocalStorage('Incident', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('Incident', id, data);
        }
        return this.updateInLocalStorage('Incident', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('Incident', id);
        }
        return this.deleteFromLocalStorage('Incident', id);
      }
    },
    Audit: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('Audit', sortBy, limit);
        }
        return this.getFromLocalStorage('Audit', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('Audit', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('Audit', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('Audit', data);
        }
        return this.saveToLocalStorage('Audit', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('Audit', id, data);
        }
        return this.updateInLocalStorage('Audit', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('Audit', id);
        }
        return this.deleteFromLocalStorage('Audit', id);
      }
    },
    Team: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('Team', sortBy, limit);
        }
        return this.getFromLocalStorage('Team', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('Team', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('Team', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('Team', data);
        }
        return this.saveToLocalStorage('Team', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('Team', id, data);
        }
        return this.updateInLocalStorage('Team', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('Team', id);
        }
        return this.deleteFromLocalStorage('Team', id);
      }
    },
    Coaching: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('Coaching', sortBy, limit);
        }
        return this.getFromLocalStorage('Coaching', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('Coaching', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('Coaching', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('Coaching', data);
        }
        return this.saveToLocalStorage('Coaching', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('Coaching', id, data);
        }
        return this.updateInLocalStorage('Coaching', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('Coaching', id);
        }
        return this.deleteFromLocalStorage('Coaching', id);
      }
    },
    QAScorecard: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('QAScorecard', sortBy, limit);
        }
        return this.getFromLocalStorage('QAScorecard', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('QAScorecard', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('QAScorecard', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('QAScorecard', data);
        }
        return this.saveToLocalStorage('QAScorecard', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('QAScorecard', id, data);
        }
        return this.updateInLocalStorage('QAScorecard', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('QAScorecard', id);
        }
        return this.deleteFromLocalStorage('QAScorecard', id);
      }
    },
    AlertRule: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('AlertRule', sortBy, limit);
        }
        return this.getFromLocalStorage('AlertRule', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('AlertRule', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('AlertRule', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('AlertRule', data);
        }
        return this.saveToLocalStorage('AlertRule', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('AlertRule', id, data);
        }
        return this.updateInLocalStorage('AlertRule', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('AlertRule', id);
        }
        return this.deleteFromLocalStorage('AlertRule', id);
      }
    },
    Notification: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('Notification', sortBy, limit);
        }
        return this.getFromLocalStorage('Notification', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('Notification', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('Notification', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('Notification', data);
        }
        return this.saveToLocalStorage('Notification', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('Notification', id, data);
        }
        return this.updateInLocalStorage('Notification', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('Notification', id);
        }
        return this.deleteFromLocalStorage('Notification', id);
      }
    },
    ReportTemplate: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('ReportTemplate', sortBy, limit);
        }
        return this.getFromLocalStorage('ReportTemplate', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('ReportTemplate', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('ReportTemplate', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('ReportTemplate', data);
        }
        return this.saveToLocalStorage('ReportTemplate', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('ReportTemplate', id, data);
        }
        return this.updateInLocalStorage('ReportTemplate', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('ReportTemplate', id);
        }
        return this.deleteFromLocalStorage('ReportTemplate', id);
      }
    },
    ReportSchedule: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('ReportSchedule', sortBy, limit);
        }
        return this.getFromLocalStorage('ReportSchedule', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('ReportSchedule', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('ReportSchedule', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('ReportSchedule', data);
        }
        return this.saveToLocalStorage('ReportSchedule', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('ReportSchedule', id, data);
        }
        return this.updateInLocalStorage('ReportSchedule', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('ReportSchedule', id);
        }
        return this.deleteFromLocalStorage('ReportSchedule', id);
      }
    },
    User: {
      list: async (sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataList('User', sortBy, limit);
        }
        return this.getFromLocalStorage('User', sortBy, limit);
      },
      filter: async (filters, sortBy = '-created_date', limit = 1000) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataFilter('User', filters, sortBy, limit);
        }
        return this.filterFromLocalStorage('User', filters, sortBy, limit);
      },
      create: async (data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataCreate('User', data);
        }
        return this.saveToLocalStorage('User', data);
      },
      update: async (id, data) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataUpdate('User', id, data);
        }
        return this.updateInLocalStorage('User', id, data);
      },
      delete: async (id) => {
        if (this.isElectron()) {
          return await this.electronAPI.dataDelete('User', id);
        }
        return this.deleteFromLocalStorage('User', id);
      }
    }
  };

  // Auth operations (simplified for offline mode)
  auth = {
    me: async () => {
      // Return default user for offline mode
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
      const defaultUser = {
        id: 'user_1',
        email: 'admin@qa360.local',
        name: 'QA360 Admin',
        role: 'admin'
      };
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
      return defaultUser;
    },
    logout: () => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
    },
    redirectToLogin: () => {
      // No-op for offline mode
    },
    updateMe: async (data) => {
      const user = await this.auth.me();
      const updated = { ...user, ...data };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    }
  };

  // Integration operations
  integrations = {
    Core: {
      InvokeLLM: async ({ prompt, context }) => {
        if (this.isElectron()) {
          return await this.electronAPI.llmInvoke(prompt, context);
        }
        // Fallback mock response for browser mode
        return {
          response: `AI Analysis: Based on the provided context, this is a mock response for offline mode.`,
          model: 'offline-mode'
        };
      },
      UploadFile: async ({ file }) => {
        if (this.isElectron()) {
          const arrayBuffer = await file.arrayBuffer();
          // Convert ArrayBuffer to Uint8Array for IPC (main process will handle Buffer conversion)
          const uint8Array = new Uint8Array(arrayBuffer);
          return await this.electronAPI.fileUpload(uint8Array, file.name);
        }
        // For browser mode, create a data URL
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              file_url: e.target.result
            });
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  // Local storage fallback methods (for browser mode)
  getFromLocalStorage(entityType, sortBy, limit) {
    const key = `qa360_${entityType}`;
    const stored = localStorage.getItem(key);
    let items = stored ? JSON.parse(stored) : [];
    
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
  }

  filterFromLocalStorage(entityType, filters, sortBy, limit) {
    let items = this.getFromLocalStorage(entityType, sortBy, limit);
    
    items = items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        return item[key] === value;
      });
    });
    
    return items;
  }

  saveToLocalStorage(entityType, data) {
    const key = `qa360_${entityType}`;
    const stored = localStorage.getItem(key);
    const items = stored ? JSON.parse(stored) : [];
    const id = `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = {
      id,
      ...data,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(key, JSON.stringify(items));
    return newItem;
  }

  updateInLocalStorage(entityType, id, data) {
    const key = `qa360_${entityType}`;
    const stored = localStorage.getItem(key);
    const items = stored ? JSON.parse(stored) : [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    items[index] = {
      ...items[index],
      ...data,
      updated_date: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(items));
    return items[index];
  }

  deleteFromLocalStorage(entityType, id) {
    const key = `qa360_${entityType}`;
    const stored = localStorage.getItem(key);
    const items = stored ? JSON.parse(stored) : [];
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  }
}

// Create singleton instance
export const localDataStore = new LocalDataStore();