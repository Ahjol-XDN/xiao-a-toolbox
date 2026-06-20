using System.Text.Json.Serialization;

namespace XiaoAToolbox.Models;

public class MediaInfo
{
    [JsonPropertyName("format")]
    public MediaFormat? Format { get; set; }

    [JsonPropertyName("streams")]
    public List<MediaStream>? Streams { get; set; }
}

public class MediaFormat
{
    [JsonPropertyName("filename")]
    public string? Filename { get; set; }

    [JsonPropertyName("duration")]
    public string? Duration { get; set; }

    [JsonPropertyName("size")]
    public string? Size { get; set; }

    [JsonPropertyName("bit_rate")]
    public string? BitRate { get; set; }
}

public class MediaStream
{
    [JsonPropertyName("codec_type")]
    public string? CodecType { get; set; }

    [JsonPropertyName("codec_name")]
    public string? CodecName { get; set; }

    [JsonPropertyName("width")]
    public int Width { get; set; }

    [JsonPropertyName("height")]
    public int Height { get; set; }

    [JsonPropertyName("r_frame_rate")]
    public string? FrameRate { get; set; }

    [JsonPropertyName("sample_rate")]
    public string? SampleRate { get; set; }

    [JsonPropertyName("channels")]
    public int Channels { get; set; }
}
