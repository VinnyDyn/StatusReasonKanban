import {IInputs, IOutputs} from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import { create } from "domain";
import { ActionContract } from "./ActionContract";
import { OptionSetMetadata } from "./OptionSetMetadata";
import { ActionResponse } from "./ActionResponse";
import { UpdateRequest } from "./UpdateRequest";
import { StatelessComponent } from "react";
import { Helper } from "./Helper";
type DataSet = ComponentFramework.PropertyTypes.DataSet;

export class StatusReasonKanban implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private _options : OptionSetMetadata[];
	private _undefinedOption : HTMLTableDataCellElement;
	private _selectedRecord : HTMLDivElement;
	private _container : HTMLTableElement;
	private _context : ComponentFramework.Context<IInputs>;
	private _entityType : string;

	/**
	 * Empty constructor.
	 */
	constructor()
	{
		
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		this._entityType =context.parameters.DataSet.getTargetEntityType();

		//Table
		this._container = document.createElement("table");
		this._container.setAttribute("class","Container");
		container.append(this._container);

		//Tds - Generate dynamic view by statusCode
		this.RetrieveOptionSetMetadata(this._entityType);
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		//If the view is loaded
		if(!context.parameters.DataSet.loading){
			this._context = context;
			this.RenderCards();
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {}

	/**
	 * Get StatusReason metadata
	 * @param EntityLogicalName 
	 */
	public RetrieveOptionSetMetadata(EntityLogicalName : string)
	{
		let request = new ActionContract();
		request.EntityLogicalName = EntityLogicalName; 
		request.getMetadata = function() {
			return {
				boundParameter: null,
				parameterTypes: {
					"EntityLogicalName": {
						"typeName": "Edm.String",
						"structuralProperty": 1
					}
				},
				operationType: 0,
				operationName: "vnb_RetrieveOptionSetMetadata"
			};
		};

		const self = this;
		Xrm.WebApi.online.execute(request).then(
			function (result) {
				if (result.ok) {
					self.FetchStream(self, result.body);
				}
			},
			function (error) {
				Xrm.Utility.alertDialog(error.message, function(){});
			}
		);
	}
	public FetchStream(caller : StatusReasonKanban, stream : ReadableStream) : void {
		const reader = stream.getReader();
		let text : string;
		text = "";
		reader.read().then(function processText({ done, value }) : void {  
			
			if(done)
			{
				let content: ActionResponse = JSON.parse(text);
				caller._options = JSON.parse(content.OptionSetMetadata);
				caller.RenderKanban();
				caller.RenderCards();
				return;
			}
			
			if(value)
				text += new TextDecoder("utf-8").decode(value);
				reader.read().then(processText);
		});
	}

	/**
	 * Render options as a Kanban
	 */
	public RenderKanban()
	{
		//Render a Undefined Option, if the the view don't has a StatusCode column the record will assigned to this DIV
		this.UndefinedOption();

		for (let index = 0; index < this._options.length; index++) {

			//Get Option
			let option = this._options[index] as OptionSetMetadata;
			
			//td
			let tdOption : HTMLTableDataCellElement;
			tdOption = document.createElement("td");
			tdOption.setAttribute("class","Option");
			tdOption.id = option.StateCode + ";" + option.StatusCode;
			tdOption.style.backgroundColor = option.Color != null ? option.Color : "transparent";
			tdOption.addEventListener("dragover", this.AllowDrop.bind(this)); 
			tdOption.addEventListener("drop", this.OnDrop.bind(this, tdOption)); 
			this._container.append(tdOption);

			//label
			let labelOption : HTMLLabelElement;
			labelOption = document.createElement("label");
			labelOption.innerText = option.Label;
			tdOption.append(labelOption);
		}
	}

	/**
	 * Render the view records as cards on kanban
	 */
	private RenderCards() {
		this.ClearContainer();
		let columns = this.GetColumns(this._context);
		this.CreateRecordDiv(this._context, columns);
		this.HiddenUndefined();
	}

	/**
	 * Retrieve all columns in the view
	 * @param context 
	 */
	private GetColumns(context: ComponentFramework.Context<IInputs>) : DataSetInterfaces.Column[]
	{
		//alert(context.parameters.dataSet.columns.length);
		//No columns
		if (!context.parameters.DataSet.columns && context.parameters.DataSet.columns!.length === 0) {
			return [];
		}
		
		let columns = context.parameters.DataSet.columns!.filter(function (columnItem:DataSetInterfaces.Column) { 
			return columnItem.order >= 0 });
		
		// Sort those columns so that they will be rendered in order
		columns.sort(function (a:DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
			return a.order - b.order;
		});

		return columns;
	}

	/**
	 * Create a DIV to represents the record
	 * @param context 
	 * @param columns 
	 */
	private CreateRecordDiv(context: ComponentFramework.Context<IInputs>, columns: DataSetInterfaces.Column[])
	{
		if(context.parameters.DataSet.sortedRecordIds.length > 0)
		{
			//RECORD
			for(let recordId of context.parameters.DataSet.sortedRecordIds){

				//ENTITY REFERENCE
				let entityReference = context.parameters.DataSet.records[recordId].getNamedReference();

				//DIV
				let recordDiv : HTMLDivElement;
				recordDiv = document.createElement("div");
				recordDiv.setAttribute("class","RecordGrab");
				recordDiv.id = recordId.toString();
				recordDiv.setAttribute("entityType",entityReference.entityType as string);
				recordDiv.setAttribute("draggable", true.toString());
				recordDiv.addEventListener("dragstart", this.OnDrag.bind(this, recordDiv)); 
				recordDiv.addEventListener("dblclick", this.OpenRecord.bind(this, entityReference.entityType as string,recordDiv.id)); 

				let statusCode : string = "";

				//Columns in view / value
				columns.forEach(function(column, index){
					if(column.name == "statuscode")
						statusCode = context.parameters.DataSet.records[recordId].getValue(column.name).toString();
					else
					{
						let value = context.parameters.DataSet.records[recordId].getFormattedValue(column.name);
						if(value)
						{
							//P
							let attributeValue = document.createElement("p");
							attributeValue.textContent = value;
							recordDiv.append(attributeValue);
						}
					}
				});

				//Select TD
				this.DefineParent(statusCode).append(recordDiv);
			}
		}
	}

	/**
	 * Define where the card (record) will be displayed
	 * @param statusCode option number
	 */
	private DefineParent(statusCode : string) : HTMLTableDataCellElement
	{
		if(statusCode)
		{
			let options = document.getElementsByClassName("Option");
			for (let index = 0; index < options.length; index++) {
				const option = options[index] as HTMLTableDataCellElement;

				let re = ";"+statusCode;
				if (option.id.search(re) != -1)
					return option;
			}
			return this._undefinedOption;
		}
		else
			return this._undefinedOption;
	}

	/**
	 * Render a stage for records out of option's range
	 */
	private UndefinedOption()
	{
		//td
		let tdOption : HTMLTableDataCellElement;
		tdOption = document.createElement("td");
		tdOption.setAttribute("class","Option");
		tdOption.id = "undefined";
		tdOption.style.backgroundColor = "transparent";

		//Append
		this._container.append(tdOption);
		this._undefinedOption = tdOption;
	}

	/**
	 * Hidden the undefined stage, if it hasn't cards (records)
	 */
	private HiddenUndefined() {
		if (this._undefinedOption.childElementCount == 0)
		{
			this._undefinedOption.style.visibility = "hidden";
			this._undefinedOption.style.width = "0px";
		}
	}

	/**
	 * Clear all components by Option
	 */
	private ClearContainer() {
		let options = document.getElementsByClassName("Option");
		for (let index = 0; index < options.length; index++) {
			const option = options[index] as HTMLTableDataCellElement;
			while (option.lastChild) {
				var element = option.lastChild as HTMLElement;     
        		if (element.tagName === "LABEL")
					break;
				else
					option.removeChild(element);
			}
		}
	}

	/**
	 * Change the Status Record
	 */
	private SetStateRequest(td : HTMLTableDataCellElement)
	{
		//Workaround, sometimes the record don't have the entitytype
		let entityType = this._selectedRecord.getAttribute("entityType");
		if(!entityType)
		   entityType = this._entityType;

		let updateRequest : UpdateRequest;
		updateRequest = new UpdateRequest();
		updateRequest.statecode = Number(td.id.split(";")[0]);
		updateRequest.statuscode = Number(td.id.split(";")[1]);

		const self = this; 
		var req = new XMLHttpRequest();
		req.open("PATCH", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/"+Helper.CorrectEntityLogicalName(entityType)+"("+this._selectedRecord.id+")", true);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function() {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 204) {
						td.append(self._selectedRecord);
						self._selectedRecord = document.createElement("div");
				} else {
					let exception = JSON.parse(this.responseText);
					let errorMessage  = exception.error.message;
					alert(errorMessage);
				}
			}
		};
		req.send(JSON.stringify(updateRequest));
	}

	/**
	 * Double click on Cards
	 * @param entityId 
	 */
	public OpenRecord(entityType : string, entityId : string)
	{
		if(!entityType)
		  entityType = this._entityType;

		Xrm.Utility.openEntityForm(entityType,entityId, {});
	}

	public AllowDrop(event:Event)
	{
		event.preventDefault();
	}

	public OnDrop(td: HTMLTableDataCellElement)
	{
		if(this._selectedRecord && this._selectedRecord.parentElement && this._selectedRecord.id)
		{
			this._selectedRecord.setAttribute("class","RecordGrab");
			this.SetStateRequest(td);
		}
	}

	public OnDrag(record:HTMLDivElement)
	{
		record.setAttribute("class","RecordGrabbing");
		this._selectedRecord = record;
	}
}