using System.Windows;
using System.Windows.Controls;
using XiaoAToolbox.ViewModels;

namespace XiaoAToolbox.Views;

public partial class PdfView : UserControl
{
    public PdfView() { InitializeComponent(); }
    private void OnDrop(object sender, DragEventArgs e)
    { if (e.Data.GetData(DataFormats.FileDrop) is string[] files && DataContext is PdfViewModel vm) foreach (var f in files) vm.AddFile(f); }
    private void RemoveFile(object sender, RoutedEventArgs e)
    { if (sender is Button btn && btn.Tag is string path && DataContext is PdfViewModel vm) { var item = vm.Files.FirstOrDefault(f => f.Path == path); if (item != null) vm.Files.Remove(item); } }
    private void OnMergeChecked(object sender, RoutedEventArgs e) { if (DataContext is PdfViewModel vm) vm.Mode = "merge"; }
    private void OnSplitChecked(object sender, RoutedEventArgs e) { if (DataContext is PdfViewModel vm) vm.Mode = "split"; }
}
