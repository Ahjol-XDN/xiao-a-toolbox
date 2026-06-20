using System.Diagnostics;
using System.Text.Json;
using XiaoAToolbox.Models;

namespace XiaoAToolbox.Services;

public class FfmpegService
{
    private Process? _currentProcess;
    private CancellationTokenSource? _cts;

    public event Action<ProgressInfo>? OnProgress;
    public event Action<string>? OnLog;

    public class ProgressInfo
    {
        public int Percent { get; set; }
        public string Time { get; set; } = "";
        public string Speed { get; set; } = "";
        public string Frame { get; set; } = "";
    }

    public void Cancel()
    {
        _cts?.Cancel();
        try { _currentProcess?.Kill(); } catch { }
    }

    // ---- ffprobe ----
    public async Task<MediaInfo?> GetMediaInfoAsync(string filePath)
    {
        var ffprobe = EngineService.FfprobePath ?? "ffprobe";
        var args = $"-v quiet -print_format json -show_format -show_streams \"{filePath}\"";
        var result = await RunProcessAsync(ffprobe, args, readStdout: true);
        if (result.ExitCode == 0 && !string.IsNullOrEmpty(result.Stdout))
        {
            try { return JsonSerializer.Deserialize<MediaInfo>(result.Stdout); }
            catch { return null; }
        }
        return null;
    }

