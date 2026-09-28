import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { settingsRepository } from "../../database/repositories/projectsRepository";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useNotify } from "../../context/NotificationContext";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const { theme, setTheme } = useTheme();
  const notify = useNotify();

  useEffect(() => {
    settingsRepository.get().then(setSettings);
  }, []);

  const update = async (changes) => {
    const updated = await settingsRepository.update(changes);
    setSettings(updated);
    if (changes.theme) setTheme(changes.theme);
    notify.success("Settings saved.");
  };

  if (!settings) return null;

  return (
    <div className="page">
      <div className="page__header">
        <h1>
          <SettingsIcon size={22} /> Settings
        </h1>
        <p className="page__subtitle">Preferences are stored locally and never synced.</p>
      </div>

      <section className="panel">
        <h2 className="panel__title">Appearance</h2>
        <div className="form-field">
          <label>Theme</label>
          <select value={theme} onChange={(e) => update({ theme: e.target.value })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Defaults</h2>
        <div className="form-field">
          <label>Default bit depth</label>
          <select value={settings.defaultBitDepth} onChange={(e) => update({ defaultBitDepth: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((bd) => (
              <option key={bd} value={bd}>
                {bd}-bit
              </option>
            ))}
          </select>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={settings.autoSave} onChange={(e) => update({ autoSave: e.target.checked })} />
          Auto-save drafts
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={settings.confirmDelete} onChange={(e) => update({ confirmDelete: e.target.checked })} />
          Confirm before deleting
        </label>
      </section>

      <section className="panel">
        <h2 className="panel__title">Privacy</h2>
        <p>Your media and secrets stay on this device. Firebase is used only for account authentication.</p>
      </section>
    </div>
  );
}
