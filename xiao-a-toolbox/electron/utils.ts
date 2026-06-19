export function parseFfmpegProgress(line: string): { percent: number; time: string; speed: string } | null {
  const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (!timeMatch) return null;
  const hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const seconds = parseFloat(timeMatch[3]);
  const timeSeconds = hours * 3600 + minutes * 60 + seconds;
  const durationMatch = line.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  let percent = 0;
  if (durationMatch) {
    const dHours = parseInt(durationMatch[1]);
    const dMinutes = parseInt(durationMatch[2]);
    const dSeconds = parseFloat(durationMatch[3]);
    const totalSeconds = dHours * 3600 + dMinutes * 60 + dSeconds;
    percent = totalSeconds > 0 ? Math.round((timeSeconds / totalSeconds) * 100) : 0;
  }
  const speedMatch = line.match(/speed=\s*([\d.]+)x/);
  return {
    percent: Math.min(percent, 100),
    time: timeMatch[0].replace("time=", ""),
    speed: speedMatch ? `${speedMatch[1]}x` : "",
  };
}
