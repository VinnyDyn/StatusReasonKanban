using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VinnyB.KanbanStatusReason.Business;
using VinnyB.KanbanStatusReason.Extensions;

namespace VinnyB.KanbanStatusReason
{
    public class RetrieveOptionSetMetadata : CodeActivity
    {
        [Input("EntityLogicalName")]
        public InArgument<string> EntityLogicalName { get; set; }

        [Output("OptionSetMetadata")]
        public OutArgument<string> OptionSetMetadata { get; set; }

        protected override void Execute(CodeActivityContext context)
        {
            if (context == null) { throw new InvalidPluginExecutionException("Context not found!"); };

            var workflowContext = context.GetExtension<IWorkflowContext>();
            var serviceFactory = context.GetExtension<IOrganizationServiceFactory>();
            var orgService = serviceFactory.CreateOrganizationService(workflowContext.UserId);

            DynamicsDAO dynamicsDAO = new DynamicsDAO(orgService);
            OptionMetadataCollection optionMetadata = dynamicsDAO.GetOptionsSet(EntityLogicalName.Get<string>(context), "statuscode");
            if (optionMetadata != null)
                OptionSetMetadata.Set(context, optionMetadata.ConvertToModel());
            else
                OptionSetMetadata.Set(context, string.Empty);
        }
    }
}