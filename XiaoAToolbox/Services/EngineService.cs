using System.IO.Compression;

namespace XiaoAToolbox.Services;

public class EngineService
{
    private static readonly string AppEngineDir = Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory, "engines");
    private static readonly string UserEngineDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "XiaoAToolbox", "engines");

    public static string? FfmpegPath { get; private set; }
    public static string? FfprobePath { get; private set; }
    public static string? PandocPath { get; private set; }
    public static bool FfmpegAvailable { get; private set; }
    public static bool PandocAvailable { get; private set; }

    public static void DetectEngines()
    {
        // Check multiple locations
        foreach (var baseDir in new[] { AppEngineDir, UserEngineDir })
        {
            var ffmpegDir = Path.Combine(baseDir, "ffmpeg", "bin");
            var ffmpegExe = Path.Combine(ffmpegDir, "ffmpeg.exe");
            var ffprobeExe = Path.Combine(ffmpegDir, "ffprobe.exe");
            var pandocExe = Path.Combine(baseDir, "pandoc", "pandoc.exe");

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
        }
    }
}