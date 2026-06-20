using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using Microsoft.Win32;
using XiaoAToolbox.Models;
using XiaoAToolbox.Services;

namespace XiaoAToolbox.ViewModels;

public class VideoViewModel : ObservableObject
{
    private readonly FfmpegService _ffmpeg = new();
    private readonly ConfigService _config = new();
    private readonly HistoryService _history = new();
    private CancellationTokenSource? _cts;

    // File management
    public ObservableCollection<FileItem> Files { get; } = new();

    private string _dropHint = "拖拽视频文件到此处";
    public string DropHint { get => _dropHint; set => SetProperty(ref _dropHint, value); }

    // Mode
    private string _mode = "convert";
    public string Mode { get => _mode; set { if (SetProperty(ref _mode, value)) UpdateUI(); } }

    public string? ForceMode { get; set; }

    // Format
    private string _format = "mp4";
    public string Format { get => _format; set => SetProperty(ref _format, value); }

    // Video params
    private string _codec = "libx264";
    public string Codec { get => _codec; set => SetProperty(ref _codec, value); }

    private string _bitrate = "2M";
    public string Bitrate { get => _bitrate; set => SetProperty(ref _bitrate, value); }

    private string _crf = "23";
    public string Crf { get => _crf; set => SetProperty(ref _crf, value); }

    private string _resolution = "";
    public string Resolution { get => _resolution; set => SetProperty(ref _resolution, value); }

    private string _fps = "";
    public string Fps { get => _fps; set => SetProperty(ref _fps, value); }

    // Audio params
    private string _audioBitrate = "192k";
    public string AudioBitrate { get => _audioBitrate; set => SetProperty(ref _audioBitrate, value); }

    private string _sampleRate = "44100";
    public string SampleRate { get => _sampleRate; set => SetProperty(ref _sampleRate, value); }

    // Trim
    private string _startTime = "00:00:00";
    public string StartTime { get => _startTime; set => SetProperty(ref _startTime, value); }

    private string _endTime = "00:00:10";
    public string EndTime { get => _endTime; set => SetProperty(ref _endTime, value); }

    // GIF
    private int _gifFps = 10;
    public int GifFps { get => _gifFps; set => SetProperty(ref _gifFps, value); }

    private string _gifSize = "480:-1";
    public string GifSize { get => _gifSize; set => SetProperty(ref _gifSize, value); }

    // Screenshot
    private string _ssTime = "00:00:01";
    public string SsTime { get => _ssTime; set => SetProperty(ref _ssTime, value); }

    // Progress
    private bool _running;
    public bool Running { get => _running; set { SetProperty(ref _running, value); OnPropertyChanged(nameof(Inactive)); } }

    private int _progress;
    public int Progress { get => _progress; set => SetProperty(ref _progress, value); }

    private string _progressText = "";
    public string ProgressText { get => _progressText; set => SetProperty(ref _progressText, value); }

    public bool Inactive => !Running && Files.Count == 0;

    // Results
    private int _successCount;
    public int SuccessCount { get => _successCount; set => SetProperty(ref _successCount, value); }

    private int _failCount;
    public int FailCount { get => _failCount; set => SetProperty(ref _failCount, value); }

    private string _outputDir = "";
    public string OutputDir { get => _outputDir; set => SetProperty(ref _outputDir, value); }

    // Commands
    public ICommand AddFilesCommand { get; }
    public ICommand ClearFilesCommand { get; }
    public ICommand StartConvertCommand { get; }
    public ICommand CancelCommand { get; }
    public ICommand BrowseOutputCommand { get; }
    public ICommand AddFromDropCommand { get; }

    public VideoViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(ClearFiles);
        StartConvertCommand = new RelayCommand(async () => await StartConvert(), () => !Running && Files.Count > 0);
        CancelCommand = new RelayCommand(Cancel);
        BrowseOutputCommand = new RelayCommand(BrowseOutput);
        AddFromDropCommand = new RelayCommand<string[]>(paths =>
        {
            if (paths != null)
                foreach (var p in paths) AddFile(p);
        });

