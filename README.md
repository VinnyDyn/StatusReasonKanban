# StatusReason Kanban

Convert a simple view to a Kanban, the optionssets on present in the view will define how the Kanban will be rendered.

![alt text](https://github.com/VinnyDyn/StatusReasonKanban/blob/master/Images/control-presentationv2.gif)

### Enable To
- Entities
- Views (if the view is added a dashboard, the Quick Find and View Selector wont displayed)
- Sub Grids

### Prerequisites
The component needs at least one attribute of type option set (StatusCode or OptionSet) on view.

#### Ready to use
The [managed](https://github.com/VinnyDyn/StatusReasonKanban/releases/download/1.0.0/VinnyBControls_1_0_0_0_managed.zip) solution is ideal for non developers. Import and use.

#### Developers
The PCF call a Action (process) to obtain informations about the statuscode of entity, import the [unmanaged](https://github.com/VinnyDyn/StatusReasonKanban/releases/download/1.0.0/VinnyBControls_1_0_0_0.zip) solution with the action 'vnb_RetrieveOptionSetMetadata' to tests.

### Features
- Respect the View Selector.
- Display Search Box.
- Compatible with Global OptionSets.
- All options are based on view.
- Drag and drop the cards between the option values.
- Color respect the option set definitions.
- Attributes will be displayed based on the associated view and if they has value.
- With a double click, access the form record.
- No custom workflows or actions.

### Incompatible with
- Specials status change: WonOpportunity, IncidentResolution, CloseQuoteRequest, etc..