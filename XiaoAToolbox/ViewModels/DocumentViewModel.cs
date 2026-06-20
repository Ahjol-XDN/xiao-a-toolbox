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

    private string _format = "pdf";
    public string Format { get => _format; set => SetProperty(ref _format, value); }

    private bool _includeToc;
    public bool IncludeToc { get => _includeToc; set => SetProperty(ref _includeToc, value); }

    private bool _running;
    public bool Running { get => _running; set { SetProperty(ref _running, value); OnPropertyChanged(nameof(Inactive)); } }

    private int _progress;
    public int Progress { get => _progress; set => SetProperty(ref _progress, value); }

    private string _progressText = "";
    public string ProgressText { get => _progressText; set => SetProperty(ref _progressText, value); }

    public bool Inactive => !EngineService.PandocAvailable || (!Running && Files.Count == 0);

    private string _outputDir = "";
    public string OutputDir { get => _outputDir; set => SetProperty(ref _outputDir, value); }

    public ICommand AddFilesCommand { get; }
    public ICommand ClearFilesCommand { get; }
    public ICommand StartCommand { get; }
    public ICommand BrowseOutputCommand { get; }

    public DocumentViewModel()
    {
        AddFilesCommand = new RelayCommand(AddFiles);
        ClearFilesCommand = new RelayCommand(() => Files.Clear());
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
        var dlg = new OpenFileDialog { Multiselect = true, Title = "閫夋嫨鏂囨。", Filter = "鏂囨。鏂囦欢|*.docx;*.md;*.txt;*.html;*.rtf;*.epub;*.tex|鎵€鏈夋枃浠秥*.*" };
        if (dlg.ShowDialog() == true)
            foreach (var f in dlg.FileNames) AddFile(f);
    }

    private void BrowseOutput()
    {
        var dlg = new OpenFolderDialog { Title = "閫夋嫨杈撳嚭鐩綍" };
        if (dlg.ShowDialog() == true) OutputDir = dlg.FolderName;
    }

    private async Task StartAsync()
    {
        if (Files.Count == 0) return;
        Running = true; Progress = 0;
        var outDir = string.IsNullOrEmpty(OutputDir) ? Path.GetDirectoryName(Files[0].Path)! : OutputDir;
        Directory.CreateDirectory(outDir);

        try
        {
            for (int i = 0; i < Files.Count; i++)
            {
                var file = Files[i];
                ProgressText = $"杞崲涓?.. ({i + 1}/{Files.Count})";
                var output = Path.Combine(outDir, Path.GetFileNameWithoutExtension(file.Path) + $".{Format}");
                await _pandoc.ConvertDocumentAsync(file.Path, output, IncludeToc);
                _history.Add(new HistoryEntry { Timestamp = DateTime.Now, InputFile = file.Path, OutputFile = output, Operation = "document", Format = Format, Success = true });
                Progress = (i + 1) * 100 / Files.Count;
            }
        }
        catch (Exception ex) { MessageBox.Show(ex.Message); }
        finally { Running = false; }
    }
}
