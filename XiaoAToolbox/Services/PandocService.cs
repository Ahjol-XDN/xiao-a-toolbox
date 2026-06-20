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
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
            throw new Exception($"Pandoc exited with code {process.ExitCode}: {stderr}");

        return outputPath;
    }
}
