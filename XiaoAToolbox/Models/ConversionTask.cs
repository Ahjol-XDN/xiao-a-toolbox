namespace XiaoAToolbox.Models;

public class ConversionTask
{
    public string InputPath { get; set; } = "";
    public string OutputPath { get; set; } = "";
    public string OutputFormat { get; set; } = "";
    public Dictionary<string, string> Parameters { get; set; } = new();
    public string? EngineType { get; set; }  // "ffmpeg", "pandoc", "pdf"
    public string? Operation { get; set; }    // "convert", "merge", "split"
}
