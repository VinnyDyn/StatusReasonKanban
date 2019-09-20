using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VinnyB.KanbanStatusReason.Models
{
    public class OptionSetMetadataModel
    {
        public string Label { get; set; }
        public string Color { get; set; }
        public int StatusCode { get; set; }
        public int StateCode { get; set; }
    }
}
