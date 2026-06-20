using System.Diagnostics;
using System.Text;

namespace XiaoAToolbox.Services;

public class PandocService
{
    public async Task<string> ConvertDocumentAsync(
        string inputPath, string outputPath, bool includeToc = false)
    {
        if (!File.Exists(inputPath))
            throw new FileNotFoundException($"Input file not found: {inputPath}");

        var pandoc = EngineService.PandocPath ?? "pandoc";
        var ext = Path.GetExtension(outputPath).ToLowerInvariant();
        var actualOutput = outputPath;

        // PDF needs pdflatex; fallback to HTML
        if (ext == ".pdf")
            actualOutput = Path.ChangeExtension(outputPath, ".html");

        Directory.CreateDirectory(Path.GetDirectoryName(actualOutput)!);

        // Use argument list to avoid quoting issues with Chinese paths
        var args = new List<string>
        {
            inputPath,
            "-o", actualOutput,
            "--standalone"
        };
        if (includeToc) args.Add("--toc");

        var psi = new ProcessStartInfo
        {
            FileName = pandoc,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        foreach (var arg in args)
            psi.ArgumentList.Add(arg);

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