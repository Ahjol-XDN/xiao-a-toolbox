using System.Collections.ObjectModel;
using System.Windows.Input;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class MainViewModel : ObservableObject
{
    private ObservableObject? _currentPage;
    public ObservableObject? CurrentPage
    {
        get => _currentPage;
        set => SetProperty(ref _currentPage, value);
    }

    private string _currentNav = "视频处理";
    public string CurrentNav
    {
        get => _currentNav;
        set
        {
            if (SetProperty(ref _currentNav, value))
            {
                Navigate(value);
            }
        }
    }

    public ObservableCollection<NavItem> NavItems { get; } = new();

    public ICommand NavigateCommand { get; }

    public VideoViewModel VideoVM { get; }
    public VideoViewModel VideoToAudioVM { get; }
    public AudioViewModel AudioVM { get; }
    public DocumentViewModel DocumentVM { get; }
    public ImageViewModel ImageVM { get; }
    public PdfViewModel PdfVM { get; }
    public BatchViewModel BatchVM { get; }
    public SettingsViewModel SettingsVM { get; }
    public AboutViewModel AboutVM { get; }

    public MainViewModel()
    {
        VideoVM = new VideoViewModel();
        VideoToAudioVM = new VideoViewModel { ForceMode = "extract-audio" };
        AudioVM = new AudioViewModel();
        DocumentVM = new DocumentViewModel();
        ImageVM = new ImageViewModel();
        PdfVM = new PdfViewModel();
        BatchVM = new BatchViewModel();
        SettingsVM = new SettingsViewModel();
        AboutVM = new AboutViewModel();

        NavigateCommand = new RelayCommand<string>(nav =>
        {
            if (nav != null) CurrentNav = nav;
        });

        NavItems.Add(new NavItem { Key = "NavVideo", Icon = "🎬", PageName = "视频处理" });
        NavItems.Add(new NavItem { Key = "NavVideoToAudio", Icon = "🎍", PageName = "视频转音频" });
        NavItems.Add(new NavItem { Key = "NavAudio", Icon = "🎵", PageName = "音频处理" });
        NavItems.Add(new NavItem { Key = "NavDocument", Icon = "📫", PageName = "文档转换" });
        NavItems.Add(new NavItem { Key = "NavImage", Icon = "🖼️", PageName = "图片转换" });
        NavItems.Add(new NavItem { Key = "NavPdf", Icon = "📼", PageName = "PDF工具" });
        NavItems.Add(new NavItem { Key = "NavBatch", Icon = "📝", PageName = "批量转换" });
        NavItems.Add(new NavItem { Key = "NavSettings", Icon = "⚙️", PageName = "设置" });
        NavItems.Add(new NavItem { Key = "NavAbout", Icon = "ℹ️", PageName = "关于" });

        CurrentPage = VideoVM;
    }

    private void Navigate(string pageName)
    {
        CurrentPage = pageName switch
        {
            "视频处理" => VideoVM,
            "视频转音频" => VideoToAudioVM,
            "音频处理" => AudioVM,
            "文档转换" => DocumentVM,
            "图片转换" => ImageVM,
            "PDF工具" => PdfVM,
            "批量转换" => BatchVM,
            "设置" => SettingsVM,
            "关于" => AboutVM,
            _ => VideoVM
        };
    }
}

public class NavItem
{
    public string Key { get; set; } = "";
    public string Icon { get; set; } = "";
    public string PageName { get; set; } = "";
    public string DisplayText => LocalizationService.Instance[Key];
}
