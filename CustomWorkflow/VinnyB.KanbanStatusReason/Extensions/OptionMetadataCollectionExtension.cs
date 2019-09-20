using Microsoft.Xrm.Sdk.Metadata;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;
using VinnyB.KanbanStatusReason.Models;

namespace VinnyB.KanbanStatusReason.Extensions
{
    public static class OptionMetadataCollectionExtension
    {
        /// <summary>
        /// Convert OptionMetadataCollection to  List<OptionSetMetadataModel> 
        /// </summary>
        /// <param name="_this">OptionMetadataCollection</param>
        /// <returns>string</returns>
        public static string ConvertToModel(this OptionMetadataCollection _this)
        {
            List<OptionSetMetadataModel> options = new List<OptionSetMetadataModel>();

            foreach (StatusOptionMetadata option_ in _this)
            {
                OptionSetMetadataModel model = new OptionSetMetadataModel();
                model.Label = option_?.Label?.UserLocalizedLabel?.Label != null ? option_.Label.UserLocalizedLabel.Label : string.Empty;
                model.Color = option_?.Color;
                model.StatusCode = option_.Value.Value;
                model.StateCode = (int)((StatusOptionMetadata)option_).State; ;// option_.ParentValues != null ? option_.ParentValues.FirstOrDefault() : -450;
                options.Add(model);
            }

            return ToJSON(options);
        }

        /// <summary>
        /// Return a JSON based on OptionSetMetadataModel[] 
        /// </summary>
        /// <param name="_this">List<OptionSetMetadataModel></param>
        /// <returns>string</returns>
        private static string ToJSON(List<OptionSetMetadataModel> _options)
        {
            using (MemoryStream memoryStream = new MemoryStream())
            {
                DataContractJsonSerializer serializer = new DataContractJsonSerializer(_options.GetType());
                serializer.WriteObject(memoryStream, _options);
                return Encoding.UTF8.GetString(memoryStream.ToArray());
            }
        }
    }
}