        _outputDir = _config.Load().OutputDirectory;
    }

    public void AddFiles()
    {
        var dlg = new OpenFileDialog { Multiselect = true, Title = "选择视频文件" };
        dlg.Filter = "视频文件|*.mp4;*.mkv;*.avi;*.mov;*.webm;*.flv;*.wmv|所有文件|*.*";
        if (dlg.ShowDialog() == true)
        {
            foreach (var f in dlg.FileNames) AddFile(f);
        }
    }

    public void AddFile(string path)
    {
        if (!File.Exists(path) || Files.Any(f => f.Path == path)) return;
        var fi = new FileInfo(path);
        var item = new FileItem { Path = path, Size = fi.Length };
        Files.Add(item);
        OnPropertyChanged(nameof(Inactive));
    }

    public void ClearFiles()
    {
        Files.Clear();
        SuccessCount = 0;
        FailCount = 0;
        OnPropertyChanged(nameof(Inactive));
    }

    public void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "选择输出目录" };
        if (dlg.ShowDialog() == true)
        {
            OutputDir = dlg.FolderName;
        }
    }

    public void Cancel()
    {
        _cts?.Cancel();
        _ffmpeg.Cancel();
        Running = false;
    }

    private void UpdateUI()
    {
        if (ForceMode == "extract-audio") return;
        // Update visibility based on mode
    }

    public async Task StartConvert()
    {
        if (Files.Count == 0) return;
        Running = true;
        Progress = 0;
        SuccessCount = 0;
        FailCount = 0;
        _cts = new CancellationTokenSource();

        var actualMode = ForceMode ?? Mode;
        var outDir = string.IsNullOrEmpty(OutputDir)
            ? Path.GetDirectoryName(Files[0].Path) ?? "."
            : OutputDir;

        if (!Directory.Exists(outDir)) Directory.CreateDirectory(outDir);

        try
        {
            for (int i = 0; i < Files.Count; i++)
            {
                _cts.Token.ThrowIfCancellationRequested();
                var file = Files[i];
                ProgressText = $"{LocalizationService.Instance["Converting"]} ({i + 1}/{Files.Count})";

                string outputPath;

                switch (actualMode)
                {
                    case "extract-audio":
                        outputPath = Path.Combine(outDir,
                            Path.GetFileNameWithoutExtension(file.Path) + "." + Format);
                        await _ffmpeg.ExtractAudioAsync(file.Path, outputPath, AudioBitrate, SampleRate);
                        break;

                    case "compress":
                        outputPath = Path.Combine(outDir,
                            Path.GetFileNameWithoutExtension(file.Path) + "_compressed." + Format);
                        await _ffmpeg.CompressVideoAsync(file.Path, outputPath, Crf, Codec, Resolution, Bitrate);
                        break;

                    case "trim":
                        outputPath = Path.Combine(outDir,
                            Path.GetFileNameWithoutExtension(file.Path) + "_trimmed." + Format);
                        await _ffmpeg.TrimVideoAsync(file.Path, outputPath, StartTime, EndTime);
                        break;

                    case "gif":
                        outputPath = Path.Combine(outDir,
                            Path.GetFileNameWithoutExtension(file.Path) + ".gif");
                        await _ffmpeg.ConvertVideoToGifAsync(file.Path, outputPath, GifFps, GifSize);
                        break;

                    case "screenshot":
                        outputPath = Path.Combine(outDir,
                            Path.GetFileNameWithoutExtension(file.Path) + $"_ss.{Format}");
                        await _ffmpeg.ExtractFrameAsync(file.Path, outputPath, SsTime, Resolution);
                        break;

                    default: // convert
                        outputPath = Path.Combine(outDir,
                            Path.GetFileNameWithoutExtension(file.Path) + "." + Format);
                        await _ffmpeg.ConvertVideoAsync(file.Path, outputPath, Format, Codec, Bitrate, Resolution, Crf, Fps);
                        break;
                }

                SuccessCount++;
                _history.Add(new HistoryEntry
                {
                    Timestamp = DateTime.Now,
                    InputFile = file.Path,
                    OutputFile = outputPath,
                    Operation = actualMode,
                    Format = Format,
                    Success = true
                });
            }

            Progress = 100;
            MessageBox.Show(string.Format(LocalizationService.Instance["CompleteMsg"], SuccessCount, FailCount),
                LocalizationService.Instance["Complete"],
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (OperationCanceledException)
        {
            // User cancelled
        }
        catch (Exception ex)
        {
            FailCount++;
            MessageBox.Show(ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            Running = false;
        }
    }
}
