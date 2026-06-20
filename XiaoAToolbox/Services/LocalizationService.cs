using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;

namespace XiaoAToolbox.Services;

public class LocalizationService : INotifyPropertyChanged
{
    private static LocalizationService? _instance;
    public static LocalizationService Instance => _instance ??= new LocalizationService();

    private CultureInfo _culture = CultureInfo.GetCultureInfo("zh-CN");
    public CultureInfo Culture
    {
        get => _culture;
        set { _culture = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsChinese)); }
    }

    public bool IsChinese => _culture.Name == "zh-CN";

    public event PropertyChangedEventHandler? PropertyChanged;

    public void SetLanguage(string lang)
    {
        Culture = CultureInfo.GetCultureInfo(lang);
    }

    public string Get(string key)
    {
        if (_culture.Name == "zh-CN")
            return zhCN.GetValueOrDefault(key, key);
        else
            return enUS.GetValueOrDefault(key, key);
    }

    public string this[string key] => Get(key);

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }

    private static readonly Dictionary<string, string> zhCN = new()
    {
        ["AppTitle"] = "小A万能转换工具箱 2.1",
        ["NavVideo"] = "视频处理",
        ["NavVideoToAudio"] = "视频转音频",
        ["NavAudio"] = "音频处理",
        ["NavDocument"] = "文档转换",
        ["NavImage"] = "图片转换",
        ["NavPdf"] = "PDF工具",
        ["NavBatch"] = "批量转换",
        ["NavSettings"] = "设置",
        ["DropHint"] = "释放文件以添加",
        ["DropOrClick"] = "拖拽文件到此处，或点击选择",
        ["SelectFiles"] = "选择文件",
        ["ClearFiles"] = "清空",
        ["OutputFormat"] = "输出格式",
        ["Bitrate"] = "码率",
        ["SampleRate"] = "采样率",
        ["Resolution"] = "分辨率",
        ["Quality"] = "质量",
        ["Codec"] = "编码器",
        ["CRF"] = "CRF质量",
        ["FPS"] = "帧率",
        ["StartTime"] = "开始时间",
        ["EndTime"] = "结束时间",
        ["Mode"] = "模式",
        ["ModeConvert"] = "格式转换",
        ["ModeCompress"] = "视频压缩",
        ["ModeTrim"] = "视频裁剪",
        ["ModeExtractAudio"] = "提取音频",
        ["ModeGif"] = "转GIF",
        ["ModeScreenshot"] = "视频截图",
        ["StartConvert"] = "开始转换",
        ["Converting"] = "转换中...",
        ["Success"] = "成功",
        ["Failed"] = "失败",
        ["OutputDir"] = "输出目录",
        ["Browse"] = "浏览...",
        ["Theme"] = "主题",
        ["ThemeAuto"] = "跟随系统",
        ["ThemeLight"] = "浅色",
        ["ThemeDark"] = "深色",
        ["Language"] = "语言",
        ["LangChinese"] = "中文",
        ["LangEnglish"] = "English",
        ["DefaultOutputDir"] = "默认输出目录",
        ["FileCount"] = "已添加 {0} 个文件",
        ["NoFiles"] = "请先添加文件",
        ["NoOutput"] = "请先选择输出格式",
        ["NoEngine"] = "引擎未安装",
        ["EstimatedSize"] = "预估大小",
        ["FileInfo"] = "文件信息",
        ["Duration"] = "时长",
        ["History"] = "转换历史",
        ["ClearHistory"] = "清空历史",
        ["NoHistory"] = "暂无转换记录",
        ["Complete"] = "转换完成",
        ["CompleteMsg"] = "成功 {0} 个，失败 {1} 个",
        ["Cancel"] = "取消",
        ["ToGif"] = "GIF 设置",
        ["ToScreenshot"] = "截图设置",
        ["ScreenshotTime"] = "截图时间点",
        ["PdfMerge"] = "PDF 合并",
        ["PdfSplit"] = "PDF 拆分",
        ["PageRanges"] = "页码范围（逗号分隔，如: 1-3,5-7）",
        ["AudioMerge"] = "音频合并",
        ["AudioTrim"] = "音频裁剪",
        ["TocInclude"] = "包含目录",
        ["ImageSize"] = "图片尺寸",
        ["NotifyComplete"] = "完成时通知",
        ["Settings"] = "设置",
        ["About"] = "关于",
        ["AboutText"] = "小A万能转换工具箱 2.1\n完全本地运行的文件格式转换工具\n基于 .NET 8 WPF 构建",
    };

    private static readonly Dictionary<string, string> enUS = new()
    {
        ["AppTitle"] = "XiaoA Toolbox 2.1",
        ["NavVideo"] = "Video",
        ["NavVideoToAudio"] = "Video to Audio",
        ["NavAudio"] = "Audio",
        ["NavDocument"] = "Document",
        ["NavImage"] = "Image",
        ["NavPdf"] = "PDF Tools",
        ["NavBatch"] = "Batch",
        ["NavSettings"] = "Settings",
        ["DropHint"] = "Drop files to add",
        ["DropOrClick"] = "Drag and drop files here, or click to select",
        ["SelectFiles"] = "Select Files",
        ["ClearFiles"] = "Clear",
        ["OutputFormat"] = "Output Format",
        ["Bitrate"] = "Bitrate",
        ["SampleRate"] = "Sample Rate",
        ["Resolution"] = "Resolution",
        ["Quality"] = "Quality",
        ["Codec"] = "Codec",
        ["CRF"] = "CRF Quality",
        ["FPS"] = "Frame Rate",
        ["StartTime"] = "Start Time",
        ["EndTime"] = "End Time",
        ["Mode"] = "Mode",
        ["ModeConvert"] = "Convert",
        ["ModeCompress"] = "Compress",
        ["ModeTrim"] = "Trim",
        ["ModeExtractAudio"] = "Extract Audio",
        ["ModeGif"] = "To GIF",
        ["ModeScreenshot"] = "Screenshot",
        ["StartConvert"] = "Start Convert",
        ["Converting"] = "Converting...",
        ["Success"] = "Success",
        ["Failed"] = "Failed",
        ["OutputDir"] = "Output Directory",
        ["Browse"] = "Browse...",
        ["Theme"] = "Theme",
        ["ThemeAuto"] = "System",
        ["ThemeLight"] = "Light",
        ["ThemeDark"] = "Dark",
        ["Language"] = "Language",
        ["LangChinese"] = "中文",
        ["LangEnglish"] = "English",
        ["DefaultOutputDir"] = "Default Output Directory",
        ["FileCount"] = "{0} file(s) added",
        ["NoFiles"] = "Please add files first",
        ["NoOutput"] = "Please select output format",
        ["NoEngine"] = "Engine not installed",
        ["EstimatedSize"] = "Estimated Size",
        ["FileInfo"] = "File Info",
        ["Duration"] = "Duration",
        ["History"] = "Conversion History",
        ["ClearHistory"] = "Clear History",
        ["NoHistory"] = "No conversion records",
        ["Complete"] = "Conversion Complete",
        ["CompleteMsg"] = "{0} succeeded, {1} failed",
        ["Cancel"] = "Cancel",
        ["ToGif"] = "GIF Settings",
        ["ToScreenshot"] = "Screenshot Settings",
        ["ScreenshotTime"] = "Screenshot Time",
        ["PdfMerge"] = "PDF Merge",
        ["PdfSplit"] = "PDF Split",
        ["PageRanges"] = "Page ranges (comma separated, e.g.: 1-3,5-7)",
        ["AudioMerge"] = "Audio Merge",
        ["AudioTrim"] = "Audio Trim",
        ["TocInclude"] = "Include TOC",
        ["ImageSize"] = "Image Size",
        ["NotifyComplete"] = "Notify on Complete",
        ["Settings"] = "Settings",
        ["About"] = "About",
        ["AboutText"] = "XiaoA Toolbox 2.1\n100% local file format conversion tool\nBuilt with .NET 8 WPF",
    };
}
