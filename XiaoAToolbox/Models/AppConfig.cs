namespace XiaoAToolbox.Models;

public class AppConfig
{
    public string Theme { get; set; } = "auto";
    public string Language { get; set; } = "zh-CN";
    public string OutputDirectory { get; set; } = "";
    public bool CheckUpdates { get; set; } = false;
    public bool NotifyOnComplete { get; set; } = true;
}
