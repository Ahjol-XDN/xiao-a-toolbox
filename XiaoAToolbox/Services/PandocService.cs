using System.Diagnostics;

namespace XiaoAToolbox.Services;

public class PandocService
{
    public async Task<string> ConvertDocumentAsync(
        string inputPath, string outputPath, bool includeToc = false)
    {
        var pandoc = EngineService.PandocPath ?? "pandoc";

        var args = $"\"{inputPath}\" -o \"{outputPath}\" --standalone";
        if (includeToc) args += " --toc";

        var psi = new ProcessStartInfo
        {
            FileName = pandoc,
            Arguments = args,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true,
            RedirectStandardOutput = true
        };

        using var process = new Process { StartInfo = psi };
        process.Start();

        // Read both streams concurrently to avoid deadlock
        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
            throw new Exception($"Pandoc error (code {process.ExitCode}): {stderr}");

        return outputPath;
    }
}