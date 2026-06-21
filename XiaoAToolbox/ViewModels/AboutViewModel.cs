using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class AboutViewModel : ObservableObject
{
    public string Version => "2.1.2";
    public string Description => "本项目基于 FFmpeg 和 Pandoc";
    public string TechStack => "使用 .NET 8 WPF 构建";
}