    // ---- Video convert ----
    public async Task<string> ConvertVideoAsync(string input, string output, string format,
        string? codec = null, string? bitrate = null, string? resolution = null,
        string? crf = null, string? fps = null)
    {
        var args = $"-y -i \"{input}\" ";
        if (!string.IsNullOrEmpty(codec)) args += $"-c:v {codec} ";
        if (!string.IsNullOrEmpty(bitrate)) args += $"-b:v {bitrate} ";
        if (!string.IsNullOrEmpty(resolution)) args += $"-vf scale={resolution} ";
        if (!string.IsNullOrEmpty(crf)) args += $"-crf {crf} ";
        if (!string.IsNullOrEmpty(fps)) args += $"-r {fps} ";
        args += $"\"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Audio convert ----
    public async Task<string> ConvertAudioAsync(string input, string output,
        string? bitrate = null, string? sampleRate = null, string? channels = null)
    {
        var args = $"-y -i \"{input}\" ";
        if (!string.IsNullOrEmpty(bitrate)) args += $"-b:a {bitrate} ";
        if (!string.IsNullOrEmpty(sampleRate)) args += $"-ar {sampleRate} ";
        if (!string.IsNullOrEmpty(channels)) args += $"-ac {channels} ";
        args += $"-vn \"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Extract audio from video ----
    public async Task<string> ExtractAudioAsync(string input, string output,
        string? bitrate = null, string? sampleRate = null)
    {
        var args = $"-y -i \"{input}\" -vn ";
        if (!string.IsNullOrEmpty(bitrate)) args += $"-b:a {bitrate} ";
        if (!string.IsNullOrEmpty(sampleRate)) args += $"-ar {sampleRate} ";
        args += $"\"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Video to GIF ----
    public async Task<string> ConvertVideoToGifAsync(string input, string output,
        int fps = 10, string resolution = "480:-1")
    {
        var args = $"-y -i \"{input}\" -vf \"fps={fps},scale={resolution}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse\" \"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Extract frame / screenshot ----
    public async Task<string> ExtractFrameAsync(string input, string output,
        string time = "00:00:01", string? resolution = null)
    {
        var args = $"-y -i \"{input}\" -ss {time} -vframes 1 ";
        if (!string.IsNullOrEmpty(resolution)) args += $"-vf scale={resolution} ";
        args += $"\"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Compress video ----
    public async Task<string> CompressVideoAsync(string input, string output,
        string? crf = null, string? codec = null, string? resolution = null, string? bitrate = null)
    {
        var args = $"-y -i \"{input}\" ";
        if (!string.IsNullOrEmpty(crf)) args += $"-crf {crf} ";
        if (!string.IsNullOrEmpty(codec)) args += $"-c:v {codec} ";
        if (!string.IsNullOrEmpty(resolution)) args += $"-vf scale={resolution} ";
        if (!string.IsNullOrEmpty(bitrate)) args += $"-b:v {bitrate} ";
        args += $"-preset medium \"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Trim video (fast copy) ----
    public async Task<string> TrimVideoAsync(string input, string output, string start, string end)
    {
        var args = $"-y -i \"{input}\" -ss {start} -to {end} -c copy \"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Trim audio (fast copy) ----
    public async Task<string> TrimAudioAsync(string input, string output, string start, string end)
    {
        var args = $"-y -i \"{input}\" -ss {start} -to {end} -vn -c copy \"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Audio merge ----
    public async Task<string> AudioMergeAsync(List<string> inputPaths, string output)
    {
        var listContent = string.Join("\n", inputPaths.Select(p => $"file '{p.Replace("\\", "/")}'"));
        var listPath = Path.Combine(Path.GetTempPath(), $"ffmpeg-concat-{DateTime.Now.Ticks}.txt");
        await File.WriteAllTextAsync(listPath, listContent);
        var args = $"-y -f concat -safe 0 -i \"{listPath}\" -c copy \"{output}\"";
        await RunFfmpegAsync(args);
        try { File.Delete(listPath); } catch { }
        return output;
    }

    // ---- Image convert ----
    public async Task<string> ConvertImageAsync(string input, string output,
        int? quality = null, string? resolution = null)
    {
        var args = $"-y -i \"{input}\" ";
        if (quality.HasValue)
        {
            var q = (int)Math.Round((100 - quality.Value) / 100.0 * 31);
            args += $"-q:v {q} ";
        }
        if (!string.IsNullOrEmpty(resolution)) args += $"-vf scale={resolution} ";
        args += $"\"{output}\"";
        await RunFfmpegAsync(args);
        return output;
    }

    // ---- Batch conversion ----
    public async Task<List<string>> BatchConvertAsync(List<ConversionTask> tasks)
    {
        var results = new List<string>();
        for (int i = 0; i < tasks.Count; i++)
        {
            var task = tasks[i];
            try
            {
                var result = await ConvertVideoAsync(task.InputPath, task.OutputPath, task.OutputFormat,
                    bitrate: task.Parameters.GetValueOrDefault("bitrate"),
                    resolution: task.Parameters.GetValueOrDefault("resolution"));
                results.Add(result);
            }
            catch (Exception ex)
            {
                results.Add($"FAILED: {task.InputPath} - {ex.Message}");
            }
            OnLog?.Invoke($"[{i + 1}/{tasks.Count}] {task.InputPath}");
        }
        return results;
    }

    // ---- Core runner ----
    private async Task RunFfmpegAsync(string args)
    {
        var ffmpeg = EngineService.FfmpegPath ?? "ffmpeg";
        var processArgs = ProcessArgs(args);
        _cts = new CancellationTokenSource();

        var psi = new ProcessStartInfo
        {
            FileName = ffmpeg,
            Arguments = processArgs,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true,
            RedirectStandardOutput = true
        };

        _currentProcess = new Process { StartInfo = psi, EnableRaisingEvents = true };

        var tcs = new TaskCompletionSource<bool>();

        _currentProcess.ErrorDataReceived += (_, e) =>
        {
            if (e.Data == null) return;
            var progress = ParseProgress(e.Data);
            if (progress != null) OnProgress?.Invoke(progress);
            OnLog?.Invoke(e.Data);
        };

        _currentProcess.Exited += (_, _) =>
        {
            tcs.TrySetResult(_currentProcess.ExitCode == 0);
        };

        _currentProcess.Start();
        _currentProcess.BeginErrorReadLine();

        using (_cts.Token.Register(() => { try { _currentProcess.Kill(); } catch { } }))
        {
            try
            {
                await Task.WhenAny(tcs.Task, Task.Delay(-1, _cts.Token));
            }
            catch (OperationCanceledException)
            {
                throw new OperationCanceledException("Conversion cancelled.");
            }
        }

        await tcs.Task;
        if (_currentProcess.ExitCode != 0)
            throw new Exception($"FFmpeg exited with code {_currentProcess.ExitCode}");
    }

    private async Task<(int ExitCode, string Stdout, string Stderr)> RunProcessAsync(
        string fileName, string args, bool readStdout = false)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = args,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        using var process = new Process { StartInfo = psi };
        process.Start();
        var stdout = readStdout ? await process.StandardOutput.ReadToEndAsync() : "";
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        return (process.ExitCode, stdout, stderr);
    }

    private ProgressInfo? ParseProgress(string line)
    {
        // Parse ffmpeg progress lines like:
        // frame=  123 fps= 30 q=28.0 size=    1024kB time=00:00:05.00 bitrate=1600.0kbits/s speed=2.5x
        if (!line.StartsWith("frame=")) return null;

        var info = new ProgressInfo();
        var parts = line.Trim().Split(new[] { '=' }, StringSplitOptions.RemoveEmptyEntries);

        for (int i = 0; i < parts.Length - 1; i++)
        {
            var key = parts[i].Trim();
            var val = i + 1 < parts.Length ? parts[i + 1].Trim().Split(' ')[0] : "";
            switch (key)
            {
                case "frame": info.Frame = val; break;
                case "time": info.Time = val;
                    if (TimeSpan.TryParse(val, out var ts))
                        info.Percent = (int)(ts.TotalSeconds / 10.0 * 100); // rough estimate
                    break;
                case "speed": info.Speed = val; break;
            }
        }
        return info;
    }

    // Helper to parse PowerShell-style string args if needed
    private static string ProcessArgs(string args) => args;
}
