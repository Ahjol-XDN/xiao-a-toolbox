using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using Microsoft.Win32;
using XiaoAToolbox.Models;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class PdfViewModel : ObservableObject
{
    private readonly PdfService _pdf = new();
    private readonly ConfigService _config = new();
    private readonly HistoryService _history = new();

    public ObservableCollection<FileItem> Files { get; } = new();

    private string _mode = "merge";
    public string Mode { get => _mode; set => SetProperty(ref _mode, value); }

    private string _pageRanges = "";
    public string PageRanges { get => _pageRanges; set => SetProperty(ref _pageRanges, value); }

    private bool _running;
    public bool Running { get => _running; set { SetProperty(ref _running, value); OnPropertyChanged(nameof(Inactive)); } }

    private string _progressText = "";
    public string ProgressText { get => _progressText; set => SetProperty(ref _progressText, value); }

    public bool Inactive => !Running && (Mode == "merge" ? Files.Count < 2 : Files.Count == 0);

    private int _okCount;
    public int OkCount { get => _okCount; set => SetProperty(ref _okCount, value); }

    private int _failCount;
    public int FailCount { get => _failCount; set => SetProperty(ref _failCount, value); }

    private string _outputDir = "";
    public string OutputDir { get => _outputDir; set => SetProperty(ref _outputDir, value); }

    public ICommand AddFilesCommand { get; }
    public ICommand ClearFilesCommand { get; }
    public ICommand StartCommand { get; }
    public ICommand BrowseOutputCommand { get; }

    public PdfViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(() => { Files.Clear(); OkCount = 0; FailCount = 0; });
        StartCommand = new RelayCommand(async () => await StartAsync(), () => !Running && Files.Count > 0);
        BrowseOutputCommand = new RelayCommand(BrowseOutput);
        _outputDir = _config.Load().OutputDirectory;
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
        var dlg = new OpenFileDialog { Multiselect = true, Title = "选择PDF文件", Filter = "PDF文件|*.pdf" };
        if (dlg.ShowDialog() == true)
            foreach (var f in dlg.FileNames) AddFile(f);
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "选择输出目录" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    private async Task StartAsync()
    {
        if (Files.Count == 0) return;
        Running = true; OkCount = 0; FailCount = 0;

        try
        {
            if (Mode == "merge")
            {
                var outDir = string.IsNullOrEmpty(OutputDir) ? Path.GetDirectoryName(Files[0].Path)! : OutputDir;
                var output = Path.Combine(outDir, $"merged_{DateTime.Now:yyyyMMddHHmmss}.pdf");
                await _pdf.MergeAsync(Files.Select(f => f.Path).ToList(), output);
                OkCount = 1;
                _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = $"{Files.Count} files", OutputFile = output, Operation = "pdf_merge", Format = "pdf", Success = true });
            }
            else
            {
                var outDir = string.IsNullOrEmpty(OutputDir) ? Path.GetDirectoryName(Files[0].Path)! : OutputDir;
                var ranges = ParseRanges(PageRanges);
                var results = await _pdf.SplitAsync(Files[0].Path, outDir, ranges);
                OkCount = results.Count;
                foreach (var r in results)
                    _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = Files[0].Path, OutputFile = r, Operation = "pdf_split", Format = "pdf", Success = true });
            }
        }
        catch (Exception ex) { FailCount++; MessageBox.Show(ex.Message); }
        finally { Running = false; }
    }

    private List<(int Start, int End)> ParseRanges(string ranges)
    {
        var result = new List<(int, int)>();
        if (string.IsNullOrWhiteSpace(ranges)) { result.Add((1, 1)); return result; }
        foreach (var part in ranges.Split(','))
        {
            var trimmed = part.Trim();
            if (trimmed.Contains('-'))
            {
                var parts = trimmed.Split('-');
                int start = int.TryParse(parts[0], out var s) ? s : 1;
                int end = parts.Length > 1 && int.TryParse(parts[1], out var e) ? e : start;
                result.Add((start, end));
            }
            else if (int.TryParse(trimmed, out var p)) { result.Add((p, p)); }
        }
        return result.Count > 0 ? result : new() { (1, 1) };
    }
}
