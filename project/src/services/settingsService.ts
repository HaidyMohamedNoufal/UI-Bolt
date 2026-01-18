const SETTINGS_KEY = 'ecm_app_settings';

interface AppSettings {
  enableDocumentPermissionsScreen: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  enableDocumentPermissionsScreen: false,
};

export const settingsService = {
  getSettings(): AppSettings {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  },

  saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  isDocumentPermissionsEnabled(): boolean {
    return this.getSettings().enableDocumentPermissionsScreen;
  },
};
