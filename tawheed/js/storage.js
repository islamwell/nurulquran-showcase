// LocalStorage Manager for Tawheed App with fallback memory cache
const STORAGE_KEYS = {
  BOOKMARKS: 'tawheed_bookmarks',
  LEARNED: 'tawheed_learned',
  NOTES: 'tawheed_notes',
  QUIZ: 'tawheed_quiz',
  SETTINGS: 'tawheed_settings'
};

const memoryStore = {};

const safeStorage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return memoryStore[key] || null;
  },
  setItem(key, val) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {}
    memoryStore[key] = val;
  }
};

export const Storage = {
  getBookmarks() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.BOOKMARKS)) || [];
    } catch {
      return [];
    }
  },
  toggleBookmark(id) {
    const list = this.getBookmarks();
    const idx = list.indexOf(id);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(id);
    }
    safeStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
    return list.includes(id);
  },
  isBookmarked(id) {
    return this.getBookmarks().includes(id);
  },

  getLearned() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.LEARNED)) || [];
    } catch {
      return [];
    }
  },
  toggleLearned(id) {
    const list = this.getLearned();
    const idx = list.indexOf(id);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(id);
    }
    safeStorage.setItem(STORAGE_KEYS.LEARNED, JSON.stringify(list));
    return list.includes(id);
  },
  isLearned(id) {
    return this.getLearned().includes(id);
  },

  getNote(id) {
    try {
      const notes = JSON.parse(safeStorage.getItem(STORAGE_KEYS.NOTES)) || {};
      return notes[id] || '';
    } catch {
      return '';
    }
  },
  saveNote(id, text) {
    try {
      const notes = JSON.parse(safeStorage.getItem(STORAGE_KEYS.NOTES)) || {};
      notes[id] = text;
      safeStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save note', e);
    }
  },



  getQuizStats() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.QUIZ)) || { bestStreak: 0, totalQuestions: 0, correctAnswers: 0 };
    } catch {
      return { bestStreak: 0, totalQuestions: 0, correctAnswers: 0 };
    }
  },
  saveQuizStats(stats) {
    safeStorage.setItem(STORAGE_KEYS.QUIZ, JSON.stringify(stats));
  },

  getSettings() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.SETTINGS)) || { theme: 'midnight', fontSize: 'large' };
    } catch {
      return { theme: 'midnight', fontSize: 'large' };
    }
  },
  saveSettings(settings) {
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
