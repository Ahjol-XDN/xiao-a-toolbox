using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using XiaoAToolbox.ViewModels;

namespace XiaoAToolbox;

public partial class MainWindow : Window
{
    private MainViewModel VM => (MainViewModel)DataContext;

    public MainWindow()
    {
        InitializeComponent();
        PreviewKeyDown += OnKeyDown;
    }

    private void OnNavClick(object sender, MouseButtonEventArgs e)
    {
        if (sender is Border border && border.Tag is string pageName)
        {
            VM.NavigateCommand.Execute(pageName);
        }
    }

    private void OnKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.O && Keyboard.Modifiers == ModifierKeys.Control)
        {
            if (VM.CurrentPage is VideoViewModel vv) vv.AddFiles();
            else if (VM.CurrentPage is AudioViewModel av) av.AddFiles();
            else if (VM.CurrentPage is DocumentViewModel dv) dv.AddFiles();
            else if (VM.CurrentPage is ImageViewModel iv) iv.AddFiles();
            else if (VM.CurrentPage is PdfViewModel pv) pv.AddFiles();
            else if (VM.CurrentPage is BatchViewModel bv) bv.AddFiles();
            e.Handled = true;
        }
        else if (e.Key == Key.Escape)
        {
            if (VM.CurrentPage is VideoViewModel vv2) vv2.Cancel();
            else if (VM.CurrentPage is AudioViewModel av2) av2.Cancel();
            e.Handled = true;
        }
    }
}