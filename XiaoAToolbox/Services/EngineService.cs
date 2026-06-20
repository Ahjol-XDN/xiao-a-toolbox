namespace XiaoAToolbox.Services;

public class EngineService
{
    private static readonly string[] SearchDirs = new[]
    {
        AppDomain.CurrentDomain.BaseDirectory,
        Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "engines", "ffmpeg", "bin"),
        Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "engines", "pandoc"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "XiaoAToolbox", "engines", "ffmpeg", "bin"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "XiaoAToolbox", "engines", "pandoc"),
    };

    public static string? FfmpegPath { get; private set; }
    public static string? FfprobePath { get; private set; }
    public static string? PandocPath { get; private set; }
    public static string? WkhtmltopdfPath { get; private set; }
    public static bool FfmpegAvailable { get; private set; }
    public static bool PandocAvailable { get; private set; }
    public static bool PdfEngineAvailable { get; private set; }

    public static void DetectEngines()
    {
        foreach (var dir in SearchDirs)
        {
            var ffmpegExe = Path.Combine(dir, "ffmpeg.exe");
            var ffprobeExe = Path.Combine(dir, "ffprobe.exe");
            var pandocExe = Path.Combine(dir, "pandoc.exe");
            var wkExe = Path.Combine(dir, "wkhtmltopdf.exe");

            if (!FfmpegAvailable && File.Exists(ffmpegExe))
            {
                FfmpegPath = ffmpegExe;
                FfprobePath = ffprobeExe;
                FfmpegAvailable = true;
            }

            if (!PandocAvailable && File.Exists(pandocExe))
            {
                PandocPath = pandocExe;
                PandocAvailable = true;
            }

            if (!PdfEngineAvailable && File.Exists(wkExe))
            {
                WkhtmltopdfPath = wkExe;
                PdfEngineAvailable = true;
            }
        }
    }
}