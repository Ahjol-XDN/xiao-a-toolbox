namespace XiaoAToolbox.Services;

public class EngineService
{
    public static string? FfmpegPath { get; private set; }
    public static string? FfprobePath { get; private set; }
    public static string? PandocPath { get; private set; }
    public static bool FfmpegAvailable { get; private set; }
    public static bool PandocAvailable { get; private set; }

    public static void DetectEngines()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;

        // Search all subdirectories recursively for engines
        var allExes = new List<string>();
        if (Directory.Exists(baseDir))
            SearchDir(baseDir, allExes);

        foreach (var exe in allExes)
        {
            var name = Path.GetFileName(exe).ToLowerInvariant();
            var dir = Path.GetDirectoryName(exe)!;

            if (name == "ffmpeg.exe" && !FfmpegAvailable)
            {
                FfmpegPath = exe;
                FfprobePath = Path.Combine(dir, "ffprobe.exe");
                FfmpegAvailable = true;
            }
            else if (name == "pandoc.exe" && !PandocAvailable)
            {
                PandocPath = exe;
                PandocAvailable = true;
            }
        }
    }

    private static void SearchDir(string dir, List<string> results)
    {
        try
        {
            foreach (var f in Directory.GetFiles(dir, "*.exe"))
                results.Add(f);
            foreach (var d in Directory.GetDirectories(dir))
                SearchDir(d, results);
        }
        catch { }
    }
}