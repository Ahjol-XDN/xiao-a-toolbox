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

        // For PDF: convert to HTML first, then use Edge to print to PDF
        var actualOutput = outputPath;
        if (ext == ".pdf")
            actualOutput = Path.ChangeExtension(outputPath, ".html");

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
        foreach (var arg in args) psi.ArgumentList.Add(arg);

        using var process = new Process { StartInfo = psi };
        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
            throw new Exception($"Pandoc error (code {process.ExitCode}): {stderr}");

        // If target was PDF, convert HTML to PDF via Edge
        if (ext == ".pdf")
        {
            var pdfResult = await HtmlToPdfViaEdge(actualOutput, outputPath);
            try { File.Delete(actualOutput); } catch { }  // Clean up temp HTML
            return pdfResult;
        }

        return actualOutput;
    }

    private static async Task<string> HtmlToPdfViaEdge(string htmlPath, string pdfPath)
    {
        var edgePath = FindEdge();
        if (edgePath == null)
            throw new Exception("Microsoft Edge not found. Install Edge to convert to PDF.");

        var psi = new ProcessStartInfo
        {
            FileName = edgePath,
            Arguments = $"--headless --disable-gpu --print-to-pdf=\"{pdfPath}\" \"file:///{htmlPath.Replace('\\', '/')}\"",
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true
        };

        using var process = new Process { StartInfo = psi };
        process.Start();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0 || !File.Exists(pdfPath))
            throw new Exception($"Edge PDF conversion failed: {stderr}");

        return pdfPath;
    }

    private static string? FindEdge()
    {
        var paths = new[]
        {
            @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                @"Microsoft\Edge\Application\msedge.exe")
        };

        foreach (var p in paths)
            if (File.Exists(p)) return p;

        return null;
    }
}