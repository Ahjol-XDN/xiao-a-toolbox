using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using Microsoft.Win32;
using XiaoAToolbox.Models;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class BatchViewModel : ObservableObject
{
    private readonly FfmpegService _ffmpeg = new();
    private readonly ConfigService _config = new();
    private readonly HistoryService _history = new();

    public ObservableCollection<FileItem> Files { get; } = new();

    private string _format = "mp4";
    public string Format { get => _format; set => SetProperty(ref _format, value); }

    private string _bitrate = "2M";
    public string Bitrate { get => _bitrate; set => SetProperty(ref _bitrate, value); }

    private string _resolution = "";
    public string Resolution { get => _resolution; set => SetProperty(ref _resolution, value); }

    private bool _running;
    public bool Running { get => _running; set { SetProperty(ref _running, value); OnPropertyChanged(nameof(Inactive)); } }

    private int _progress;
    public int Progress { get => _progress; set => SetProperty(ref _progress, value); }

    private string _progressText = "";
    public string ProgressText { get => _progressText; set => SetProperty(ref _progressText, value); }

    public bool Inactive => !Running && Files.Count == 0;

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

    public BatchViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(() => { Files.Clear(); OkCount = 0; FailCount = 0; OnPropertyChanged(nameof(Inactive)); });
        StartCommand = new RelayCommand(RunStartAsync, () => !Running && Files.Count > 0);
        BrowseOutputCommand = new RelayCommand(BrowseOutput);
        _outputDir = _config.Load().OutputDirectory;

        Files.CollectionChanged += (_, _) =>
        {
            OnPropertyChanged(nameof(Inactive));
            ((RelayCommand)StartCommand).RaiseCanExecuteChanged();
        };
    }

    public void AddFile(string path)
    {
        if (!File.Exists(path) || Files.Any(f => f.Path == path)) return;
        var fi = new FileInfo(path);
        Files.Add(new FileItem { Path = path, Size = fi.Length });
    }

    public void AddFiles()
    {
        var dlg = new OpenFileDialog { Multiselect = true, Title = "选择文件" };
        dlg.Filter = "支持的文件|*.mp4;*.mkv;*.avi;*.mov;*.webm;*.flv;*.mp3;*.wav;*.aac;*.flac;*.ogg;*.png;*.jpg;*.jpeg;*.webp;*.bmp|所有文件|*.*";
        if (dlg.ShowDialog() == true)
            foreach (var f in dlg.FileNames) AddFile(f);
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "选择输出目录" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    private async void RunStartAsync()
    {
        try { await StartAsync(); }
        catch (Exception ex) { FailCount++; MessageBox.Show(ex.Message, "错误", MessageBoxButton.OK, MessageBoxImage.Error); }
    }

    private async Task StartAsync()
    {
        if (Files.Count == 0) return;
        Running = true; Progress = 0; OkCount = 0; FailCount = 0;

        var baseDir = string.IsNullOrEmpty(OutputDir)
            ? Path.GetDirectoryName(Files[0].Path) ?? "."
            : OutputDir;

        try
        {
            Directory.CreateDirectory(baseDir);
        }
        catch (Exception ex)
        {
            FailCount++;
            MessageBox.Show("无法创建输出目录：" + ex.Message, "错误", MessageBoxButton.OK, MessageBoxImage.Error);
            return;
        }

        try
        {
            for (int i = 0; i < Files.Count; i++)
            {
                var file = Files[i];
                ProgressText = $"转换中... ({i + 1}/{Files.Count})";
                var output = Path.Combine(baseDir, Path.GetFileNameWithoutExtension(file.Path) + $".{Format}");
                try
                {
                    await _ffmpeg.ConvertVideoAsync(file.Path, output, Format, bitrate: Bitrate, resolution: string.IsNullOrEmpty(Resolution) ? null : Resolution);
                    OkCount++;
                    _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = file.Path, OutputFile = output, Operation = "batch", Format = Format, Success = true });
                }
                catch (Exception ex)
                {
                    FailCount++;
                    _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = file.Path, OutputFile = "", Operation = "batch", Format = Format, Success = false, Error = ex.Message });
                }
                Progress = (i + 1) * 100 / Files.Count;
            }
        }
        catch (Exception ex) { FailCount++; MessageBox.Show(ex.Message, "错误", MessageBoxButton.OK, MessageBoxImage.Error); }
        finally { Running = false; }
    }
}
