using System.Windows;
using XiaoAToolbox.Services;

namespace XiaoAToolbox;

public partial class App : Application
{
    public App()
    {
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
    }

    private void OnDispatcherUnhandledException(object sender, System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
    {
        LogCrash(e.Exception);
        MessageBox.Show($"程序发生错误，已保存日志到桌面。\n\n{e.Exception.Message}", "错误",
            MessageBoxButton.OK, MessageBoxImage.Error);
        e.Handled = true;
    }

    private void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        if (e.ExceptionObject is Exception ex)
            LogCrash(ex);
    }

    private void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        LogCrash(e.Exception);
        e.SetObserved();
    }

    private static void LogCrash(Exception ex)
    {
        try
        {
            var logPath = System.IO.Path.Combine(
                System.Environment.GetFolderPath(System.Environment.SpecialFolder.Desktop),
                "xiao-a-crash.log");
            var msg = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {ex}";
            System.IO.File.AppendAllText(logPath, msg + System.Environment.NewLine);
        }
        catch { }
    }

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
            LogCrash(ex);
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
