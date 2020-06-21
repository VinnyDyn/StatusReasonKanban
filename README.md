# StatusReason Kanban

Convert a simple view to a Kanban, the optionssets on present in the view will define how the Kanban will be rendered.

![alt text](https://github.com/VinnyDyn/StatusReasonKanban/blob/master/Images/control-presentationv2.gif)

### Enable To
- Entities
- Views (if the view is added a dashboard, the Quick Find and View Selector wont displayed)
- Sub Grids

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

### Prerequisites
The component needs at least one attribute of type option set (StatusCode or OptionSet) on view.

#### Ready to use
The [managed](https://github.com/VinnyDyn/StatusReasonKanban/releases/tag/1.9.4.0) solution is ideal for non developers. Import and use.

### Incompatible with
- Specials status change: WonOpportunity, IncidentResolution, CloseQuoteRequest, etc..
