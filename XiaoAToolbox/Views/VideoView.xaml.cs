using System.Windows;
using System.Windows.Controls;
using XiaoAToolbox.ViewModels;

namespace XiaoAToolbox.Views;

public partial class VideoView : UserControl
{
    public VideoView()
    {
        InitializeComponent();
    }

    private void OnDrop(object sender, DragEventArgs e)
    {
        if (e.Data.GetData(DataFormats.FileDrop) is string[] files)
        {
            if (DataContext is VideoViewModel vm)
                foreach (var f in files) vm.AddFile(f);
        }
    }

    private void RemoveFile(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is string path && DataContext is VideoViewModel vm)
        {
            var item = vm.Files.FirstOrDefault(f => f.Path == path);
            if (item != null) vm.Files.Remove(item);
        }
    }

    private void OnModeConvert(object sender, RoutedEventArgs e)
    { if (DataContext is VideoViewModel vm) vm.Mode = "convert"; }

    private void OnModeCompress(object sender, RoutedEventArgs e)
    { if (DataContext is VideoViewModel vm) vm.Mode = "compress"; }

    private void OnModeTrim(object sender, RoutedEventArgs e)
    { if (DataContext is VideoViewModel vm) vm.Mode = "trim"; }

    private void OnModeGif(object sender, RoutedEventArgs e)
    { if (DataContext is VideoViewModel vm) vm.Mode = "gif"; }

    private void OnModeScreenshot(object sender, RoutedEventArgs e)
    { if (DataContext is VideoViewModel vm) vm.Mode = "screenshot"; }
}
