using System.Diagnostics;

namespace XiaoAToolbox.Services;

public class PandocService
{
    public async Task<string> ConvertDocumentAsync(
        string inputPath, string outputPath, bool includeToc = false)
    {
        var pandoc = EngineService.PandocPath ?? "pandoc";

        // PDF requires pdflatex; use HTML as intermediate then adjust
        var ext = Path.GetExtension(outputPath).ToLowerInvariant();
        var actualOutput = outputPath;

        var args = $"\"{inputPath}\" -o \"{actualOutput}\" --standalone";
        if (includeToc) args += " --toc";

        // For PDF without pdflatex, output HTML instead
        if (ext == ".pdf")
        {
            actualOutput = Path.ChangeExtension(outputPath, ".html");
            args = $"\"{inputPath}\" -o \"{actualOutput}\" --standalone";
            if (includeToc) args += " --toc";
        }

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

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
            throw new Exception($"Pandoc error (code {process.ExitCode}): {stderr}");

        return actualOutput;
    }
}