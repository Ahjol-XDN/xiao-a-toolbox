using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace XiaoAToolbox.Services;

/// <summary>
/// Pure .NET document converter - no external dependencies.
/// Handles basic DOCX/TXT/MD/HTML conversions.
/// </summary>
public class NativeDocService
{
    public async Task<string> ConvertAsync(string inputPath, string outputPath)
    {
        var inExt = Path.GetExtension(inputPath).ToLowerInvariant();
        var outExt = Path.GetExtension(outputPath).ToLowerInvariant();
        var text = await ReadDocumentAsync(inputPath, inExt);

        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
        await WriteDocumentAsync(outputPath, outExt, text);

        return outputPath;
    }

    // ---- Read ----
    private static async Task<string> ReadDocumentAsync(string path, string ext)
    {
        return ext switch
        {
            ".txt" => await File.ReadAllTextAsync(path, Encoding.UTF8),
            ".md" => await File.ReadAllTextAsync(path, Encoding.UTF8),
            ".html" or ".htm" => await File.ReadAllTextAsync(path, Encoding.UTF8),
            ".docx" => ReadDocx(path),
            _ => await File.ReadAllTextAsync(path, Encoding.UTF8)
        };
    }

    private static string ReadDocx(string path)
    {
        using var zip = ZipFile.OpenRead(path);
        var docEntry = zip.GetEntry("word/document.xml");
        if (docEntry == null) return "";

        using var stream = docEntry.Open();
        var doc = XDocument.Load(stream);
        var ns = doc.Root!.GetDefaultNamespace();
        var paragraphs = doc.Descendants(ns + "p");
        var sb = new StringBuilder();

        foreach (var p in paragraphs)
        {
            var runs = p.Descendants(ns + "t");
            foreach (var r in runs)
                sb.Append(r.Value);
            sb.AppendLine();
        }

        return sb.ToString().TrimEnd();
    }

    // ---- Write ----
    private static async Task WriteDocumentAsync(string path, string ext, string content)
    {
        switch (ext)
        {
            case ".txt":
                await File.WriteAllTextAsync(path, StripHtml(content), Encoding.UTF8);
                break;
            case ".md":
                await File.WriteAllTextAsync(path, content, Encoding.UTF8);
                break;
            case ".html" or ".htm":
                var html = IsMarkdown(content) ? MarkdownToHtml(content) : content;
                if (!html.TrimStart().StartsWith("<"))
                    html = $"<html><body>\n{ParagraphsToHtml(content)}\n</body></html>";
                await File.WriteAllTextAsync(path, html, Encoding.UTF8);
                break;
            case ".docx":
                WriteDocx(path, content);
                break;
            default:
                await File.WriteAllTextAsync(path, content, Encoding.UTF8);
                break;
        }
    }

    // ---- DOCX Writer ----
    private static void WriteDocx(string path, string text)
    {
        var cleanText = StripHtml(text);
        var paragraphs = cleanText.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        using var zip = ZipFile.Open(path, ZipArchiveMode.Create);
        // [Content_Types].xml
        var ctEntry = zip.CreateEntry("[Content_Types].xml");
        using (var s = ctEntry.Open())
        using (var w = new StreamWriter(s))
            w.Write(@"<?xml version=""1.0""?><Types xmlns=""http://schemas.openxmlformats.org/package/2006/content-types""><Default Extension=""rels"" ContentType=""application/vnd.openxmlformats-package.relationships+xml""/><Default Extension=""xml"" ContentType=""application/xml""/><Override PartName=""/word/document.xml"" ContentType=""application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml""/></Types>");

        // _rels/.rels
        var relsEntry = zip.CreateEntry("_rels/.rels");
        using (var s = relsEntry.Open())
        using (var w = new StreamWriter(s))
            w.Write(@"<?xml version=""1.0""?><Relationships xmlns=""http://schemas.openxmlformats.org/package/2006/relationships""><Relationship Id=""rId1"" Type=""http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"" Target=""word/document.xml""/></Relationships>");

        // word/_rels/document.xml.rels
        var docRels = zip.CreateEntry("word/_rels/document.xml.rels");
        using (var s = docRels.Open())
        using (var w = new StreamWriter(s))
            w.Write(@"<?xml version=""1.0""?><Relationships xmlns=""http://schemas.openxmlformats.org/package/2006/relationships""/>");

        // word/document.xml
        var docEntry = zip.CreateEntry("word/document.xml");
        using (var s = docEntry.Open())
        using (var w = new StreamWriter(s))
        {
            w.Write(@"<?xml version=""1.0"" encoding=""UTF-8"" standalone=""yes""?><w:document xmlns:w=""http://schemas.openxmlformats.org/wordprocessingml/2006/main""><w:body>");
            foreach (var para in paragraphs)
            {
                var escaped = System.Net.WebUtility.HtmlEncode(para.Trim());
                if (!string.IsNullOrWhiteSpace(escaped))
                    w.Write($"<w:p><w:r><w:t xml:space=\"preserve\">{escaped}</w:t></w:r></w:p>");
            }
            w.Write("</w:body></w:document>");
        }
    }

    // ---- Helpers ----
    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return "";
        return Regex.Replace(html, "<[^>]+>", "").Replace("&nbsp;", " ").Replace("&amp;", "&").Trim();
    }

    private static bool IsMarkdown(string text)
    {
        return Regex.IsMatch(text, @"^#{1,6}\s|^\*{1,3}\s|^-{3,}|^```|\[.+?\]\(.+?\)", RegexOptions.Multiline);
    }

    private static string MarkdownToHtml(string md)
    {
        var sb = new StringBuilder("<html><body>\n");
        var lines = md.Split('\n');
        bool inCode = false;

        foreach (var line in lines)
        {
            var trimmed = line.TrimEnd();
            if (trimmed.StartsWith("```")) { inCode = !inCode; sb.AppendLine(inCode ? "<pre><code>" : "</code></pre>"); continue; }
            if (inCode) { sb.AppendLine(System.Net.WebUtility.HtmlEncode(trimmed)); continue; }
            if (trimmed.StartsWith("##### ")) sb.AppendLine($"<h5>{trimmed[6..]}</h5>");
            else if (trimmed.StartsWith("#### ")) sb.AppendLine($"<h4>{trimmed[5..]}</h4>");
            else if (trimmed.StartsWith("### ")) sb.AppendLine($"<h3>{trimmed[4..]}</h3>");
            else if (trimmed.StartsWith("## ")) sb.AppendLine($"<h2>{trimmed[3..]}</h2>");
            else if (trimmed.StartsWith("# ")) sb.AppendLine($"<h1>{trimmed[2..]}</h1>");
            else if (string.IsNullOrWhiteSpace(trimmed)) sb.AppendLine("<br/>");
            else sb.AppendLine($"<p>{BoldItalic(trimmed)}</p>");
        }

        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    private static string BoldItalic(string text)
    {
        text = Regex.Replace(text, @"\*\*\*(.+?)\*\*\*", "<b><i>$1</i></b>");
        text = Regex.Replace(text, @"\*\*(.+?)\*\*", "<b>$1</b>");
        text = Regex.Replace(text, @"\*(.+?)\*", "<i>$1</i>");
        text = Regex.Replace(text, @"\[(.+?)\]\((.+?)\)", "<a href=\"$2\">$1</a>");
        return text;
    }

    private static string ParagraphsToHtml(string text)
    {
        return string.Join("\n", text.Split('\n').Select(p =>
            string.IsNullOrWhiteSpace(p) ? "<br/>" : $"<p>{System.Net.WebUtility.HtmlEncode(p)}</p>"));
    }
}
