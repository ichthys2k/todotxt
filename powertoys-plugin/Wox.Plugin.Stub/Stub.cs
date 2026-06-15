using System;
using System.Collections.Generic;

namespace Wox.Plugin
{
    public interface IPlugin
    {
        void Init(PluginInitContext context);
        List<Result> Query(Query query);
        string Name { get; }
        string Description { get; }
    }

    public class PluginInitContext
    {
    }

    public class Query
    {
        public string Search { get; set; } = string.Empty;
    }

    public class ActionContext
    {
    }

    public class Result
    {
        public string Title { get; set; } = string.Empty;
        public string SubTitle { get; set; } = string.Empty;
        public string IcoPath { get; set; } = string.Empty;
        public Func<ActionContext, bool>? Action { get; set; }
    }
}
