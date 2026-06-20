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

    private int _successCount;
    public int SuccessCount { get => _successCount; set => SetProperty(ref _successCount, value); }

    private int _failCount;
    public int FailCount { get => _failCount; set => SetProperty(ref _failCount, value); }

    public bool Inactive => !Running && Files.Count == 0;

    private string _outputDir = "";
    public string OutputDir { get => _outputDir; set => SetProperty(ref _outputDir, value); }

    public ICommand AddFilesCommand { get; }
    public ICommand ClearFilesCommand { get; }
    public ICommand StartCommand { get; }
    public ICommand BrowseOutputCommand { get; }

    public string StatusText =>
        Files.Count == 0 ? "Please add document files" :
        !EngineService.PandocAvailable ? "Pandoc engine not found" :
        $"Added {Files.Count} file(s), click Start Convert";

    public DocumentViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(Clear);
        StartCommand = new RelayCommand(async () => await StartAsync());
        BrowseOutputCommand = new RelayCommand(BrowseOutput);
        _outputDir = _config.Load().OutputDirectory;
        Files.CollectionChanged += (_, _) =>
        {
            OnPropertyChanged(nameof(StatusText));
            OnPropertyChanged(nameof(Inactive));
        };
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
        var dlg = new OpenFileDialog
        {
            Multiselect = true,
            Title = "Select Documents",
            Filter = "Documents|*.docx;*.md;*.txt;*.html;*.rtf;*.epub;*.tex|All Files|*.*"
        };
        if (dlg.ShowDialog() == true)
            foreach (var f in dlg.FileNames) AddFile(f);
    }

    private void Clear()
    {
        Files.Clear();
        Progress = 0;
        ProgressText = "";
        SuccessCount = 0;
        FailCount = 0;
        OnPropertyChanged(nameof(Inactive));
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "Select Output Directory" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    private async Task StartAsync()
    {
        if (Files.Count == 0)
        {
            MessageBox.Show("Please add files first.", "Tip", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }
        if (!EngineService.PandocAvailable)
        {
            MessageBox.Show("Pandoc engine not found.\nPlease place pandoc.exe in the app directory.",
                "Engine Missing", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        Running = true;
        Progress = 0;
        SuccessCount = 0;
        FailCount = 0;
        var outDir = string.IsNullOrEmpty(OutputDir)
            ? Path.GetDirectoryName(Files[0].Path)!
            : OutputDir;
        Directory.CreateDirectory(outDir);

        try
        {
            for (int i = 0; i < Files.Count; i++)
            {
                var file = Files[i];
                ProgressText = $"Converting... ({i + 1}/{Files.Count})";
                var output = Path.Combine(outDir,
                    Path.GetFileNameWithoutExtension(file.Path) + $".{Format}");

                try
                {
                    var result = await _pandoc.ConvertDocumentAsync(file.Path, output, IncludeToc);
                    SuccessCount++;
                    _history.Add(new HistoryEntry
                    {
                        Timestamp = DateTime.Now,
                        InputFile = file.Path,
                        OutputFile = result,
                        Operation = "document",
                        Format = Format,
                        Success = true
                    });
                }
                catch (Exception ex)
                {
                    FailCount++;
                    _history.Add(new HistoryEntry
                    {
                        Timestamp = DateTime.Now,
                        InputFile = file.Path,
                        OutputFile = "",
                        Operation = "document",
                        Format = Format,
                        Success = false,
                        Error = ex.Message
                    });
                }

                Progress = (i + 1) * 100 / Files.Count;
            }

            Progress = 100;
            ProgressText = "Conversion complete";
            MessageBox.Show(
                $"Conversion complete!\n\nSuccess: {SuccessCount}\nFailed: {FailCount}",
                "Document Conversion",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            Running = false;
        }
    }
}
