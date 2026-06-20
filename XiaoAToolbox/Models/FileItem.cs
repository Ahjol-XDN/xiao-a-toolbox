namespace XiaoAToolbox.Models;

public class FileItem
{
    public string Path { get; set; } = "";
    public string Name => System.IO.Path.GetFileName(Path);
    public string Extension => System.IO.Path.GetExtension(Path).ToLowerInvariant();
    public long Size { get; set; }
    public string SizeDisplay => FormatSize(Size);
    public string? Duration { get; set; }
    public string? Resolution { get; set; }
    public string? Bitrate { get; set; }

    private static string FormatSize(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        if (bytes < 1024 * 1024 * 1024) return $"{bytes / (1024.0 * 1024):F1} MB";
        return $"{bytes / (1024.0 * 1024 * 1024):F1} GB";
    }
}
