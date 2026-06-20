using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using Microsoft.Win32;
using XiaoAToolbox.Models;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class DocumentViewModel : ObservableObject
{
    private readonly PandocService _pandoc = new();
    private readonly ConfigService _config = new();
    private readonly HistoryService _history = new();

    public ObservableCollection<FileItem> Files { get; } = new();

    private string _format = "html";
    public string Format { get => _format; set => SetProperty(ref _format, value); }

    private bool _includeToc;
    public bool IncludeToc { get => _includeToc; set => SetProperty(ref _includeToc, value); }

    private bool _running;
    public bool Running { get => _running; set { SetProperty(ref _running, value); OnPropertyChanged(nameof(Inactive)); } }

    private int _progress;
    public int Progress { get => _progress; set => SetProperty(ref _progress, value); }

    private string _progressText = "";
    public string ProgressText { get => _progressText; set => SetProperty(ref _progressText, value); }

    public bool Inactive => !Running && Files.Count == 0;

    private string _outputDir = "";
    public string OutputDir { get => _outputDir; set => SetProperty(ref _outputDir, value); }

    public ICommand AddFilesCommand { get; }
    public ICommand ClearFilesCommand { get; }
    public ICommand StartCommand { get; }
    public ICommand BrowseOutputCommand { get; }

    public string StatusText => Files.Count == 0 ? "请添加文档文件" :
        !EngineService.PandocAvailable ? "Pandoc 引擎未找到" :
        $"已添加 {Files.Count} 个文件，点击开始转换";

    public DocumentViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(Clear);
        StartCommand = new RelayCommand(async () => await StartAsync());
        BrowseOutputCommand = new RelayCommand(BrowseOutput);
        _outputDir = _config.Load().OutputDirectory;
        Files.CollectionChanged += (_, _) => OnPropertyChanged(nameof(StatusText));
    }

    public void AddFile(string path)
    {
        if (!File.Exists(path) || Files.Any(f => f.Path == path)) return;
        var fi = new FileInfo(path);
        Files.Add(new FileItem { Path = path, Size = fi.Length });
        OnPropertyChanged(nameof(Inactive));
    }

    public void AddFiles()
    {
        var dlg = new OpenFileDialog { Multiselect = true, Title = "选择文档", Filter = "文档|*.docx;*.md;*.txt;*.html;*.rtf;*.epub;*.tex|全部|*.*" };
        if (dlg.ShowDialog() == true)
            foreach (var f in dlg.FileNames) AddFile(f);
    }

    private void Clear()
    {
        Files.Clear();
        Progress = 0;
        ProgressText = "";
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "选择输出目录" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    private async Task StartAsync()
    {
        if (Files.Count == 0)
        {
            MessageBox.Show("请先添加文件", "提示", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        if (!EngineService.PandocAvailable)
        {
            MessageBox.Show("未找到 Pandoc 引擎。\n请将 pandoc.exe 放到程序目录下。", "引擎缺失", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        Running = true; Progress = 0;
        var outDir = string.IsNullOrEmpty(OutputDir) ? Path.GetDirectoryName(Files[0].Path)! : OutputDir;
        Directory.CreateDirectory(outDir);
        int ok = 0, fail = 0;

        try
        {
            for (int i = 0; i < Files.Count; i++)
            {
                var file = Files[i];
                ProgressText = $"转换中... ({i + 1}/{Files.Count})";
                var output = Path.Combine(outDir, Path.GetFileNameWithoutExtension(file.Path) + $".{Format}");
                try
                {
                    var result = await _pandoc.ConvertDocumentAsync(file.Path, output, IncludeToc);
                    ok++;
                    _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = file.Path, OutputFile = result, Operation = "document", Format = Format, Success = true });
                }
                catch (Exception ex)
                {
                    fail++;
                    _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = file.Path, OutputFile = "", Operation = "document", Format = Format, Success = false, Error = ex.Message });
                }
                Progress = (i + 1) * 100 / Files.Count;
            }

            MessageBox.Show($"转换完成！\n成功: {ok}  失败: {fail}", "文档转换", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex) { MessageBox.Show(ex.Message, "错误"); }
        finally { Running = false; }
    }
}