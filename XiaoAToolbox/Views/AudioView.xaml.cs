using System.Windows;
using System.Windows.Controls;
using XiaoAToolbox.ViewModels;

namespace XiaoAToolbox.Views;

public partial class AudioView : UserControl
{
    public AudioView()
    {
        InitializeComponent();
    }

    private void OnDrop(object sender, DragEventArgs e)
    {
        if (e.Data.GetData(DataFormats.FileDrop) is string[] files && DataContext is AudioViewModel vm)
            foreach (var f in files) vm.AddFile(f);
    }

    private void RemoveFile(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is string path && DataContext is AudioViewModel vm)
        {
            var item = vm.Files.FirstOrDefault(f => f.Path == path);
            if (item != null) vm.Files.Remove(item);
        }
    }

    private void OnMergeChecked(object sender, RoutedEventArgs e)
    {
        if (DataContext is AudioViewModel vm) vm.Mode = "merge";
    }

    private void OnTrimChecked(object sender, RoutedEventArgs e)
    {
        if (DataContext is AudioViewModel vm) vm.Mode = "trim";
    }
}
