using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Wox.Plugin;

namespace TodoTxtPowerToysPlugin
{
    public class Main : IPlugin
    {
        private PluginInitContext? _context;
        private string? _iconPath;

        public static string PluginID => "E2D7F39C-8A9F-4D2A-B981-FA7EFE028BE9";

        public string Name => "Todo.txt";
        public string Description => "Aufgaben in todo.txt direkt suchen, erstellen und als erledigt markieren.";

        public void Init(PluginInitContext context)
        {
            _context = context;
            _iconPath = "Images/icon.png";
        }

        public List<Result> Query(Query query)
        {
            var results = new List<Result>();
            string todoFilePath = GetTodoFilePath();

            if (string.IsNullOrEmpty(todoFilePath) || !File.Exists(todoFilePath))
            {
                results.Add(new Result
                {
                    Title = "Keine todo.txt konfiguriert",
                    SubTitle = "Bitte wähle in der Desktop-App eine todo.txt Datei aus.",
                    IcoPath = _iconPath,
                    Action = _ => true
                });
                return results;
            }

            string search = query.Search.Trim();

            // Check if the user wants to add a new task (starts with "+")
            if (search.StartsWith("+"))
            {
                string newTaskContent = search.Substring(1).Trim();
                if (!string.IsNullOrEmpty(newTaskContent))
                {
                    results.Add(new Result
                    {
                        Title = $"Neue Aufgabe erstellen: \"{newTaskContent}\"",
                        SubTitle = $"Fügt die Aufgabe zu '{Path.GetFileName(todoFilePath)}' hinzu.",
                        IcoPath = _iconPath,
                        Action = _ =>
                        {
                            AddTask(todoFilePath, newTaskContent);
                            return true;
                        }
                    });
                    return results;
                }
            }

            // Otherwise, read and filter tasks
            try
            {
                var lines = File.ReadAllLines(todoFilePath)
                    .Select((line, index) => new { Line = line, Index = index })
                    .Where(x => !string.IsNullOrWhiteSpace(x.Line))
                    .ToList();

                var filtered = lines;
                if (!string.IsNullOrEmpty(search))
                {
                    filtered = lines
                        .Where(x => x.Line.Contains(search, StringComparison.OrdinalIgnoreCase))
                        .ToList();
                }

                foreach (var item in filtered)
                {
                    bool isCompleted = item.Line.StartsWith("x ", StringComparison.OrdinalIgnoreCase);
                    string displayTitle = item.Line;
                    string actionSubtitle = isCompleted 
                        ? "Aufgabe ist erledigt. Drücke Enter zum Reaktivieren." 
                        : "Aufgabe ist aktiv. Drücke Enter zum Erledigen.";

                    results.Add(new Result
                    {
                        Title = displayTitle,
                        SubTitle = actionSubtitle,
                        IcoPath = _iconPath,
                        Action = _ =>
                        {
                            ToggleTaskCompletion(todoFilePath, item.Index);
                            return true;
                        }
                    });
                }

                if (results.Count == 0 && !string.IsNullOrEmpty(search))
                {
                    results.Add(new Result
                    {
                        Title = $"Keine passende Aufgabe gefunden für: \"{search}\"",
                        SubTitle = "Tippe '+ <Aufgabe>' um eine neue Aufgabe zu erstellen.",
                        IcoPath = _iconPath,
                        Action = _ => true
                    });
                }
            }
            catch (Exception ex)
            {
                results.Add(new Result
                {
                    Title = "Fehler beim Lesen der todo.txt",
                    SubTitle = ex.Message,
                    IcoPath = _iconPath,
                    Action = _ => true
                });
            }

            return results;
        }

        private string GetTodoFilePath()
        {
            try
            {
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                string configPath = Path.Combine(appData, "Todo.txt", "file-paths.json");
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("todo", out var todoProp))
                    {
                        return todoProp.GetString() ?? "";
                    }
                }
            }
            catch
            {
                // Ignore and fall back
            }
            return "";
        }

        private void AddTask(string filePath, string taskContent)
        {
            try
            {
                string today = DateTime.Now.ToString("yyyy-MM-dd");
                string line = $"{today} {taskContent}";
                File.AppendAllLines(filePath, new[] { line });
            }
            catch (Exception)
            {
                // Handle/ignore
            }
        }

        private void ToggleTaskCompletion(string filePath, int lineIndex)
        {
            try
            {
                var lines = File.ReadAllLines(filePath).ToList();
                if (lineIndex < 0 || lineIndex >= lines.Count) return;

                string line = lines[lineIndex];
                if (line.StartsWith("x ", StringComparison.OrdinalIgnoreCase))
                {
                    // Re-activate
                    string remaining = line.Substring(2).TrimStart();
                    if (remaining.Length >= 10 && 
                        char.IsDigit(remaining[0]) && char.IsDigit(remaining[1]) && char.IsDigit(remaining[2]) && char.IsDigit(remaining[3]) &&
                        remaining[4] == '-' &&
                        char.IsDigit(remaining[5]) && char.IsDigit(remaining[6]) &&
                        remaining[7] == '-' &&
                        char.IsDigit(remaining[8]) && char.IsDigit(remaining[9]))
                    {
                        remaining = remaining.Substring(10).TrimStart();
                    }
                    lines[lineIndex] = remaining;
                }
                else
                {
                    // Complete
                    string today = DateTime.Now.ToString("yyyy-MM-dd");
                    lines[lineIndex] = $"x {today} {line}";
                }

                File.WriteAllLines(filePath, lines);
            }
            catch (Exception)
            {
                // Handle/ignore
            }
        }
    }
}
