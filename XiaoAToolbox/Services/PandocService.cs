using System.Diagnostics;
using System.Text;

namespace XiaoAToolbox.Services;

public class PandocService
{
    public async Task<string> ConvertDocumentAsync(
        string inputPath, string outputPath, bool includeToc = false)
    {
        var pandoc = EngineService.PandocPath ?? "pandoc";

        if (!File.Exists(inputPath))
            throw new FileNotFoundException($"Input file not found: {inputPath}");

        var ext = Path.GetExtension(outputPath).ToLowerInvariant();
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);

        var args = new List<string>
        {
            inputPath,
            "-o", outputPath,
            "--standalone"
        };

        if (ext == ".pdf" && EngineService.PdfEngineAvailable && EngineService.WkhtmltopdfPath != null)
        {
            args.AddRange(new[] { "--pdf-engine", EngineService.WkhtmltopdfPath });
        }

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
        foreach (var arg in args) psi.ArgumentList.Add(arg);

        using var process = new Process { StartInfo = psi };
        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        var stderr = await stderrTask;

        if (process.ExitCode == 47 && ext == ".pdf")
            throw new Exception("PDF needs wkhtmltopdf.\nDownload: https://wkhtmltopdf.org\nPut wkhtmltopdf.exe next to XiaoAToolbox.exe");

        if (process.ExitCode != 0)
            throw new Exception($"Pandoc error (code {process.ExitCode}): {stderr}");

        return outputPath;
    }
}