import { IInputs, IOutputs } from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import { Attribute } from "./Attribute";
import { Option } from "./Option";
type DataSet = ComponentFramework.PropertyTypes.DataSet;

export class StatusReasonKanban implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private _context: ComponentFramework.Context<IInputs>;

	private _entityType: string;
	private _entitySetName: string;
	private _attributes: Attribute[];
	private _selectedAttribute: Attribute | undefined;
	private _viewId: string;

	private _container: HTMLDivElement;
	private _buttons: HTMLDivElement;
	private _paging: HTMLDivElement;

	private _kanban: HTMLDivElement;
	private _selectedRecord: HTMLDivElement;
	private _undefinedTitle: HTMLDivElement;
	private _undefinedOption: HTMLDivElement;


	/**
	 * Empty constructor.
	 */
	constructor() {
		this._attributes = new Array<Attribute>();
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {

		//Main Variables
		this._context = context;
		this._entityType = this._context.parameters.DataSet.getTargetEntityType();
		this._entitySetName = this.RetrieveEntityMetada();

		//Main
		this._container = container;

		//Set Max, is it Valid?
		this._context.parameters.DataSet.paging.setPageSize(250);
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {

		//Context Update
		this._context = context;

		//If the view is loaded
		if (!this._context.parameters.DataSet.loading) {
			this.ClearContainer();
			this.RenderAttributeSelector();
			this.RenderTotalCount();
			if (this._selectedAttribute == undefined && this._attributes.length > 0)
				this._selectedAttribute = this._attributes[0];

			if (this._selectedAttribute != undefined)
				this.RenderKanban();

			//this.RenderNextAndPrevious();
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void { }


	// ENTITY SCHEMA -----------------------------------------------------------------------------------------------------------------------------
	/**
	 * Retrieve EntitySetName
	 * @param entityLogicalName 
	 */
	private RetrieveEntityMetada(): string {

		let entitySet: string;
		entitySet = "";
		let req = new XMLHttpRequest();
		req.open("GET", (<any>this._context).page.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + this._entityType + "')?$select=EntitySetName", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 200) {
					var result = JSON.parse(this.response);
					entitySet = result.EntitySetName;
				}
				else {
					entitySet = "";
				}
			}
		};
		req.send();

		return entitySet;
	}

	public RenderTotalCount() {
		let label = document.createElement("label");
		label.innerText = this._context.parameters.DataSet.sortedRecordIds.length + "/" + this._context.parameters.DataSet.paging.totalResultCount.toString();
		this._buttons.append(label);
	}

	public RenderNextAndPrevious() {
		this._paging = document.createElement("div");
		this._paging.setAttribute("class", "buttons");
		this._container.append(this._paging);

		let previous = document.createElement("button");
		previous.addEventListener("click", this.PreviousPage.bind(this));
		previous.innerText = "<";
		this._paging.append(previous);

		let next = document.createElement("button");
		next.addEventListener("click", this.NextPage.bind(this));
		next.innerText = ">";
		this._paging.append(next);
	}
	public NextPage() {
		if (this._context.parameters.DataSet.paging.hasNextPage) {
			this.ClearKanban();
			this._context.parameters.DataSet.paging.loadNextPage();
		}
	}
	public PreviousPage() {
		if (this._context.parameters.DataSet.paging.hasPreviousPage) {
			this.ClearKanban();
			this._context.parameters.DataSet.paging.loadPreviousPage();
		}
	}

	// SELECTOR ----------------------------------------------------------------------------------------------------------------------------------
	/**
	 * Selector with all OptionSet's attributes
	 */
	public RenderAttributeSelector() {

		//Prevent unnecessary webapi calls
		if (this._viewId != this._context.parameters.DataSet.getViewId()) {

			//Update selected view
			this._viewId = this._context.parameters.DataSet.getViewId();

			// Filter only OptionSets
			let optionsets = this.GetColumns().filter(f => f.dataType == "OptionSet");
			optionsets.forEach(option_ => {

				if (option_.name == "statuscode") {
					this.RetrieveStatusMetadata(option_.name);
				}
				else
					this.RetrieveOptionSetMetadata(option_.name);
			});
		}

		// Create a Selector
		this._buttons = document.createElement("div");
		this._buttons.setAttribute("class", "buttons");
		this._container.append(this._buttons);

		// Add Options
		this._attributes.forEach(attribute_ => {
			let option = document.createElement("button");
			option.innerText = attribute_.Label;
			option.id = attribute_.LogicalName;
			option.addEventListener("click", this.OnAttributeChange.bind(this, option.id));
			this._buttons.append(option);
		});
	}

	/**
	 * Retrieve OptionSet
	 * @param attributeLogicalName 
	 */
	private RetrieveOptionSetMetadata(attributeLogicalName: string) {

		let languageCode = this._context.userSettings.languageId;
		let attribute = new Attribute();
		let req = new XMLHttpRequest();
		req.open("GET", (<any>this._context).page.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + this._entityType + "')/Attributes/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$filter=LogicalName eq '" + attributeLogicalName + "'&$expand=OptionSet", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 200) {
					var result = JSON.parse(this.response);
					if (result !== undefined && result.value.length > 0) {

						//Attribute
						attribute.Label = result.value[0].OptionSet.DisplayName.LocalizedLabels.find((f: any) => f.LanguageCode == languageCode).Label;
						attribute.LogicalName = attributeLogicalName;

						//Options
						var options = result.value[0].OptionSet.Options;
						for (let index = 0; index < options.length; index++) {
							const option_ = options[index];

							var option = new Option();
							option.Label = option_.Label.LocalizedLabels.find((f: any) => f.LanguageCode == languageCode).Label;
							option.Value = option_.Value;
							option.State = null;
							option.Color = option_.Color;
							attribute.Options.push(option);
						}
					}
				}
			}
		};
		req.send();

		this._attributes.push(attribute);
	}

	/**
	 * Retrieve StatusCode
	 * @param attributeLogicalName 
	 */
	private RetrieveStatusMetadata(attributeLogicalName: string) {

		let languageCode = this._context.userSettings.languageId;
		let attribute = new Attribute();
		let req = new XMLHttpRequest();
		req.open("GET", (<any>this._context).page.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + this._entityType + "')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName&$expand=OptionSet", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 200) {
					var result = JSON.parse(this.response);
					if (result !== undefined && result.value.length > 0) {

						//Attribute
						attribute.Label = result.value[0].OptionSet.DisplayName.LocalizedLabels.find((f: any) => f.LanguageCode == languageCode).Label;
						attribute.LogicalName = attributeLogicalName;

						//Options
						var options = result.value[0].OptionSet.Options;
						for (let index = 0; index < options.length; index++) {
							const option_ = options[index];

							var option = new Option();
							option.Label = option_.Label.LocalizedLabels.find((f: any) => f.LanguageCode == languageCode).Label;
							option.Value = option_.Value;
							option.State = option_.State;
							option.Color = option_.Color;
							attribute.Options.push(option);
						}
					}
				}
			}
		};
		req.send();

		this._attributes.push(attribute);
	}

	/**
	 * OnChange Attribute Selector
	 */
	public OnAttributeChange(attributeLogicalName: string) {
		this._selectedAttribute = this._attributes.find(f => f.LogicalName == attributeLogicalName);
		this._context.parameters.DataSet.refresh();
	}

	// KANBAN ------------------------------------------------------------------------------------------------------------------------------------

	/**
	 * Render options as a Kanban
	 */
	public RenderKanban() {

		this.ClearKanban();

		this._kanban = document.createElement("div");
		this._kanban.id = "kanban";
		this._container.append(this._kanban);

		//Titles
		let titles = document.createElement("div");
		titles.setAttribute("class", "flex");
		this._kanban.append(titles);

		//Null Values
		this.UndefinedTitle(titles);

		for (let index = 0; index < this._selectedAttribute!.Options.length; index++) {

			//Get Option
			const option_ = this._selectedAttribute!.Options[index] as Option;

			//label
			let title: HTMLDivElement;
			title = document.createElement("div");
			title.setAttribute("class", "title");
			title.style.color = option_.Color != null ? option_.Color : "black";
			title.innerText = option_.Label;
			titles.append(title);
		}

		//Drag and Drop Area
		let options = document.createElement("div");
		options.setAttribute("class", "flex");
		this._kanban.append(options);

		//Null Values
		this.UndefinedOption(options);

		for (let index = 0; index < this._selectedAttribute!.Options.length; index++) {

			//Get Option
			const option_ = this._selectedAttribute!.Options[index] as Option;

			//td
			let option: HTMLDivElement;
			option = document.createElement("div");
			option.setAttribute("class", "option");
			option.id = option_.State + ";" + option_.Value;
			option.addEventListener("dragover", this.AllowDrop.bind(this));
			option.addEventListener("drop", this.OnDrop.bind(this, option));
			options.append(option);
		}

		this.RenderCards();
	}

	/**
	 * Render the view records as cards on kanban
	 */
	private RenderCards() {
		this.CreateRecordDiv();
		this.HiddenUndefined();
	}

	/**
	 * Retrieve all columns in the view
	 * @param context 
	 */
	private GetColumns(): DataSetInterfaces.Column[] {
		//alert(context.parameters.dataSet.columns.length);
		//No columns
		if (!this._context.parameters.DataSet.columns && this._context.parameters.DataSet.columns!.length === 0) {
			return [];
		}

		let columns = this._context.parameters.DataSet.columns!.filter(function (columnItem: DataSetInterfaces.Column) {
			return columnItem.order >= 0
		});

		// Sort those columns so that they will be rendered in order
		columns.sort(function (a: DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
			return a.order - b.order;
		});

		return columns;
	}

	/**
	 * Create a DIV to represents the record
	 */
	private CreateRecordDiv() {

		let columns = this.GetColumns();

		if (this._context.parameters.DataSet.sortedRecordIds.length > 0) {
			//RECORD
			for (let recordId of this._context.parameters.DataSet.sortedRecordIds) {

				//ENTITY REFERENCE
				let entityReference = this._context.parameters.DataSet.records[recordId].getNamedReference();

				//DIV
				let recordDiv: HTMLDivElement;
				recordDiv = document.createElement("div");
				recordDiv.setAttribute("class", "recordgrab");
				recordDiv.id = recordId.toString();
				recordDiv.setAttribute("entityType", entityReference.entityType as string);
				recordDiv.setAttribute("draggable", true.toString());
				recordDiv.addEventListener("dragstart", this.OnDrag.bind(this, recordDiv));
				recordDiv.addEventListener("dblclick", this.OpenRecord.bind(this, entityReference.entityType as string, recordDiv.id));

				let optionValue: string = "";

				//Columns in view / value
				columns.forEach(column => {
					if (column.name == this._selectedAttribute?.LogicalName) {
						let value = this._context.parameters.DataSet.records[recordId].getValue(column.name);
						if (value)
							optionValue = value.toString();
					}
					else {
						let value = this._context.parameters.DataSet.records[recordId].getFormattedValue(column.name);
						if (value) {
							//P
							let attributeValue = document.createElement("p");
							attributeValue.textContent = value;
							recordDiv.append(attributeValue);
						}
					}
				});

				//Select TD
				this.DefineParent(optionValue).append(recordDiv);
			}
		}
	}

	/**
	 * Define where the card (record) will be displayed
	 * @param optionValue option number
	 */
	private DefineParent(optionValue: string): HTMLDivElement {
		if (optionValue) {
			let options = document.getElementsByClassName("option");
			for (let index = 0; index < options.length; index++) {
				const option = options[index] as HTMLDivElement;

				let re = ";" + optionValue;
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
	private UndefinedOption(options: HTMLDivElement) {
		//td
		let tdOption: HTMLDivElement;
		tdOption = document.createElement("div");
		tdOption.setAttribute("class", "option");
		tdOption.id = "undefined";
		tdOption.style.backgroundColor = "transparent";

		//Append
		options.append(tdOption);
		this._undefinedOption = tdOption;
	}

	/**
 * Render a stage for records out of option's range
 */
	private UndefinedTitle(titles: HTMLDivElement) {
		//td
		this._undefinedTitle = document.createElement("div");
		this._undefinedTitle.setAttribute("class", "title");
		titles.append(this._undefinedTitle);
	}

	/**
	 * Hidden the undefined stage, if it hasn't cards (records)
	 */
	private HiddenUndefined() {
		if (this._undefinedOption.childElementCount == 0) {
			this._undefinedOption.style.flex = "0";
			this._undefinedTitle.style.flex = "0";
		}
	}


	/**
	 * Clear All Components
	 */
	private ClearContainer() {
		while (this._container.firstChild) {
			this._container.removeChild(this._container.firstChild);
		}
	}

	/**
	 * Clear Kanban
	 */
	private ClearKanban() {
		if (this._kanban) {
			while (this._kanban.firstChild) {
				this._kanban.removeChild(this._kanban.firstChild);
			}
		}
	}

	/**
	 * Change the Status Record
	 */
	private SetStateRequest(div: HTMLDivElement) {
		//Workaround, sometimes the record don't have the entitytype
		let entityType = this._selectedRecord.getAttribute("entityType");
		if (!entityType)
			entityType = this._entityType;

		let updateRequest: any;
		updateRequest = {};
		updateRequest.statecode = Number(div.id.split(";")[0]);
		updateRequest.statuscode = Number(div.id.split(";")[1]);

		const self = this;
		var req = new XMLHttpRequest();
		req.open("PATCH", (<any>this._context).page.getClientUrl() + "/api/data/v9.1/" + this._entitySetName + "(" + this._selectedRecord.id + ")", true);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 204) {
					div.append(self._selectedRecord);
					self._selectedRecord = document.createElement("div");
				} else {
					let exception = JSON.parse(this.responseText);
					let errorMessage = exception.error.message;
					alert(errorMessage);
				}
			}
		};
		req.send(JSON.stringify(updateRequest));
	}

	/**
 * Change the Status Record
 */
	private UpdateOptionSetRequest(div: HTMLDivElement) {

		let entity: any;
		entity = {};
		entity[this._selectedAttribute!.LogicalName] = Number(div.id.split(";")[1]);

		const self = this;
		var req = new XMLHttpRequest();
		req.open("PATCH", (<any>this._context).page.getClientUrl() + "/api/data/v9.1/" + this._entitySetName + "(" + this._selectedRecord.id + ")", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 204) {
					div.append(self._selectedRecord);
					self._selectedRecord = document.createElement("div");
				} else {
					let exception = JSON.parse(this.responseText);
					let errorMessage = exception.error.message;
					alert(errorMessage);
				}
			}
		};
		req.send(JSON.stringify(entity));
	}

	/**
	 * Double click on Cards
	 * @param entityId 
	 */
	public OpenRecord(entityType: string, entityId: string) {
		if (!entityType)
			entityType = this._entityType;

		var entityReference: any;
		entityReference = {};
		entityReference.id = entityId;
		entityReference.entityType = entityType;

		this._context.parameters.DataSet.openDatasetItem(entityReference);
	}

	public AllowDrop(event: Event) {
		event.preventDefault();
	}

	public OnDrop(div: HTMLDivElement) {
		if (this._selectedRecord && this._selectedRecord.parentElement && this._selectedRecord.id) {
			this._selectedRecord.setAttribute("class", "recordgrab");

			if (this._selectedAttribute?.LogicalName == "statuscode")
				this.SetStateRequest(div);
			else
				this.UpdateOptionSetRequest(div);
		}
	}

	public OnDrag(record: HTMLDivElement) {
		record.setAttribute("class", "recordgrabing");
		this._selectedRecord = record;
	}
}