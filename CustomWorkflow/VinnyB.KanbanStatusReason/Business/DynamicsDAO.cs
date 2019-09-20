using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VinnyB.KanbanStatusReason.Business
{
    public class DynamicsDAO
    {
        private IOrganizationService Service;

        public DynamicsDAO(IOrganizationService service) { this.Service = service; }

        /// <summary>
        /// Retrieve all labels of OptionSet
        /// </summary>
        /// <param name="entityName">Entity Logical Name</param>
        /// <param name="attributeName">Attribute Logical Name</param>
        /// <returns>OptionMetadataCollection</returns>
        public OptionMetadataCollection GetOptionsSet(string entityName, string attributeName)
        {
            RetrieveAttributeRequest retrieveAttributeRequest = new RetrieveAttributeRequest
            {
                EntityLogicalName = entityName,
                LogicalName = attributeName,
                RetrieveAsIfPublished = true
            };
            RetrieveAttributeResponse retrieveAttributeResponse = (RetrieveAttributeResponse)Service.Execute(retrieveAttributeRequest);
            StatusAttributeMetadata attributeMetadata = (StatusAttributeMetadata)retrieveAttributeResponse?.AttributeMetadata;
            if (attributeMetadata == null) return null;
            return attributeMetadata?.OptionSet?.Options;
        }
    }
}
