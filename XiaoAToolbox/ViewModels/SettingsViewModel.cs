using System.Collections.ObjectModel;
using System.Windows.Input;
using Microsoft.Win32;
using XiaoAToolbox.Models;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class SettingsViewModel : ObservableObject
{
    private readonly ConfigService _config = new();
    private readonly HistoryService _history = new();
    private AppConfig _cfg;

    private string _theme;
    public string Theme { get => _theme; set { if (SetProperty(ref _theme, value)) ApplySetting(nameof(Theme), value); } }

    private string _language;
    public string Language { get => _language; set { if (SetProperty(ref _language, value)) ApplySetting(nameof(Language), value); } }

    private string _outputDir;
    public string OutputDir { get => _outputDir; set { if (SetProperty(ref _outputDir, value)) ApplySetting("OutputDirectory", value); } }

    private bool _notifyComplete;
    public bool NotifyComplete { get => _notifyComplete; set { if (SetProperty(ref _notifyComplete, value)) ApplySetting(nameof(NotifyComplete), value); } }

    public ObservableCollection<HistoryEntry> HistoryList { get; } = new();

    public ICommand BrowseOutputCommand { get; }
    public ICommand ClearHistoryCommand { get; }

    public SettingsViewModel()
    {
        _cfg = _config.Load();
        _theme = _cfg.Theme;
        _language = _cfg.Language;
        _outputDir = _cfg.OutputDirectory;
        _notifyComplete = _cfg.NotifyOnComplete;

        BrowseOutputCommand = new RelayCommand(BrowseOutput);
        ClearHistoryCommand = new RelayCommand(ClearHistory);

        RefreshHistory();
    }

    private void ApplySetting(string key, object value)
    {
        _config.Set(key, value);

        if (key == nameof(AppConfig.Language))
        {
            LocalizationService.Instance.SetLanguage(value.ToString()!);
        }
        else if (key == nameof(AppConfig.Theme))
        {
            ApplyTheme(value.ToString()!);
        }
    }

    private void ApplyTheme(string theme)
    {
        var app = System.Windows.Application.Current;
        var themeDict = theme switch
        {
            "dark" => "Themes/DarkTheme.xaml",
            "light" => "Themes/LightTheme.xaml",
            _ => null
        };

        if (themeDict != null)
        {
            var rd = new System.Windows.ResourceDictionary { Source = new Uri(themeDict, UriKind.Relative) };
            app.Resources.MergedDictionaries.Clear();
            app.Resources.MergedDictionaries.Add(rd);
        }
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "閫夋嫨榛樿杈撳嚭鐩綍" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    private void ClearHistory()
    {
        _history.Clear();
        RefreshHistory();
    }

    public void RefreshHistory()
    {
        HistoryList.Clear();
        foreach (var entry in _history.Load())
            HistoryList.Add(entry);
    }
}
