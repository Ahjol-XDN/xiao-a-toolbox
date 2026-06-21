using System.Windows;
using XiaoAToolbox.Services;

namespace XiaoAToolbox;

public partial class App : Application
{
    private void OnStartup(object sender, StartupEventArgs e)
    {
        try
        {
            EngineService.DetectEngines();
            var config = new ConfigService().Load();
            ApplyTheme(config.Theme);
            LocalizationService.Instance.SetLanguage(config.Language);
            var mainWindow = new MainWindow();
            mainWindow.Show();
        }
        catch (Exception ex)
        {
            var logPath = System.IO.Path.Combine(
                System.Environment.GetFolderPath(System.Environment.SpecialFolder.Desktop),
                "xiao-a-crash.log");
            System.IO.File.WriteAllText(logPath, ex.ToString());
            MessageBox.Show("启动失败，错误日志已保存到桌面。\n\n" + ex.Message, "错误", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    public static void ApplyTheme(string theme)
    {
        var themeName = theme switch
        {
            "dark" => "DarkTheme.xaml",
            "light" => "LightTheme.xaml",
            "auto" => TryDetectSystemTheme(),
            _ => TryDetectSystemTheme()
        } ?? "LightTheme.xaml";

        var uri = new Uri($"pack://application:,,,/Resources/Themes/{themeName}");
        var app = Current;

        var toRemove = new List<ResourceDictionary>();
        foreach (var dict in app.Resources.MergedDictionaries)
            toRemove.Add(dict);
        foreach (var dict in toRemove)
            app.Resources.MergedDictionaries.Remove(dict);

        app.Resources.MergedDictionaries.Add(new ResourceDictionary { Source = uri });
    }

    private static string? TryDetectSystemTheme()
    {
        try
        {
            var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");
            var appsUseLightTheme = key?.GetValue("AppsUseLightTheme") as int?;
            return appsUseLightTheme == 0 ? "DarkTheme.xaml" : "LightTheme.xaml";
        }
        catch { return "LightTheme.xaml"; }
    }
}
