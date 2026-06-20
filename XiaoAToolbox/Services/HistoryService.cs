using System.Text.Json;
using XiaoAToolbox.Models;

namespace XiaoAToolbox.Services;

public class HistoryService
{
    private static readonly string HistoryDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "XiaoAToolbox");
    private static readonly string HistoryPath = Path.Combine(HistoryDir, "history.json");

    public List<HistoryEntry> Load()
    {
        try
        {
            if (File.Exists(HistoryPath))
            {
                var json = File.ReadAllText(HistoryPath);
                return JsonSerializer.Deserialize<List<HistoryEntry>>(json) ?? new();
            }
        }
        catch { }
        return new();
    }

    public void Add(HistoryEntry entry)
    {
        var entries = Load();
        entries.Insert(0, entry);
        if (entries.Count > 100) entries.RemoveRange(100, entries.Count - 100);
        Save(entries);
    }

    public void Clear()
    {
        Save(new());
    }

    private void Save(List<HistoryEntry> entries)
    {
        try
        {
            Directory.CreateDirectory(HistoryDir);
            var json = JsonSerializer.Serialize(entries, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(HistoryPath, json);
        }
        catch { }
    }
}
