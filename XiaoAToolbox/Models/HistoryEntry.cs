namespace XiaoAToolbox.Models;

public class HistoryEntry
{
    public DateTime Timestamp { get; set; }
    public string InputFile { get; set; } = "";
    public string OutputFile { get; set; } = "";
    public string Operation { get; set; } = "";
    public string Format { get; set; } = "";
    public bool Success { get; set; }
    public string? Error { get; set; }
}
