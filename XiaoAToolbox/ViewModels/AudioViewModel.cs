using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using Microsoft.Win32;
using XiaoAToolbox.Models;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class AudioViewModel : ObservableObject
{
    private readonly FfmpegService _ffmpeg = new();
    private readonly ConfigService _config = new();
    private readonly HistoryService _history = new();
    private CancellationTokenSource? _cts;

    public ObservableCollection<FileItem> Files { get; } = new();

    private string _mode = "convert";
    public string Mode { get => _mode; set => SetProperty(ref _mode, value); }

    private string _format = "mp3";
    public string Format { get => _format; set => SetProperty(ref _format, value); }

    private string _bitrate = "192k";
    public string Bitrate { get => _bitrate; set => SetProperty(ref _bitrate, value); }

    private string _sampleRate = "44100";
    public string SampleRate { get => _sampleRate; set => SetProperty(ref _sampleRate, value); }

    private string _startTime = "00:00:00";
    public string StartTime { get => _startTime; set => SetProperty(ref _startTime, value); }

    private string _endTime = "00:00:30";
    public string EndTime { get => _endTime; set => SetProperty(ref _endTime, value); }

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
    public ICommand CancelCommand { get; }
    public ICommand BrowseOutputCommand { get; }

    public AudioViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(() => { Files.Clear(); OkCount = 0; FailCount = 0; });
        StartCommand = new RelayCommand(async () => await StartAsync(), () => !Running && Files.Count > 0);
        CancelCommand = new RelayCommand(() => { _cts?.Cancel(); _ffmpeg.Cancel(); Running = false; });
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
        var dlg = new OpenFileDialog { Multiselect = true, Title = "选择音频文件" };
        dlg.Filter = "音频文件|*.mp3;*.wav;*.aac;*.flac;*.ogg;*.wma;*.m4a|所有文件|*.*";
        if (dlg.ShowDialog() == true)
            foreach (var f in dlg.FileNames) AddFile(f);
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "选择输出目录" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    public void Cancel()
    {
        _cts?.Cancel();
        _ffmpeg.Cancel();
        Running = false;
    }

    private async Task StartAsync()
    {
        if (Files.Count == 0) return;
        Running = true; Progress = 0; OkCount = 0; FailCount = 0;
        _cts = new CancellationTokenSource();
        var outDir = string.IsNullOrEmpty(OutputDir) ? Path.GetDirectoryName(Files[0].Path)! : OutputDir;
        Directory.CreateDirectory(outDir);

        try
        {
            if (Mode == "merge")
            {
                var output = Path.Combine(outDir, $"merged_{DateTime.Now:yyyyMMddHHmmss}.{Format}");
                await _ffmpeg.AudioMergeAsync(Files.Select(f => f.Path).ToList(), output);
                OkCount = Files.Count;
                _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = $"{Files.Count} files", OutputFile = output, Operation = "merge", Format = Format, Success = true });
            }
            else
            {
                for (int i = 0; i < Files.Count; i++)
                {
                    _cts.Token.ThrowIfCancellationRequested();
                    var file = Files[i];
                    ProgressText = $"转换中... ({i + 1}/{Files.Count})";

                    string output;
                    if (Mode == "trim")
                    {
                        output = Path.Combine(outDir, Path.GetFileNameWithoutExtension(file.Path) + $"_trimmed.{Format}");
                        await _ffmpeg.TrimAudioAsync(file.Path, output, StartTime, EndTime);
                    }
                    else
                    {
                        output = Path.Combine(outDir, Path.GetFileNameWithoutExtension(file.Path) + $".{Format}");
                        await _ffmpeg.ConvertAudioAsync(file.Path, output, Bitrate, SampleRate);
                    }

                    OkCount++;
                    _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = file.Path, OutputFile = output, Operation = Mode, Format = Format, Success = true });
                }
            }
            Progress = 100;
        }
        catch (OperationCanceledException) { }
        catch (Exception ex) { FailCount++; MessageBox.Show(ex.Message, "Error"); }
        finally { Running = false; }
    }
}
