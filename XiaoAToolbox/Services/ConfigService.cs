using System.Text.Json;
using XiaoAToolbox.Models;

namespace XiaoAToolbox.Services;

public class ConfigService
{
    private static readonly string ConfigDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "XiaoAToolbox");
    private static readonly string ConfigPath = Path.Combine(ConfigDir, "config.json");
    private AppConfig? _cache;

    public AppConfig Load()
    {
        if (_cache != null) return _cache;
        try
        {
            Directory.CreateDirectory(ConfigDir);
            if (File.Exists(ConfigPath))
            {
                var json = File.ReadAllText(ConfigPath);
                _cache = JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
            }
            else
            {
                _cache = new AppConfig();
                Save(_cache);
            }
        }
        catch
        {
            _cache = new AppConfig();
        }
        return _cache;
    }

    public void Save(AppConfig config)
    {
        try
        {
            Directory.CreateDirectory(ConfigDir);
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(ConfigPath, json);
            _cache = config;
        }
        catch { }
    }

    public void Set(string key, object value)
    {
        var cfg = Load();
        var prop = typeof(AppConfig).GetProperty(key);
        if (prop != null)
        {
            prop.SetValue(cfg, Convert.ChangeType(value, prop.PropertyType));
            Save(cfg);
        }
    }

    public object? Get(string key)
    {
        var cfg = Load();
        return typeof(AppConfig).GetProperty(key)?.GetValue(cfg);
    }
}
