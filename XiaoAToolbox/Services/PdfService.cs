using System.Diagnostics;

namespace XiaoAToolbox.Services;

public class PdfService
{
    public async Task<string> MergeAsync(List<string> inputPaths, string outputPath)
    {
        // Use PdfSharpCore for PDF merge
        using var outputDocument = new PdfSharpCore.Pdf.PdfDocument();

        foreach (var path in inputPaths)
        {
            using var inputDocument = PdfSharpCore.Pdf.IO.PdfReader.Open(path, PdfSharpCore.Pdf.IO.PdfDocumentOpenMode.Import);
            for (int i = 0; i < inputDocument.PageCount; i++)
            {
                var page = inputDocument.Pages[i];
                outputDocument.AddPage(page);
            }
        }

        outputDocument.Save(outputPath);
        return await Task.FromResult(outputPath);
    }

    public async Task<List<string>> SplitAsync(string inputPath, string outputDir, List<(int Start, int End)> ranges)
    {
        var results = new List<string>();
        Directory.CreateDirectory(outputDir);

        using var inputDocument = PdfSharpCore.Pdf.IO.PdfReader.Open(inputPath, PdfSharpCore.Pdf.IO.PdfDocumentOpenMode.Import);

        for (int i = 0; i < ranges.Count; i++)
        {
            var (start, end) = ranges[i];
            using var newDocument = new PdfSharpCore.Pdf.PdfDocument();

            for (int p = Math.Max(0, start - 1); p < Math.Min(inputDocument.PageCount, end); p++)
            {
                var page = inputDocument.Pages[p];
                newDocument.AddPage(page);
            }

            var outPath = Path.Combine(outputDir, $"split_{i + 1}.pdf");
            newDocument.Save(outPath);
            results.Add(outPath);
        }

        return await Task.FromResult(results);
    }
}
